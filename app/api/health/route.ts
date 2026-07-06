import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  let dbStatus = "disconnected";
  
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbStatus = "connected";
  } catch (error) {
    dbStatus = "error";
    console.error("Database connection error:", error);
  }

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV ?? "development",
      database: dbStatus,
    },
    { status: 200 }
  );
}
