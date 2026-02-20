import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    // 1. Validasi Input Dasar
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Semua data wajib diisi" },
        { status: 400 }
      );
    }

    // 2. Cek apakah email sudah terdaftar di database
    const [existingUser]: any = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    // 3. Hash Password (Keamanan)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan ke Database
    await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    return NextResponse.json(
      { message: "Registrasi berhasil, silakan login" },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_ERROR:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}