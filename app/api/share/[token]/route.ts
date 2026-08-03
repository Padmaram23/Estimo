import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { rows } = await pool.query(
      `SELECT id, name, description, diagram, selections, total_monthly, share_edit
       FROM projects
       WHERE share_token = $1 AND is_deleted = FALSE`,
      [token]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load shared project" }, { status: 500 });
  }
}
