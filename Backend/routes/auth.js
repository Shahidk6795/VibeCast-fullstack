import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

export default function createAuthRouter(pool) {
  const signToken = (user) =>
    jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

  router.post("/register", async (req, res) => {
    try {
      const name = String(req.body.name || "").trim();
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");

      if (!name || !email || password.length < 6) {
        return res.status(400).json({ error: "Name, valid email, and 6+ char password required" });
      }

      const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(409).json({ error: "Email is already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [result] = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'user')",
        [name, email, passwordHash]
      );

      const user = { id: result.insertId, name, email, role: "user" };
      const token = signToken(user);

      return res.status(201).json({ token, user });
    } catch (err) {
      console.error("Register error:", err);
      return res.status(500).json({ error: "Registration failed" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const email = String(req.body.email || "").trim().toLowerCase();
      const password = String(req.body.password || "");

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const [rows] = await pool.query(
        "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
        [email]
      );
      if (rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const dbUser = rows[0];
      const match = await bcrypt.compare(password, dbUser.password_hash);
      if (!match) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
      const token = signToken(user);

      return res.json({ token, user });
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  router.get("/me", requireAuth, async (req, res) => {
    try {
      const [rows] = await pool.query(
        "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.json({ user: rows[0] });
    } catch (err) {
      console.error("Fetch profile error:", err);
      return res.status(500).json({ error: "Failed to load user" });
    }
  });

  return router;
}