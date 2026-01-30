require("dotenv").config();
const express = require("express");
const session = require("express-session");
const adminAuthRoutes = require("./routes/admin.auth");
const adminServicesRoutes = require("./routes/admin.services");
const adminBookingsRoutes = require('./routes/admin.bookings.js')
const adminReportsRoutes = require("./routes/admin.reports");
const adminBranchServicesRoutes = require("./routes/admin.branch_services");
const customerServiceRoutes = require('./routes/customer.services');
const customerBookingsRoutes = require('./routes/customer.bookings');
const customerAuthRoutes = require("./routes/customer.auth");
const requestLogger = require("./middleware/requestLogger");
const rateLimiter = require("./middleware/rateLimit");
const { sessionSecret, isProd } = require("./config");
const path = require("path");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(requestLogger);
app.use(rateLimiter);

app.use(
  session({
    name: "ladyboss.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: isProd },
  })
);

app.use((req, res, next) => {
  res.locals.customerLoggedIn = Boolean(req.session && req.session.customerId);
  res.locals.customerName = req.session && req.session.customerName ? req.session.customerName : null;
  next();
});




//routes
app.use("/admin", adminAuthRoutes);
app.use("/admin", adminServicesRoutes);
app.use('/admin', adminBookingsRoutes);
app.use('/admin', adminReportsRoutes);
app.use('/admin', adminBranchServicesRoutes);
app.use('/customer', customerAuthRoutes);
app.use('/', customerServiceRoutes);
app.use('/', customerBookingsRoutes);
//end
/* ---------- middleware ---------- */

app.use(express.json());


app.set("view engine","ejs");
app.set("views", path.join(__dirname, "views"));





app.get("/health", (req,res) => {
  res.json({ok:true});
});

app.use((req, res) => {
  res.status(404).render("not_found", { message: "Page not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).render("error", { message: "Something went wrong" });
});


module.exports = app;
