import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

function getSslConfig() {
  const sslEnabled = String(process.env.DB_SSL || "").toLowerCase() === "true";
  if (!sslEnabled) return undefined;

  const rejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase() === "true";
  const caRaw = process.env.DB_SSL_CA || "";
  const ca = caRaw ? caRaw.replace(/\\n/g, "\n") : undefined;

  return ca ? { rejectUnauthorized, ca } : { rejectUnauthorized };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "bedmitr",
  ssl: getSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
