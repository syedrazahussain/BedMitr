import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import pool from "../config/db.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("fullName").trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const { email, password, fullName } = req.body;
    try {
      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length) {
        return res.status(409).json({ message: "Email already registered" });
      }
      const hash = await bcrypt.hash(password, 12);
      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, 'user')`,
        [email, hash, fullName]
      );
      const userId = result.insertId;
      const token = signToken({ userId, role: "user", hospitalId: null });
      return res.status(201).json({
        token,
        user: { id: userId, email, fullName, role: "user", hospitalId: null },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Registration failed" });
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: "Validation failed", errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const [rows] = await pool.query(
        `SELECT id, email, password_hash, full_name, role, hospital_id, is_active FROM users WHERE email = ?`,
        [email]
      );
      if (!rows.length) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const u = rows[0];
      if (!u.is_active) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      const ok = await bcrypt.compare(password, u.password_hash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = signToken({
        userId: u.id,
        role: u.role,
        hospitalId: u.hospital_id,
      });
      return res.json({
        token,
        user: {
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          hospitalId: u.hospital_id,
        },
      });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Login failed" });
    }
  }
);

router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, email, full_name, role, hospital_id FROM users WHERE id = ? AND is_active = 1`,
      [req.user.userId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    const u = rows[0];
    return res.json({
      user: {
        id: u.id,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        hospitalId: u.hospital_id,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Failed to load profile" });
  }
});

export default router;
