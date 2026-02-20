import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ================= HELPER: GET USER ID ================= */
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return token.replace("session_", "");
}

/* ================= GET: FETCH SAVING GOALS ================= */
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let query = `SELECT id, goal_name, target_amount, saved_amount FROM saving_goals WHERE user_id = ?`;
    const params: any[] = [userId];

    if (search) {
      query += ` AND goal_name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY id DESC`;

    const [rows]: any = await db.query(query, params);
    return NextResponse.json(rows || []);
  } catch (err) {
    return NextResponse.json([], { status: 500 });
  }
}

/* ================= POST: CREATE SAVING GOAL ================= */
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goal_name, target_amount } = await req.json();

    if (!goal_name || !target_amount) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    await db.query(
      `INSERT INTO saving_goals (user_id, goal_name, target_amount, saved_amount) VALUES (?, ?, ?, 0)`,
      [userId, goal_name, target_amount]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ================= PUT: UPDATE / ADD SAVINGS ================= */
export async function PUT(req: Request) {
  const connection = await db.getConnection();
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, add_amount, goal_name, target_amount } = body;

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await connection.beginTransaction();

    const [currentGoal]: any = await connection.query(
      "SELECT saved_amount, goal_name FROM saving_goals WHERE id=? AND user_id=? FOR UPDATE",
      [id, userId]
    );

    if (currentGoal.length === 0) throw new Error("Target tabungan tidak ditemukan");

    const savedSekarang = Number(currentGoal[0].saved_amount);

    if (add_amount !== undefined && add_amount !== 0) {
      const amount = Number(add_amount);

      if (savedSekarang + amount < 0) {
        throw new Error(`Saldo tabungan tidak boleh minus. Sisa Rp ${savedSekarang.toLocaleString()}`);
      }

      if (amount > 0) {
        const [balanceRows]: any = await connection.query(
          `SELECT 
            (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'income') - 
            (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE user_id = ? AND type = 'expense') as totalBalance`,
          [userId, userId]
        );

        const currentRealBalance = Number(balanceRows[0]?.totalBalance || 0);

        if (amount > currentRealBalance) {
          throw new Error(`Saldo utama tidak cukup! Sisa Rp ${currentRealBalance.toLocaleString()}`);
        }
      }

      await connection.query(
        `UPDATE saving_goals SET saved_amount = GREATEST(0, saved_amount + ?) WHERE id=? AND user_id=?`,
        [amount, id, userId]
      );

      const [categoryRows]: any = await connection.query(
        "SELECT id FROM categories WHERE name LIKE '%Tabungan%' OR name LIKE '%Saving%' LIMIT 1"
      );
      const categoryId = categoryRows[0]?.id || null;

      await connection.query(
        `INSERT INTO transactions 
         (user_id, category_id, type, amount, description, saving_id, transaction_date) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          categoryId,
          amount > 0 ? 'expense' : 'income',
          Math.abs(amount),
          amount > 0 ? `Menabung: ${currentGoal[0].goal_name}` : `Tarik: ${currentGoal[0].goal_name}`,
          id
        ]
      );
    }

    if (goal_name || target_amount) {
      await connection.query(
        `UPDATE saving_goals 
         SET goal_name = COALESCE(?, goal_name), 
             target_amount = COALESCE(?, target_amount) 
         WHERE id=? AND user_id=?`,
        [goal_name, target_amount, id, userId]
      );

      if (goal_name) {
        await connection.query(
          `UPDATE transactions 
           SET description = CASE 
             WHEN type = 'expense' THEN CONCAT('Menabung: ', ?) 
             ELSE CONCAT('Tarik: ', ?) 
           END 
           WHERE saving_id = ? AND user_id = ?`,
          [goal_name, goal_name, id, userId]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: "Berhasil diperbarui" });

  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ error: err.message || "Gagal update" }, { status: 400 });
  } finally {
    connection.release();
  }
}

/* ================= DELETE: REMOVE SAVING GOAL (AUTO SYNC BALANCE) ================= */
export async function DELETE(req: Request) {
  const connection = await db.getConnection();
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await connection.beginTransaction();

    // 1️⃣ Validasi kepemilikan
    const [goal]: any = await connection.query(
      "SELECT id FROM saving_goals WHERE id=? AND user_id=?",
      [id, userId]
    );

    if (goal.length === 0) throw new Error("Data tidak ditemukan");

    // 2️⃣ Ambil semua transaksi terkait saving_id
    const [relatedTransactions]: any = await connection.query(
      "SELECT id FROM transactions WHERE saving_id = ? AND user_id = ? FOR UPDATE",
      [id, userId]
    );

    // 3️⃣ Hapus semua transaksi tabungan otomatis
    if (relatedTransactions.length > 0) {
      await connection.query(
        "DELETE FROM transactions WHERE saving_id = ? AND user_id = ?",
        [id, userId]
      );
    }

    // 4️⃣ Hapus target tabungan
    await connection.query(
      "DELETE FROM saving_goals WHERE id=? AND user_id=?",
      [id, userId]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Tabungan dan seluruh riwayat transaksi terkait berhasil dihapus dan saldo tersinkron otomatis"
    });

  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ error: err.message || "Gagal hapus data" }, { status: 500 });
  } finally {
    connection.release();
  }
}
