import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/* ================= HELPER: USER ID ================= */
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return token.replace("session_", "");
}

/* ================= GET: FETCH BUDGETS (WITH SEARCH & FILTER) ================= */
export async function GET(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Ambil parameter dari URL
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // Format: YYYY-MM
    const search = searchParams.get("search"); // Nama kategori

    let query = `
      SELECT 
        b.id, 
        b.category_id, 
        c.name AS category_name, 
        b.month, 
        CAST(b.limit_amount AS DECIMAL(15,2)) AS limit_amount,
        CAST(b.actual_amount AS DECIMAL(15,2)) AS actual_amount
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ?
    `;
    
    const params: any[] = [userId];

    // Filter berdasarkan bulan
    if (month) {
      query += ` AND b.month = ?`;
      params.push(month);
    }

    // Filter berdasarkan pencarian nama kategori
    if (search) {
      query += ` AND c.name LIKE ?`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY b.month DESC, c.name ASC`;

    const [rows]: any = await db.query(query, params);

    const formatted = (rows || []).map((b: any) => {
      const limit = Number(b.limit_amount) || 0;
      const used = Number(b.actual_amount) || 0;
      const percent = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

      return {
        ...b,
        limit_amount: limit,
        actual_amount: used,
        remaining_amount: Math.max(limit - used, 0),
        percent_used: percent,
        is_warning: percent >= 80 && percent < 100,
        is_over: percent >= 100,
        saving_candidate: Math.max(limit - used, 0),
      };
    });

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("GET budgets error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ================= POST: CREATE BUDGET ================= */
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { category_id, limit_amount, month } = await req.json();

    if (!category_id || !limit_amount || !month)
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

    const [existing]: any = await db.query(
      `SELECT id FROM budgets WHERE user_id=? AND category_id=? AND month=?`,
      [userId, category_id, month]
    );

    if (existing.length > 0)
      return NextResponse.json({ error: "Budget kategori ini sudah ada di bulan tersebut" }, { status: 400 });

    const [stats]: any = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE user_id=? AND category_id=? AND type='expense' 
       AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [userId, category_id, month]
    );
    const initialActual = stats[0].total || 0;

    await db.query(
      `INSERT INTO budgets (user_id, category_id, limit_amount, month, actual_amount)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, Number(category_id), Number(limit_amount), month, initialActual]
    );

    return NextResponse.json({ message: "created" }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ================= PUT: UPDATE BUDGET ================= */
export async function PUT(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, category_id, limit_amount, month } = await req.json();

    if (!id || !category_id || !limit_amount || !month) {
        return NextResponse.json({ error: "Data update tidak lengkap" }, { status: 400 });
    }

    const [stats]: any = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE user_id=? AND category_id=? AND type='expense' 
       AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [userId, category_id, month]
    );
    const newActual = stats[0].total || 0;

    const [updateResult]: any = await db.query(
      `UPDATE budgets
       SET category_id=?, limit_amount=?, month=?, actual_amount=?
       WHERE id=? AND user_id=?`,
      [Number(category_id), Number(limit_amount), month, newActual, id, userId]
    );

    if (updateResult.affectedRows === 0)
      return NextResponse.json({ error: "Budget tidak ditemukan atau tidak ada perubahan" }, { status: 404 });

    return NextResponse.json({ message: "updated" });
  } catch (e: any) {
    console.error("PUT budget error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ================= DELETE: REMOVE BUDGET ================= */
export async function DELETE(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();

    const [result]: any = await db.query(
      `DELETE FROM budgets WHERE id=? AND user_id=?`,
      [id, userId]
    );

    if (result.affectedRows === 0)
      return NextResponse.json({ error: "Budget tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ message: "deleted" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}