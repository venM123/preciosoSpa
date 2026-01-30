const express = require("express");
const router = express.Router();
const pool = require("../db");
const requireAdmin = require("../middleware/requireAdmin");

router.get("/reports", requireAdmin, async (req, res) => {
  try {
    const [statusRows] = await pool.query(
      `
      SELECT status, COUNT(*) AS count
      FROM bookings
      GROUP BY status
      `
    );

    const [revenueRows] = await pool.query(
      `
      SELECT
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN status = 'CONFIRMED' THEN service_price_snapshot ELSE 0 END) AS confirmed_revenue
      FROM bookings
      `
    );

    const [serviceRows] = await pool.query(
      `
      SELECT
        service_name_snapshot AS service,
        COUNT(*) AS total,
        SUM(service_price_snapshot) AS revenue
      FROM bookings
      GROUP BY service_name_snapshot
      ORDER BY total DESC
      LIMIT 10
      `
    );

    const [branchRows] = await pool.query(
      `
      SELECT
        br.name AS branch,
        COUNT(*) AS total
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      GROUP BY br.name
      ORDER BY total DESC
      `
    );

    return res.render("admin_reports", {
      statusRows,
      revenue: revenueRows[0],
      serviceRows,
      branchRows
    });
  } catch (error) {
    console.error("Reports error:", error);
    return res.status(500).send("Error loading reports");
  }
});

module.exports = router;
