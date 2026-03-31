import express from "express";
import cors from "cors";
import pool from "./config/db.js";
import authRoutes from "./routes/auth.js";
import hospitalRoutes from "./routes/hospitals.js";
import adminRoutes from "./routes/admin.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (clientOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "BedMitra API", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

async function start() {
  try {
    await pool.query("SELECT 1 AS ok");
    console.log("[BedMitra] MySQL connection OK");
  } catch (err) {
    console.error("\n[BedMitra] MySQL connection FAILED:", err.message);
    console.error("Fix: start MySQL, create database `bedmitr`, and check server/.env");
    console.error("Docker: from project root run:  docker compose up -d");
    console.error("Then: npm run seed (in server/ folder)\n");
    process.exit(1);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`BedMitra API listening on http://localhost:${port}`);
  });
}

start();
