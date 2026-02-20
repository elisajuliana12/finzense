import { cookies } from "next/headers";
import { db } from "@/lib/db";

// Fungsi untuk mendapatkan data user lengkap di Server Component/API
export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("User belum login");
  }

  // Logika yang sama dengan api/profile/route.ts Anda
  const userId = Number(token.replace("session_", ""));

  if (isNaN(userId)) {
    throw new Error("Sesi tidak valid");
  }

  try {
    const [rows]: any = await db.query(
      "SELECT id, name, email, image FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      throw new Error("User tidak ditemukan");
    }

    return rows[0]; // Mengembalikan {id, name, email, image}
  } catch (error) {
    throw new Error("Gagal mengambil data user");
  }
}

// Tetap pertahankan fungsi lama agar fitur lain tidak error
export async function getUserId() {
  try {
    const user = await getUser();
    return user.id;
  } catch (error) {
    throw error;
  }
}