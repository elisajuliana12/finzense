import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

// Force dynamic untuk memastikan data profil selalu terbaru dan tidak terkena cache browser/Next.js
export const dynamic = "force-dynamic";

/* ================= GET PROFILE ================= */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(token.replace("session_", ""));

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid session" },
        { status: 401 }
      );
    }

    const [rows]: any = await db.query(
      "SELECT id, name, email, image FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ================= UPDATE PROFILE ================= */
export async function PUT(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = Number(token.replace("session_", ""));
    const body = await req.json();
    const { name, email, password, image } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    if (password && password.length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET name=?, email=?, password=?, image=? WHERE id=?",
        [name, email, hashed, image, userId]
      );
    } else {
      await db.query(
        "UPDATE users SET name=?, email=?, image=? WHERE id=?",
        [name, email, image, userId]
      );
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Update gagal" },
      { status: 500 }
    );
  }
}

/* ================= DELETE PROFILE (UPDATED) ================= */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = Number(token.replace("session_", ""));

    // 1. Hapus data dari database
    await db.query("DELETE FROM users WHERE id = ?", [userId]);

    // 2. Buat response sukses
    const response = NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });

    // 3. Hapus cookie agar user ter-logout otomatis
    response.cookies.set("token", "", {
      path: "/",
      expires: new Date(0), // Set expired ke masa lalu
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Delete gagal" }, { status: 500 });
  }
}