const express = require("express");
const router = express.Router();
const pool = require("../db");
const { isNonEmpty, isPositiveNumber } = require("../utils/validators");
const multer = require("multer");
const path = require("path");

const uploadDir = path.join(__dirname, "..", "..", "public", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const safeExt = ext && ext.length <= 10 ? ext : "";
    cb(null, `service-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are allowed"));
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});



router.get('/services/new', (req,res)=> {
     return res.render("admin_services_new");
});

router.post('/services/new', upload.single("image"), async (req,res) => {
    try{
        
        console.log("Debug Insert req.body", req.body);

        if(!req.body){
            return res.status(400).send("All fields are required");
        }
        const name = req.body.name;
        const category = req.body.category;
        const description = req.body.description;
        const price = req.body.price;
        const duration_minutes = req.body.duration_minutes;

        if (!isNonEmpty(name) || !isNonEmpty(category) || !isNonEmpty(description) || !isPositiveNumber(price) || !isPositiveNumber(duration_minutes) ) {
            return res.status(400).send("All fields are required");
        }
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        await pool.query(
            `
            INSERT INTO services (name, category, description, price, duration_minutes, image_url) 
            VALUES (?, ?, ?, ?, ?, ?)

            `, 
            [name, category, description, price, duration_minutes, imageUrl]
        );
        res.redirect("/admin/services");
    }catch(error){
        console.error("ERROR creating service:",error);
        res.status(500).send("Error creating Services");
    }
});
//to delete data then update db
router.post('/services/:id/delete', async(req,res) =>{
    try{
        const serviceId = req.params.id;

        await pool.query(
            `
            UPDATE services
            SET is_active = 0
            WHERE id =?
            `,[serviceId]
        );
        await pool.query(
            `
            UPDATE branch_services
            SET is_active = 0
            WHERE service_id =?
            `,[serviceId]
        );
        return res.redirect("/admin/services");
    }catch(error){
        console.error("Error Deleting Services", error);
    }return res.status(500).send("Error Delete Services");
});
//to get data from DB to delete
router.get('/services/:id/delete', async(req,res)=>{
    try{
        //console.log("DEBUG DELETE req.params.id:");
        const serviceId = req.params.id;
        const [rows] = await pool.query(
        `
        SELECT id,name FROM services WHERE id=?        
        `,[serviceId]
        );
        if(rows.length === 0){
            return res.status(404).send("Service not found");
        }
        return res.render("admin_service_delete",{
            service: rows[0]
        });
    }catch(error){
        console.error("Error loading delete confirmation", error);
        return res.status(500).send("Error loading delete confirmation");
    }
});
//to submit the edited data to db
router.post('/services/:id/edit', upload.single("image"), async(req,res)=>{
    try{
        console.log("DEBUG EDIT req.body:", req.body);
        const serviceId = req.params.id;

        if(!req.body){
            return res.status(400).send("Form has missing Body");
        }
        const name = req.body.name;
        const category = req.body.category;
        const description = req.body.description;
        const price = req.body.price;
        const duration_minutes = req.body.duration_minutes;

        if(!isNonEmpty(name) || !isNonEmpty(category) || !isNonEmpty(description) || !isPositiveNumber(price) ||!isPositiveNumber(duration_minutes)){
            return res.status(400).send("All fields are required");
        }

        let imageUrl = null;
        if (req.file) {
          imageUrl = `/uploads/${req.file.filename}`;
        } else {
          const [rows] = await pool.query(
            `SELECT image_url FROM services WHERE id = ?`,
            [serviceId]
          );
          imageUrl = rows.length ? rows[0].image_url : null;
        }

        await pool.query(
          `
          UPDATE services 
          SET name = ?, category = ?, description = ?, price = ?, duration_minutes = ?, image_url = ?
          WHERE id = ?            
          `,[name,category,description, price, duration_minutes, imageUrl, serviceId]
        );
        return res.redirect("/admin/services");
    }catch(error){
        console.error("Error Updating Service",error);
        return res.status(500).send("Error Updating Service Records");
    }
});
//to edit services
router.get('/services/:id/edit', async(req,res) =>{
    try{
        const serviceId = req.params.id;

        const [rows] = await pool.query(
            `
        SELECT id, name, category, description, price, duration_minutes, image_url, created_at
        from services 
        WHERE id=?  
            
            `,[serviceId]
        );
        if(rows.length === 0) {
            return res.status(404).send("Service not found.");
        }
        return res.render("admin_service_edit", { service: rows[0] });
    }catch(error){
        console.error("ERROR editing service:",error);
        return res.status(500).send("error loading service");
    }
});


router.get('/services', async (req,res) =>{
   try{
    const[rows] = await pool.query(
        `
        SELECT id, name,category,description, price, duration_minutes, image_url, created_at
        FROM services
        ORDER BY id DESC
        `
    );
    res.render("admin_services",{
        services: rows,
    });
   }catch(err){
    console.error("ERROR loading services:",err);
    return res.status(500).send("Error Loading Services");
   }
});

module.exports = router;
