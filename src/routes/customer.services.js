const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/services', async (req,res)=>{
    try{
        const [branches] = await pool.query(
          `
          SELECT id, name, address, phone
          FROM branches
          WHERE is_active = 1
          ORDER BY name
          `
        );

        const selectedBranchId = Number(req.query.branch_id) || (branches[0] ? branches[0].id : null);

        let services = [];
        if (selectedBranchId) {
          const [rows] = await pool.query(
            `
            SELECT 
              s.id,
              s.category,
              s.promo_set,
              s.name,
              s.description,
              s.duration_minutes,
              COALESCE(bs.price_override, s.price) AS price,
              s.image_url
            FROM services s
            JOIN branch_services bs ON bs.service_id = s.id
            WHERE s.is_active = 1
              AND bs.is_active = 1
              AND bs.branch_id = ?
            ORDER BY s.category, s.promo_set, s.name
            `,
            [selectedBranchId]
          );
          services = rows;
        }

        return res.render('services', {
          services,
          branches,
          selectedBranchId
        });
    }catch(error){
        console.error('Failed to load service',error);
        return res.status(500).send("Unable to load services");
    }
});

router.get("/", (req, res) => {
  return res.render("home");
});

router.get('/branches', async (req, res) => {
  try {
    const [branches] = await pool.query(
      `
      SELECT id, name, address, phone
      FROM branches
      WHERE is_active = 1
      ORDER BY name
      `
    );
    return res.render("branches", { branches });
  } catch (error) {
    console.error("Failed to load branches", error);
    return res.status(500).send("Unable to load branches");
  }
});

router.get("/contact", async (req, res) => {
  try {
    const [branches] = await pool.query(
      `
      SELECT id, name, address, phone
      FROM branches
      WHERE is_active = 1
      ORDER BY name
      `
    );
    return res.render("contact", { branches });
  } catch (error) {
    console.error("Failed to load contact info", error);
    return res.status(500).send("Unable to load contact info");
  }
});

module.exports = router;


