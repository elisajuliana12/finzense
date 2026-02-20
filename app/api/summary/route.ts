import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ================= HELPER: GET USER ID FROM COOKIES ================= */
async function getUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return token.replace("session_", "");
}

export async function GET(req: Request) {
  try {
    const USER_ID = await getUserId();

    if (!USER_ID) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    // Mengambil bulan dari params, default ke bulan berjalan
    const selectedMonth = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    /* ==========================================================================
       1. LOGIKA SALDO SEUMUR HIDUP (LIFETIME BALANCE)
       Kita menghitung TOTAL transaksi dari awal sampai DETIK INI.
       Query ini mengabaikan 'selectedMonth' agar saldo mencerminkan total aset.
       ==========================================================================
    */
    const [balanceRes]: any = await db.query(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_balance
       FROM transactions 
       WHERE user_id = ?`, 
      [USER_ID]
    );
    const totalSisaSaldo = Number(balanceRes[0]?.total_balance || 0);

    /* ==========================================================================
       2. AMBIL DATA STATISTIK BULANAN (KHUSUS BULAN TERPILIH)
       ==========================================================================
    */
    
    // Total Income bulan terpilih
    const [incomeRes]: any = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type = 'income' AND user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [USER_ID, selectedMonth]
    );

    // Total Expense bulan terpilih
    const [expenseRes]: any = await db.query(
      `SELECT SUM(amount) as total FROM transactions 
       WHERE type = 'expense' AND user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?`,
      [USER_ID, selectedMonth]
    );

    // Kategori & Budget bulan terpilih
    const [categoryDetails]: any = await db.query(
      `
      SELECT 
        c.name as category,
        COALESCE(t_sub.total_trans, 0) as total,
        COALESCE(t_sub.type, 'expense') as type,
        COALESCE(b.limit_amount, 0) as budget
      FROM categories c
      LEFT JOIN (
        SELECT category_id, type, SUM(amount) as total_trans
        FROM transactions
        WHERE user_id = ? AND DATE_FORMAT(transaction_date, '%Y-%m') = ?
        GROUP BY category_id, type
      ) t_sub ON c.id = t_sub.category_id
      LEFT JOIN budgets b ON c.id = b.category_id AND b.user_id = ? AND b.month = ?
      WHERE t_sub.total_trans > 0 OR b.limit_amount > 0
      `,
      [USER_ID, selectedMonth, USER_ID, selectedMonth]
    );

    // 3. Saving Goals (Daftar semua target menabung)
    const [savings]: any = await db.query(
      `SELECT goal_name, saved_amount, target_amount FROM saving_goals WHERE user_id = ?`,
      [USER_ID]
    );

    // 4. Riwayat Transaksi (Khusus bulan terpilih)
    const [transactions]: any = await db.query(
      `SELECT t.*, c.name as category_name 
       FROM transactions t 
       JOIN categories c ON t.category_id = c.id 
       WHERE t.user_id = ? AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?
       ORDER BY t.transaction_date DESC`,
      [USER_ID, selectedMonth]
    );

    return NextResponse.json({
      totalBalance: totalSisaSaldo, // Saldo total mutlak (tidak terikat filter bulan)
      totalIncome: Number(incomeRes[0]?.total || 0),
      totalExpense: Number(expenseRes[0]?.total || 0),
      categories: categoryDetails,
      savings: savings,
      recentTransactions: transactions,
      periode: selectedMonth
    });

  } catch (error: any) {
    console.error("API ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}