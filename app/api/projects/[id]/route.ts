import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rows } = await pool.query(
      `SELECT id, name, description, diagram, selections, total_monthly, created_at, updated_at
       FROM projects WHERE id = $1 AND is_deleted = FALSE`,
      [id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, description, diagram, selections, total_monthly } = await req.json();
    const { rows } = await pool.query(
      `UPDATE projects SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         diagram = COALESCE($3, diagram),
         selections = COALESCE($4, selections),
         total_monthly = COALESCE($5, total_monthly),
         updated_at = NOW()
       WHERE id = $6 AND is_deleted = FALSE
       RETURNING id, name, description, total_monthly, updated_at`,
      [name ?? null, description ?? null, diagram ? JSON.stringify(diagram) : null,
       selections ? JSON.stringify(selections) : null, total_monthly ?? null, id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save project" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(
      `UPDATE projects SET is_deleted = TRUE, deleted_at = NOW() WHERE id = $1`,
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
