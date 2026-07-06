import { readFileSync } from "fs";
import { join } from "path";

// Load .env.local before creating the pool
const envPath = join(process.cwd(), ".env.local");
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // rely on existing env vars
}

async function migrate() {
  const { default: pool } = await import("../lib/db");
  const sql = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf-8");
  try {
    await pool.query(sql);
    console.log("Migration applied successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
