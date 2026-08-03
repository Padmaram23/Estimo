import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Deletes user — cascades to accounts + sessions. Projects become user_id = NULL (ON DELETE SET NULL).
    await pool.query(`DELETE FROM users WHERE id = $1`, [session.user.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
