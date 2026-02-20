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

/* ================= GET NOTIFICATIONS ================= */
export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId)
      return NextResponse.json({ total: 0, notifications: [] }, { status: 401 });

    const notifications: any[] = [];
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // Format: YYYY-MM

    /* ================= 1. DATA DASAR (TRANSAKSI) ================= */
    const [monthStats]: any = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type='income' THEN amount END), 0) AS income,
        COALESCE(SUM(CASE WHEN type='expense' THEN amount END), 0) AS expense
       FROM transactions
       WHERE user_id=? 
       AND DATE_FORMAT(transaction_date,'%Y-%m') = ?`,
      [userId, currentMonth]
    );

    const stats = monthStats[0] || { income: 0, expense: 0 };
    const totalIncome = Number(stats.income);
    const totalExpense = Number(stats.expense);
    const totalBalance = totalIncome - totalExpense;

    /* ================= 2. ALERTS (PERINGATAN) ================= */

    // Defisit: Pengeluaran > Pemasukan
    if (totalExpense > totalIncome && totalIncome > 0) {
      notifications.push({
        type: "alert",
        icon: "🚨",
        title: "Analisis Arus Kas",
        message: `Bulan ini pengeluaran Anda (Rp${totalExpense.toLocaleString()}) melampaui pendapatan. Coba tinjau kembali daftar belanja Anda.`,
      });
    }

    // Saldo Rendah: Sisa < 10% dari total pemasukan
    if (totalIncome > 0 && totalBalance > 0 && totalBalance < totalIncome * 0.1) {
      notifications.push({
        type: "alert",
        icon: "⚠️",
        title: "Saldo Hampir Habis",
        message: "Sisa saldo Anda saat ini di bawah 10% dari total pemasukan bulan ini. Waktunya berhemat!",
      });
    }

    // Budget: Cek Limit (Tabel 'budgets' & 'categories')
    const [budgets]: any = await db.query(
      `SELECT b.*, c.name AS category_name
       FROM budgets b
       JOIN categories c ON b.category_id = c.id
       WHERE b.user_id=? AND b.month=?`,
      [userId, currentMonth]
    );

    budgets.forEach((b: any) => {
      const percentage = (Number(b.actual_amount) / Number(b.limit_amount)) * 100;
      if (percentage >= 100) {
        notifications.push({
          type: "alert",
          icon: "🚫",
          title: "Anggaran Terlampaui",
          message: `Anggaran untuk ${b.category_name} sudah habis (Terpakai: ${Math.round(percentage)}%).`,
        });
      } else if (percentage >= 80) {
        notifications.push({
          type: "alert",
          icon: "📉",
          title: "Peringatan Anggaran",
          message: `Penggunaan anggaran ${b.category_name} sudah mencapai ${Math.round(percentage)}%.`,
        });
      }
    });

    /* ================= 3. REMINDERS (PENGINGAT) ================= */

    // Inaktivitas: Tidak mencatat transaksi selama 3 hari
    const [lastTx]: any = await db.query(
      `SELECT transaction_date FROM transactions WHERE user_id=? ORDER BY transaction_date DESC LIMIT 1`,
      [userId]
    );

    if (lastTx && lastTx.length > 0) {
      const diffDays = Math.floor((today.getTime() - new Date(lastTx[0].transaction_date).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        notifications.push({
          type: "reminder",
          icon: "📅",
          title: "Mari Mencatat Kembali",
          message: `Sudah ${diffDays} hari Anda tidak mencatat transaksi. Jangan sampai ada pengeluaran yang terlewat!`,
        });
      }
    }

    // Saving Goals: Deadline (Disesuaikan dengan kolom yang ada di SQL)
    const [goals]: any = await db.query(
      `SELECT * FROM saving_goals WHERE user_id=?`,
      [userId]
    );

    goals.forEach((g: any) => {
      if (!g.target_date) return;
      const targetDate = new Date(g.target_date);
      const daysLeft = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const isReached = Number(g.saved_amount) >= Number(g.target_amount);

      if (daysLeft > 0 && daysLeft <= 7 && !isReached) {
        notifications.push({
          type: "reminder",
          icon: "🎯",
          title: "Target Tabungan",
          message: `Target '${g.goal_name}' berakhir dalam ${daysLeft} hari. Yuk, sisihkan dana sedikit lagi!`,
        });
      }
    });

    /* ================= 4. INSIGHTS & ACHIEVEMENTS ================= */

    // Kategori Paling Boros
    const [topExpense]: any = await db.query(
      `SELECT c.name, SUM(t.amount) as total
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id=? AND t.type='expense' AND DATE_FORMAT(t.transaction_date,'%Y-%m')=?
       GROUP BY c.id ORDER BY total DESC LIMIT 1`,
      [userId, currentMonth]
    );

    if (topExpense && topExpense.length > 0) {
      notifications.push({
        type: "achievement",
        icon: "💡",
        title: "Wawasan Pengeluaran",
        message: `Pengeluaran terbesar Anda bulan ini ada pada kategori ${topExpense[0].name}.`,
      });
    }

    // Goal Tercapai
    goals.forEach((g: any) => {
      if (Number(g.saved_amount) >= Number(g.target_amount)) {
        notifications.push({
          type: "achievement",
          icon: "🎉",
          title: "Misi Berhasil!",
          message: `Luar biasa! Target tabungan '${g.goal_name || 'Tabungan'}' Anda telah tercapai 100%.`,
        });
      }
    });

    // Notifikasi jika belum ada aktivitas sama sekali
    if (notifications.length === 0 && totalIncome === 0 && totalExpense === 0) {
        notifications.push({
          type: "reminder",
          icon: "✨",
          title: "Selamat Datang!",
          message: "Belum ada catatan keuangan bulan ini. Yuk, mulai kelola finansialmu hari ini!",
        });
    }

    return NextResponse.json({
      total: notifications.length,
      notifications: notifications
    });

  } catch (error) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ total: 0, notifications: [] }, { status: 500 });
  }
}