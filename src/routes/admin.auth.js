const express = require("express");
const router = express.Router();
const pool = require("../db"); // or whatever DB import you already had
const bcrypt = require("bcrypt");

//const router =  express.Router();


router.get("/login", (req,res) => {
    res.render("admin_login");
});
router.post("/login", async (req, res) => {
    const {email, password} = req.body;
    
    const [rows] = await pool.query(
        "SELECT id, password_hash FROM admins WHERE email =? AND is_active = 1",
        [email]

    );
    if(rows.length === 0){
        return res.redirect("/admin/login");
    }
    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if(!ok){
        return res.redirect("/admin/login");
    }
    req.session.adminId = rows[0].id;
    res.redirect("/admin/dashboard");
});

router.get("/dashboard",(req,res) => {
    if(!req.session.adminId){
        return res.redirect("/admin/login");
    }
    res.render("admin_dashboard");
});

router.get("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/admin/login");
  }
  req.session.destroy(() => {
    res.redirect("/admin/login");
  });
});


module.exports = router;
