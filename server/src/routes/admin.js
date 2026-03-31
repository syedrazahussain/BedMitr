import { Router } from "express";
import bcrypt from "bcryptjs";
import { body, param, validationResult, query } from "express-validator";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/hospitals", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM hospitals ORDER BY city ASC, name ASC`
    );
    return res.json({ hospitals: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load hospitals" });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const [[hCount]] = await pool.query(
      `SELECT COUNT(*) AS c FROM hospitals WHERE is_active = 1`
    );
    const [[beds]] = await pool.query(
      `SELECT COALESCE(SUM(available_icu_beds),0) AS avail, COALESCE(SUM(total_icu_beds),0) AS total FROM hospitals WHERE is_active = 1`
    );
    const [[uCount]] = await pool.query(`SELECT COUNT(*) AS c FROM users WHERE is_active = 1`);
    const [byCity] = await pool.query(
      `SELECT city, SUM(available_icu_beds) AS available, SUM(total_icu_beds) AS total
       FROM hospitals WHERE is_active = 1 GROUP BY city ORDER BY city`
    );
    return res.json({
      stats: {
        hospitals: hCount.c,
        users: uCount.c,
        totalIcuBeds: beds.total,
        availableIcuBeds: beds.avail,
      },
      byCity,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load stats" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.hospital_id, u.is_active, u.created_at,
              h.name AS hospital_name
       FROM users u
       LEFT JOIN hospitals h ON h.id = u.hospital_id
       ORDER BY u.created_at DESC`
    );
    return res.json({ users: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load users" });
  }
});

router.post(
  "/users",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("fullName").trim().notEmpty(),
    body("role").isIn(["admin", "hospital", "user"]),
    body("hospitalId").optional({ nullable: true }).isInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const { email, password, fullName, role, hospitalId } = req.body;
    if (role === "hospital" && !hospitalId) {
      return res.status(400).json({ message: "Hospital staff must be linked to a hospital" });
    }
    if (role !== "hospital" && hospitalId) {
      return res.status(400).json({ message: "Only hospital role can have hospitalId" });
    }
    try {
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length) {
        return res.status(409).json({ message: "Email already in use" });
      }
      if (hospitalId) {
        const [h] = await pool.query("SELECT id FROM hospitals WHERE id = ?", [hospitalId]);
        if (!h.length) return res.status(400).json({ message: "Invalid hospital" });
      }
      const hash = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role, hospital_id) VALUES (?, ?, ?, ?, ?)`,
        [email, hash, fullName, role, hospitalId || null]
      );
      const [user] = await pool.query(
        `SELECT id, email, full_name, role, hospital_id, is_active, created_at FROM users WHERE id = ?`,
        [result.insertId]
      );
      return res.status(201).json({ user: user[0] });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to create user" });
    }
  }
);

router.patch(
  "/users/:id/toggle",
  [param("id").isInt()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: "Invalid id" });
    const id = Number(req.params.id);
    if (id === req.user.userId) {
      return res.status(400).json({ message: "Cannot disable your own account" });
    }
    try {
      const [rows] = await pool.query(`SELECT is_active FROM users WHERE id = ?`, [id]);
      if (!rows.length) return res.status(404).json({ message: "User not found" });
      const next = rows[0].is_active ? 0 : 1;
      await pool.query(`UPDATE users SET is_active = ? WHERE id = ?`, [next, id]);
      return res.json({ id, isActive: Boolean(next) });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to update user" });
    }
  }
);

router.get("/hospitals-list", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, city FROM hospitals WHERE is_active = 1 ORDER BY name`
    );
    return res.json({ hospitals: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load hospitals" });
  }
});

router.get(
  "/recent-updates",
  [
    query("limit").optional().isInt({ min: 1, max: 200 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }

    const limit = req.query.limit || 25;

    try {
      const [rows] = await pool.query(
        `SELECT
          bul.id,
          bul.created_at,
          bul.previous_available,
          bul.new_available,
          bul.note,
          bul.hospital_id,
          h.name AS hospital_name,
          h.city AS city,
          bul.user_id,
          u.full_name AS updated_by,
          u.role AS updated_by_role
        FROM bed_update_log bul
        INNER JOIN hospitals h ON h.id = bul.hospital_id
        INNER JOIN users u ON u.id = bul.user_id
        ORDER BY bul.created_at DESC
        LIMIT ?`,
        [limit]
      );

      return res.json({ updates: rows });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to load recent updates" });
    }
  }
);

export default router;
