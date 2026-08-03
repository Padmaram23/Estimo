import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { randomBytes } from "crypto";

// POST /api/projects/[id]/share — generate token, set edit flag
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { allowEdit = false } = await req.json().catch(() => ({}));

    // Generate a URL-safe token if one doesn't exist yet
    const token = randomBytes(24).toString("base64url");

    const { rows } = await pool.query(
      `UPDATE projects
         SET share_token = COALESCE(share_token, $1),
             share_edit  = $2
       WHERE id = $3 AND is_deleted = FALSE
       RETURNING share_token, share_edit`,
      [token, allowEdit, id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ token: rows[0].share_token, allowEdit: rows[0].share_edit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

// PATCH /api/projects/[id]/share — update allowEdit only
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { allowEdit } = await req.json();
    const { rows } = await pool.query(
      `UPDATE projects SET share_edit = $1
       WHERE id = $2 AND is_deleted = FALSE AND share_token IS NOT NULL
       RETURNING share_token, share_edit`,
      [allowEdit, id]
    );
    if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ token: rows[0].share_token, allowEdit: rows[0].share_edit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update share settings" }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/share — revoke share link
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await pool.query(
      `UPDATE projects SET share_token = NULL, share_edit = FALSE
       WHERE id = $1 AND is_deleted = FALSE`,
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }
}
