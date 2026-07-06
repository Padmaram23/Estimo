import { Pool } from "pg";

const pool = new Pool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? "mydb",
  user: process.env.DB_USERNAME ?? "postgres",
  password: process.env.DB_PASSWORD ?? "",
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;
