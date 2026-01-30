const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require("bcrypt");
const requireCustomer = require("../middleware/requireCustomer");
const {
  isValidEmail,
  isValidPhone,
  isValidDateTime
} = require("../utils/validators");
const {
  notifyAdminNewBooking,
  notifyCustomerBookingRequest
} = require('../notifications');

router.get('/bookings', requireCustomer, async (req, res) => {
  try {
    const [customers] = await pool.query(
      `
      SELECT id, full_name, email
      FROM customers
      WHERE id = ?
      `,
      [req.session.customerId]
    );

    if (customers.length === 0) {
      req.session.destroy(() => {});
      return res.redirect("/customer/login");
    }

    const customer = customers[0];

    const [bookings] = await pool.query(
      `
      SELECT
        id,
        requested_date,
        requested_time,
        status,
        service_name_snapshot,
        service_price_snapshot,
        service_duration_snapshot,
        created_at
      FROM bookings
      WHERE customer_id = ?
      ORDER BY created_at DESC
      `,
      [customer.id]
    );

    return res.render("customer_bookings_list", {
      customer,
      bookings
    });
  } catch (error) {
    console.error("Customer booking lookup error:", error);
    return res.status(500).send("Error loading bookings");
  }
});

router.post('/bookings/new', async(req,res)=>{

  const {
    branch_id,
    service_id,
    requested_datetime,
    full_name,
    email,
    phone
  } = req.body;

  if(!branch_id || !service_id || !requested_datetime || !full_name || !email || !phone){
    return res.status(400).send('All fields are required');
  }
  if (!isValidEmail(email) || !isValidPhone(phone) || !isValidDateTime(requested_datetime)) {
    return res.status(400).send('Invalid booking details');
  }

  try{
    const[rows] = await pool.query(
      `
      SELECT id
      FROM customers
      WHERE  email =?
      `, [email]
    );
    let customerStatus;
    let customerId;

    if(rows.length > 0){
      customerId = rows[0].id;
      customerStatus  = "Customer Exists already";
    }else{
      const tempPassword = Math.random().toString(36).slice(-10);
      const password_hash = await bcrypt.hash(tempPassword,10);
      const [result] = await pool.query(
        `
        INSERT INTO customers (email, password_hash,  full_name, phone)
        VALUES(?,?,?,?)
        `, [email,password_hash,full_name,phone]
      );

      customerId= result.insertId;
      customerStatus = "New Customer Created";
    }
    const [serviceRows] = await pool.query(
      `
      SELECT s.name,
             s.duration_minutes,
             COALESCE(bs.price_override, s.price) AS price
      FROM services s
      JOIN branch_services bs ON bs.service_id = s.id
      WHERE s.id = ? AND bs.branch_id = ? AND s.is_active = 1 AND bs.is_active = 1
      `, [service_id, branch_id]
    )

    if(serviceRows.length === 0){
      return res.status(400).send("Invalid service Selected");
    }
    const service = serviceRows[0];
    const requestedDateTime = new Date(requested_datetime);
    const requestedDate = requestedDateTime.toISOString().split("T")[0];
    const requestedTime = requestedDateTime.toTimeString().split(" ")[0];

    const [bookingResult] = await pool.query(
      `
      INSERT INTO bookings(
        customer_id,
        branch_id,
        service_id,
        requested_date,
        requested_time,
        service_name_snapshot,
        service_price_snapshot,
        service_duration_snapshot
      )
      VALUES(?,?,?,?,?,?,?,?)
      `, [customerId, branch_id, service_id,
        requestedDate,
        requestedTime,
        service.name,
        service.price,
        service.duration_minutes
      ]
    );
    const bookingId = bookingResult.insertId;

    await notifyCustomerBookingRequest({
      email,
      full_name,
      bookingId,
      serviceName: service.name,
      requestedDate,
      requestedTime
    });

    await notifyAdminNewBooking({
      bookingId,
      customerName: full_name,
      serviceName: service.name,
      requestedDate,
      requestedTime
    });

    const [branchRows] = await pool.query(
      `SELECT name FROM branches WHERE id = ?`,
      [branch_id]
    );
    const branchName = branchRows.length ? branchRows[0].name : null;

    return res.render('booking_confirm', {
      service_id,
      requested_datetime,
      full_name,
      email,
      phone,
      customerStatus,
      customerId,
      bookingId,
      branchName
    });

  }catch(error){
    console.error("Customer lookup failed",error);
    return res.status(500).send("Customer lookup failed");
  }
});

router.get('/bookings/new', async(req,res) =>{
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
        SELECT s.id, s.name
        FROM services s
        JOIN branch_services bs ON bs.service_id = s.id
        WHERE s.is_active = 1 AND bs.is_active = 1 AND bs.branch_id = ?
        ORDER BY s.name
        `,
        [selectedBranchId]
      );
      services = rows;
    }

    return res.render('booking_new', {
      services,
      branches,
      selectedBranchId
    });
  }catch(error){
    console.error('Failed to load services for booking',error);
    return res.status(500).send("Unable to load booking form");
  }
});

router.get('/bookings/:id', requireCustomer, async (req, res) => {
  const bookingId = req.params.id;

  try {
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
        b.created_at,
        br.name AS branch_name
      FROM bookings b
      JOIN branches br ON b.branch_id = br.id
      WHERE b.id = ? AND b.customer_id = ?
      LIMIT 1
      `,
      [bookingId, req.session.customerId]
    );

    if (rows.length === 0) {
      return res.status(404).render("not_found", { message: "Booking not found" });
    }

    return res.render("customer_bookings_detail", {
      booking: rows[0]
    });
  } catch (error) {
    console.error("Customer booking detail error:", error);
    return res.status(500).send("Error loading booking detail");
  }
});

module.exports = router;
