import { Router } from "express";
import { body, param, query, validationResult } from "express-validator";
import pool from "../config/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

async function fetchActiveCities() {
  const [rows] = await pool.query(
    `SELECT DISTINCT city
     FROM hospitals
     WHERE is_active = 1
       AND city IS NOT NULL
       AND TRIM(city) <> ''
     ORDER BY city ASC`
  );
  return rows.map((row) => row.city);
}

router.get(
  "/",
  [
    query("city").optional().trim(),
    query("q").optional().trim(),
    query("onlyAvailable").optional().isIn(["true", "false", "1", "0"]),
  ],
  async (req, res) => {
    try {
      const city = req.query.city;
      const q = req.query.q;
      const onlyAvailable =
        req.query.onlyAvailable === "true" || req.query.onlyAvailable === "1";

      let sql = `
        SELECT h.id, h.name, h.address, h.city, h.state, h.phone, h.email_contact,
               h.total_icu_beds, h.available_icu_beds, h.latitude, h.longitude,
               h.updated_at, h.emergency_line
        FROM hospitals h
        WHERE h.is_active = 1
      `;
      const params = [];

      if (city) {
        sql += ` AND h.city = ?`;
        params.push(city);
      }
      if (q) {
        sql += ` AND (h.name LIKE ? OR h.address LIKE ?)`;
        const like = `%${q}%`;
        params.push(like, like);
      }
      if (onlyAvailable) {
        sql += ` AND h.available_icu_beds > 0`;
      }
      sql += ` ORDER BY h.available_icu_beds DESC, h.name ASC`;

      const [rows, cities] = await Promise.all([
        pool.query(sql, params).then(([result]) => result),
        fetchActiveCities(),
      ]);
      return res.json({ hospitals: rows, cities });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to load hospitals" });
    }
  }
);

router.get("/cities", async (req, res) => {
  try {
    const cities = await fetchActiveCities();
    return res.json({ cities });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load cities" });
  }
});

router.get("/:id", param("id").isInt(), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Invalid id" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT h.* FROM hospitals h WHERE h.id = ? AND h.is_active = 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Hospital not found" });
    const [history] = await pool.query(
      `SELECT previous_available, new_available, note, created_at
       FROM bed_update_log WHERE hospital_id = ? ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );
    return res.json({ hospital: rows[0], recentUpdates: history });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load hospital" });
  }
});

router.patch(
  "/:id/beds",
  authenticate,
  requireRole("hospital", "admin"),
  [
    param("id").isInt(),
    body("availableIcuBeds").isInt({ min: 0 }),
    body("note").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const hospitalId = Number(req.params.id);
    const { availableIcuBeds, note } = req.body;

    if (req.user.role === "hospital") {
      if (!req.user.hospitalId || req.user.hospitalId !== hospitalId) {
        return res.status(403).json({ message: "You can only update your assigned hospital" });
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [hRows] = await conn.query(
        `SELECT total_icu_beds, available_icu_beds FROM hospitals WHERE id = ? FOR UPDATE`,
        [hospitalId]
      );
      if (!hRows.length) {
        await conn.rollback();
        return res.status(404).json({ message: "Hospital not found" });
      }
      const total = hRows[0].total_icu_beds;
      const prev = hRows[0].available_icu_beds;
      if (availableIcuBeds > total) {
        await conn.rollback();
        return res.status(400).json({
          message: `Available beds cannot exceed total ICU capacity (${total})`,
        });
      }
      await conn.query(
        `UPDATE hospitals SET available_icu_beds = ?, updated_at = NOW() WHERE id = ?`,
        [availableIcuBeds, hospitalId]
      );
      await conn.query(
        `INSERT INTO bed_update_log (hospital_id, user_id, previous_available, new_available, note)
         VALUES (?, ?, ?, ?, ?)`,
        [hospitalId, req.user.userId, prev, availableIcuBeds, note || null]
      );
      await conn.commit();
      const [updated] = await pool.query(`SELECT * FROM hospitals WHERE id = ?`, [hospitalId]);
      return res.json({ hospital: updated[0], message: "ICU availability updated" });
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return res.status(500).json({ message: "Update failed" });
    } finally {
      conn.release();
    }
  }
);

router.post(
  "/",
  authenticate,
  requireRole("admin"),
  [
    body("name").trim().notEmpty(),
    body("address").trim().notEmpty(),
    body("city").trim().notEmpty(),
    body("state").optional().trim(),
    body("phone").trim().notEmpty(),
    body("emailContact").optional().isEmail(),
    body("emergencyLine").optional().trim(),
    body("totalIcuBeds").isInt({ min: 1 }),
    body("availableIcuBeds").isInt({ min: 0 }),
    body("latitude").optional().isFloat(),
    body("longitude").optional().isFloat(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const {
      name,
      address,
      city,
      state,
      phone,
      emailContact,
      emergencyLine,
      totalIcuBeds,
      availableIcuBeds,
      latitude,
      longitude,
    } = req.body;
    if (availableIcuBeds > totalIcuBeds) {
      return res.status(400).json({ message: "Available cannot exceed total beds" });
    }
    try {
      const [result] = await pool.query(
        `INSERT INTO hospitals (name, address, city, state, phone, email_contact, emergency_line,
          total_icu_beds, available_icu_beds, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          address,
          city,
          state || null,
          phone,
          emailContact || null,
          emergencyLine || null,
          totalIcuBeds,
          availableIcuBeds,
          latitude ?? null,
          longitude ?? null,
        ]
      );
      const [row] = await pool.query(`SELECT * FROM hospitals WHERE id = ?`, [result.insertId]);
      return res.status(201).json({ hospital: row[0] });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to create hospital" });
    }
  }
);

router.put(
  "/:id",
  authenticate,
  requireRole("admin"),
  [
    param("id").isInt(),
    body("name").trim().notEmpty(),
    body("address").trim().notEmpty(),
    body("city").trim().notEmpty(),
    body("state").optional().trim(),
    body("phone").trim().notEmpty(),
    body("emailContact").optional().isEmail(),
    body("emergencyLine").optional().trim(),
    body("totalIcuBeds").isInt({ min: 1 }),
    body("availableIcuBeds").isInt({ min: 0 }),
    body("latitude").optional().isFloat(),
    body("longitude").optional().isFloat(),
    body("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const id = Number(req.params.id);
    const {
      name,
      address,
      city,
      state,
      phone,
      emailContact,
      emergencyLine,
      totalIcuBeds,
      availableIcuBeds,
      latitude,
      longitude,
      isActive,
    } = req.body;
    if (availableIcuBeds > totalIcuBeds) {
      return res.status(400).json({ message: "Available cannot exceed total beds" });
    }
    try {
      const [r] = await pool.query(`UPDATE hospitals SET
        name = ?, address = ?, city = ?, state = ?, phone = ?, email_contact = ?, emergency_line = ?,
        total_icu_beds = ?, available_icu_beds = ?, latitude = ?, longitude = ?,
        is_active = COALESCE(?, is_active), updated_at = NOW()
        WHERE id = ?`,
        [
          name,
          address,
          city,
          state || null,
          phone,
          emailContact || null,
          emergencyLine || null,
          totalIcuBeds,
          availableIcuBeds,
          latitude ?? null,
          longitude ?? null,
          typeof isActive === "boolean" ? (isActive ? 1 : 0) : null,
          id,
        ]
      );
      if (!r.affectedRows) return res.status(404).json({ message: "Hospital not found" });
      const [row] = await pool.query(`SELECT * FROM hospitals WHERE id = ?`, [id]);
      return res.json({ hospital: row[0] });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Failed to update hospital" });
    }
  }
);

export default router;
