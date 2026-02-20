import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ================= GET USER ================= */
async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return token.replace("session_", "");
}

/* ================= SYNC BUDGET ================= */
async function syncBudget(userId: string, categoryId: any, date: any) {
  if (!date || !categoryId) return;

  const month =
    (date instanceof Date ? date.toISOString() : String(date)).substring(0, 7);

  await db.query(
    `UPDATE budgets 
     SET actual_amount = (
        SELECT COALESCE(SUM(amount),0)
        FROM transactions
        WHERE user_id=? 
        AND category_id=? 
        AND type='expense'
        AND DATE_FORMAT(transaction_date,'%Y-%m')=?
     )
     WHERE user_id=? AND category_id=? AND month=?`,
    [userId, categoryId, month, userId, categoryId, month]
  );
}

/* ================= RECALC TABUNGAN ================= */
async function recalcSaving(
  connection: any,
  userId: string,
  savingId: number
) {
  await connection.query(
    `UPDATE saving_goals sg
     SET saved_amount = (
        SELECT COALESCE(SUM(
          CASE 
            WHEN type='expense' THEN amount
            WHEN type='income' THEN -amount
          END
        ),0)
        FROM transactions
        WHERE saving_id=? AND user_id=?
     )
     WHERE sg.id=? AND sg.user_id=?`,
    [savingId, userId, savingId, userId]
  );
}

/* ================= GET ================= */
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    if (mode === "stats") {
      const [stats]: any = await db.query(
        `SELECT 
          (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE user_id=? AND type='income') -
          (SELECT COALESCE(SUM(amount),0) FROM transactions WHERE user_id=? AND type='expense')
          AS totalBalance`,
        [userId, userId]
      );

      return NextResponse.json({
        totalBalance: Number(stats[0]?.totalBalance || 0),
      });
    }

    const month = searchParams.get("month");
    const search = searchParams.get("search");

    let query = `
      SELECT t.*, c.name AS category_name,
      DATE_FORMAT(t.transaction_date,'%Y-%m-%d') AS transaction_date
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;

    const params: any[] = [userId];

    if (month) {
      query += ` AND DATE_FORMAT(t.transaction_date,'%Y-%m')=?`;
      params.push(month);
    }

    if (search) {
      query += ` AND (t.description LIKE ? OR c.name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY t.transaction_date DESC, t.id DESC`;

    const [rows]: any = await db.query(query, params);
    return NextResponse.json(rows || []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

/* ================= POST ================= */
export async function POST(req: Request) {
  const connection = await db.getConnection();

  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      amount,
      type,
      category_id,
      description,
      transaction_date,
      saving_id,
    } = await req.json();

    const amt = Number(amount);

    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO transactions
      (user_id, category_id, type, amount, description, transaction_date, saving_id)
      VALUES (?,?,?,?,?,?,?)`,
      [
        userId,
        Number(category_id),
        type,
        amt,
        description,
        transaction_date,
        saving_id ?? null,
      ]
    );

    if (saving_id !== undefined && saving_id !== null) {
      await recalcSaving(connection, userId, Number(saving_id));
    }

    await connection.commit();

    if (type === "expense")
      await syncBudget(userId, category_id, transaction_date);

    return NextResponse.json({ message: "Berhasil" }, { status: 201 });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ message: err.message }, { status: 400 });
  } finally {
    connection.release();
  }
}

/* ================= PUT ================= */
export async function PUT(req: Request) {
  const connection = await db.getConnection();

  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      id,
      amount,
      type,
      category_id,
      description,
      transaction_date,
      saving_id,
    } = body;

    const amt = Number(amount);

    await connection.beginTransaction();

    const [oldRows]: any = await connection.query(
      `SELECT * FROM transactions WHERE id=? AND user_id=?`,
      [id, userId]
    );

    if (!oldRows.length) throw new Error("Data tidak ditemukan");
    const oldData = oldRows[0];

    // IMPORTANT FIX
    const finalSavingId =
      saving_id !== undefined ? saving_id : oldData.saving_id;

    await connection.query(
      `UPDATE transactions 
       SET amount=?, type=?, category_id=?, description=?, transaction_date=?, saving_id=?
       WHERE id=? AND user_id=?`,
      [
        amt,
        type,
        Number(category_id),
        description,
        transaction_date,
        finalSavingId,
        id,
        userId,
      ]
    );

    // Recalc saving lama
    if (oldData.saving_id !== null) {
      await recalcSaving(connection, userId, Number(oldData.saving_id));
    }

    // Recalc saving baru kalau beda
    if (
      finalSavingId !== null &&
      finalSavingId !== oldData.saving_id
    ) {
      await recalcSaving(connection, userId, Number(finalSavingId));
    }

    await connection.commit();

    if (oldData.type === "expense")
      await syncBudget(userId, oldData.category_id, oldData.transaction_date);

    if (type === "expense")
      await syncBudget(userId, category_id, transaction_date);

    return NextResponse.json({ message: "Berhasil diperbarui" });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ message: err.message }, { status: 400 });
  } finally {
    connection.release();
  }
}

/* ================= DELETE ================= */
export async function DELETE(req: Request) {
  const connection = await db.getConnection();

  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    await connection.beginTransaction();

    const [rows]: any = await connection.query(
      `SELECT * FROM transactions WHERE id=? AND user_id=?`,
      [id, userId]
    );

    if (!rows.length) throw new Error("Data tidak ditemukan");
    const oldData = rows[0];

    await connection.query(
      `DELETE FROM transactions WHERE id=? AND user_id=?`,
      [id, userId]
    );

    if (oldData.saving_id !== null) {
      await recalcSaving(connection, userId, Number(oldData.saving_id));
    }

    await connection.commit();

    if (oldData.type === "expense")
      await syncBudget(userId, oldData.category_id, oldData.transaction_date);

    return NextResponse.json({ message: "Berhasil dihapus" });
  } catch (err: any) {
    await connection.rollback();
    return NextResponse.json({ message: err.message }, { status: 400 });
  } finally {
    connection.release();
  }
}
