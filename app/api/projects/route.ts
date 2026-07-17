import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, total_monthly, created_at, updated_at
       FROM projects WHERE is_deleted = FALSE ORDER BY updated_at DESC`
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const { rows } = await pool.query(
      `INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING id, name, description, total_monthly, created_at`,
      [name.trim(), description?.trim() ?? null]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
