const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../db");
const { isValidEmail, isNonEmpty, isValidPhone } = require("../utils/validators");

const router = express.Router();

router.get("/login", (req, res) => {
  return res.render("customer_login", { error: null });
});

router.get("/register", (req, res) => {
  return res.render("customer_register", { error: null });
});

router.post("/register", async (req, res) => {
  const { full_name, email, phone, password } = req.body;

  if (!isNonEmpty(full_name) || !isValidEmail(email) || !isValidPhone(phone) || !isNonEmpty(password)) {
    return res.render("customer_register", { error: "Please fill in all fields correctly." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM customers WHERE email = ?",
      [email]
    );

    if (existing.length) {
      return res.render("customer_register", { error: "Email already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `
      INSERT INTO customers (email, password_hash, full_name, phone)
      VALUES (?, ?, ?, ?)
      `,
      [email, passwordHash, full_name, phone]
    );

    req.session.customerId = result.insertId;
    req.session.customerName = full_name;
    return res.redirect("/bookings");
  } catch (error) {
    console.error("Customer register error:", error);
    return res.status(500).send("Registration failed");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!isValidEmail(email) || !isNonEmpty(password)) {
    return res.render("customer_login", { error: "Invalid credentials" });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT id, password_hash, full_name
      FROM customers
      WHERE email = ?
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.render("customer_login", { error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) {
      return res.render("customer_login", { error: "Invalid credentials" });
    }

    req.session.customerId = rows[0].id;
    req.session.customerName = rows[0].full_name;

    return res.redirect("/bookings");
  } catch (error) {
    console.error("Customer login error:", error);
    return res.status(500).send("Login failed");
  }
});

router.get("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/services");
  }
  req.session.destroy(() => {
    res.redirect("/services");
  });
});

router.get("/reset", (req, res) => {
  return res.render("customer_reset", { error: null, tempPassword: null });
});

router.post("/reset", async (req, res) => {
  const { email } = req.body;

  if (!isValidEmail(email)) {
    return res.render("customer_reset", { error: "Enter a valid email", tempPassword: null });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE email = ?
      `,
      [email]
    );

    if (rows.length === 0) {
      return res.render("customer_reset", { error: "Email not found", tempPassword: null });
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      `
      UPDATE customers
      SET password_hash = ?
      WHERE id = ?
      `,
      [passwordHash, rows[0].id]
    );

    return res.render("customer_reset", { error: null, tempPassword });
  } catch (error) {
    console.error("Customer reset error:", error);
    return res.status(500).send("Reset failed");
  }
});

module.exports = router;
