const express = require("express");
const router = express.Router();
const pool = require("../db");
const requireAdmin = require("../middleware/requireAdmin");

router.get("/branch-services", requireAdmin, async (req, res) => {
  try {
    const [branches] = await pool.query(
      "SELECT id, name FROM branches WHERE is_active = 1 ORDER BY name"
    );

    const selectedBranchId = Number(req.query.branch_id) || (branches[0] ? branches[0].id : null);

    let services = [];
    if (selectedBranchId) {
      const [rows] = await pool.query(
        `
        SELECT
          s.id,
          s.name,
          s.category,
          s.promo_set,
          s.price AS base_price,
          bs.price_override,
          bs.is_active
        FROM services s
        JOIN branch_services bs ON bs.service_id = s.id
        WHERE bs.branch_id = ?
        ORDER BY s.category, s.promo_set, s.name
        `,
        [selectedBranchId]
      );
      services = rows;
    }

    return res.render("admin_branch_services", {
      branches,
      services,
      selectedBranchId
    });
  } catch (error) {
    console.error("Branch services admin error:", error);
    return res.status(500).send("Failed to load branch services");
  }
});

router.post("/branch-services", requireAdmin, async (req, res) => {
  const { branch_id, service_id, price_override, is_active } = req.body;

  if (!branch_id || !service_id) {
    return res.status(400).send("Branch and service are required");
  }

  const active = is_active === "1" ? 1 : 0;
  const price = price_override ? Number(price_override) : null;

  try {
    await pool.query(
      `
      UPDATE branch_services
      SET price_override = ?, is_active = ?
      WHERE branch_id = ? AND service_id = ?
      `,
      [price, active, branch_id, service_id]
    );

    return res.redirect(`/admin/branch-services?branch_id=${branch_id}`);
  } catch (error) {
    console.error("Branch service update error:", error);
    return res.status(500).send("Failed to update branch service");
  }
});

module.exports = router;
