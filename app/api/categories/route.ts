import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Pastikan allocation_type dipanggil agar bisa difilter di frontend
    const [rows]: any = await db.query(
      "SELECT id, name, allocation_type FROM categories ORDER BY name ASC"
    );

    return NextResponse.json(rows || []);
  } catch (error: any) {
    return NextResponse.json({ error: "Gagal" }, { status: 500 });
  }
}