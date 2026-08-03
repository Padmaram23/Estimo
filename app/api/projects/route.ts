import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rows } = await pool.query(
      `SELECT id, name, description, total_monthly, created_at, updated_at
       FROM projects WHERE is_deleted = FALSE AND user_id = $1 ORDER BY updated_at DESC`,
      [session.user.id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description, selections, diagram } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const total = Array.isArray(selections)
      ? selections.reduce((sum: number, s: {
          price: number;
          isTokenBased?: boolean;
          inputTokensM?: number;
          outputTokensM?: number;
          priceInputPer1m?: number;
          priceOutputPer1m?: number;
        }) => {
          if (s.isTokenBased) {
            return sum
              + (s.inputTokensM  ?? 0) * (s.priceInputPer1m  ?? 0)
              + (s.outputTokensM ?? 0) * (s.priceOutputPer1m ?? 0);
          }
          return sum + Number(s.price);
        }, 0)
      : 0;
    const { rows } = await pool.query(
      `INSERT INTO projects (name, description, selections, diagram, total_monthly, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, total_monthly, created_at`,
      [
        name.trim(),
        description?.trim() ?? null,
        selections ? JSON.stringify(selections) : null,
        diagram    ? JSON.stringify(diagram)    : null,
        total,
        session.user.id,
      ]
    );
    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
