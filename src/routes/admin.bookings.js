const express = require("express");
const router = express.Router();
const pool = require('../db');
const requireAdmin = require("../middleware/requireAdmin");
const { notifyCustomerStatusChange } = require("../notifications");
//safe cancellations route
router.get('/bookings/:id/delete', requireAdmin, async(req,res) =>{
    const bookingId = req.params.id;
    let booking;
    try{
        const [rows] =await pool.query( `
            SELECT b.id,
            b.status,
            b.service_name_snapshot,
            b.requested_date,
            b.requested_time
            from bookings b
            WHERE b.id = ?
            LIMIT 1
        `,[bookingId]
    );
        //const [rows] = await pool.query(sql, [bookingId]);
        if(!rows || rows.length === 0){
            return res.status(404).send("Booking not found");
        }
        booking = rows[0];

    }catch(error){
        console.error("Booking delete page error",error);
        return res.status(500).send("Server Error Loading Delete Page.");
    }
    return res.render("admin_booking_delete",{
        booking,
        canDelete : booking.status!=="COMPLETED",
    });
    
});

//POST /admin/bookings
router.post('/bookings/:id/delete', requireAdmin, async(req,res) => {
    const bookingId = req.params.id;
     try{
        const [rows] = await pool.query(
            "SELECT status from bookings WHERE id = ? LIMIT 1", [bookingId]
        );

        if(!rows || !rows.length === 0){
            return res.status(404).send("Booking not found");
        }
        if(rows[0].status === "COMPLETED"){
            return res.status(400).send("Cannot delete a completed booking.");
        }
        
        await pool.query("DELETE FROM bookings WHERE id =?",[bookingId]);
        return res.redirect('/admin/bookings');

    }catch(error){
        console.error("Booing deletion error:",error);
        return res.status(500).send("Server Error Deleting Booking");
    }
});
//change booking status

router.post('/bookings/:id/status', requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const newStatus = req.body.status;
  const adminId = req.session.adminId;

  try {
    const [rows] = await pool.query(
      `
      SELECT
        b.status,
        b.service_name_snapshot,
        c.email AS customer_email,
        c.full_name AS customer_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      WHERE b.id = ?
      `,
      [bookingId]
    );

    if (rows.length === 0) {
      return res.status(404).send("Booking not found");
    }

    const oldStatus = rows[0].status;

    const [updateResult] = await pool.query(
      `
      UPDATE bookings
      SET status = ?
      WHERE id = ?
      `,
      [newStatus, bookingId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(400).send("Status update failed");
    }

    await pool.query(
      `
      INSERT INTO booking_status_history
        (booking_id, old_status, new_status, changed_by_admin_id)
      VALUES (?, ?, ?, ?)
      `,
      [bookingId, oldStatus, newStatus, adminId]
    );

    await notifyCustomerStatusChange({
      email: rows[0].customer_email,
      full_name: rows[0].customer_name,
      bookingId,
      status: newStatus,
      serviceName: rows[0].service_name_snapshot
    });

    return res.redirect(`/admin/bookings/${bookingId}`);
  } catch (error) {
    console.error("Booking status update error:", error);
    return res.status(500).send("Error updating booking status");
  }
});

/*
router.post('/bookings/:id/status', async(req,res) => {
    const bookingId = req.params.id;
    const newStatus = req.body.status;

    try{
        const updatesql = `
        UPDATE bookings 
        set status = ?
        where id = ?        
        `;

        await pool.query(updatesql, [newStatus,bookingId]);
        return res.redirect(`/admin/bookings/${bookingId}`);
    }catch(error){
        console.error("Booking status Update error",error);
        return res.status(500).send("Server error Updating booking status.");
    }
});
*/
//selecting booking

router.get('/bookings/:id', requireAdmin, async(req,res)=>{
    const bookingId = req.params.id;
    //let booking;

    try{
        const [rows] = await pool.query(
        `
        SELECT
        b.id,
        b.requested_date,
        b.requested_time,
        b.status,
        b.service_name_snapshot,
        b.service_price_snapshot,
        b.service_duration_snapshot,
        b.notes,
        b.created_at,
        c.full_name AS customer_name,
        c.email AS customer_email,
        c.phone AS customer_phone,
        br.name AS branch_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN branches br ON b.branch_id = br.id
      WHERE b.id = ?
        `,[bookingId]
        );
        if(rows.length === 0){
            return res.status(404).send("Booking not Found");
        }
            const [interactions] = await pool.query(
      `
      SELECT channel, notes, created_at
      FROM booking_interactions
      WHERE booking_id = ?
      ORDER BY created_at DESC
      `,
      [bookingId]
    );

    return res.render("admin_booking_detail", {
      booking: rows[0],
      interactions
    });

       // return res.render("admin_booking_detail", {
        //    booking : rows[0],
        //});
        //booking : rows[0];
    }catch(error){
        console.error("Admin Booking Error",error);
        return res.status(500).send("Error Loading Booking Details");
    }

    //return res.render("admin_booking_detail", {booking});
});

/*
router.get('/bookings/:id', requireAdmin, async(req,res)=>{
    const bookingId = req.params.id;
    let booking;

    try{
        const sql = `
    SELECT
    b.id,
    b.requested_date,
    b.requested_time,
    b.confirmed_start,
    b.confirmed_end,
    b.status,
    b.notes,
    b.service_name_snapshot,
    b.service_price_snapshot,
    b.service_duration_snapshot,
    c.full_name AS customer_name,
    c.email AS customer_email,
    c.phone AS customer_phone
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    WHERE b.id = ?
    LIMIT 1
    `;
    const [rows] = await pool.query(sql,[bookingId]);

    if(!rows || rows.length === 0 ){
        return res.status(404).send("Booking not found");
    }
    booking = rows[0];


    }catch(error){
        console.error("Admin booking error",error);
        return res.status(500).send("Server error loading booking detail");
    }
});

*/
router.post('/bookings/:id/interactions', requireAdmin, async (req, res) => {
  const bookingId = req.params.id;
  const adminId = req.session.adminId;
  const { channel, notes } = req.body;

  if (!channel || !notes) {
    return res.status(400).send("All fields are required");
  }

  try {
    await pool.query(
      `
      INSERT INTO booking_interactions
        (booking_id, admin_id, channel, notes)
      VALUES (?, ?, ?, ?)
      `,
      [bookingId, adminId, channel, notes]
    );

    return res.redirect(`/admin/bookings/${bookingId}`);
  } catch (error) {
    console.error("Interaction insert error:", error);
    return res.status(500).send("Error saving interaction");
  }
});

router.get('/bookings', requireAdmin, async(req,res)=>{

     try {
    const [bookings] = await pool.query(
      `
      SELECT
        b.id,
        b.requested_date,
        b.requested_time,
        b.status,
        c.full_name AS customer_name,
        c.email AS customer_email,
        s.name AS service_name
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC
      `
    );

    return res.render("admin_bookings", {
      bookings
    });
  } catch (error) {
    console.error("Failed to load bookings:", error);
    return res.status(500).send("Failed to load bookings");
  }
    
    
});

/*
router.get('/bookings',requireAdmin, async(req,res)=>{
    try{
        const sql = `
        SELECT 
        b.id,
        b.requested_Date,
        b.requested_time,
        b.status,
        s.name as service_name
        FROM bookings b
        left JOIN services s ON s.id = b.service_id
        ORDER BY b.id DESC
        `;
        const [rows] = await pool.query(sql);
        return res.render("admin_bookings", {
            bookings:rows,
        });
   }catch(error){
    console.error("Admin bookings list error",error);
    return res.status(500).send("Server error loading admin bookings");
    }
});
*/
module.exports = router;
