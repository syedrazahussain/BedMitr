/**
 * Applies server/database/schema.sql using credentials in server/.env
 * Run: node scripts/apply-schema.js (from server folder)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const sqlPath = path.join(__dirname, "..", "database", "schema.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

function getSslConfig() {
  const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";
  if (!sslEnabled) return undefined;

  const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() === "true";
  const caRaw = process.env.DB_SSL_CA || "";
  const ca = caRaw ? caRaw.replace(/\\n/g, "\n") : undefined;

  return ca ? { rejectUnauthorized, ca } : { rejectUnauthorized };
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  multipleStatements: true,
  ssl: getSslConfig(),
});

await conn.query(sql);
await conn.end();
console.log("Schema applied OK.");
