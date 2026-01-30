let nodemailer;
try {
  nodemailer = require("nodemailer");
} catch (error) {
  nodemailer = null;
}

const { smtp, adminNotifyEmail } = require("./config");

function getTransporter() {
  if (!nodemailer) {
    return null;
  }
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  });
}

async function sendEmail({ to, subject, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log("[email:stub]", { to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    text
  });
}

async function notifyCustomerBookingRequest({ email, full_name, bookingId, serviceName, requestedDate, requestedTime }) {
  if (!email) return;
  await sendEmail({
    to: email,
    subject: "Booking request received",
    text: `Hi ${full_name || ""}, your booking #${bookingId} for ${serviceName} on ${requestedDate} at ${requestedTime} was received.`
  });
}

async function notifyCustomerStatusChange({ email, full_name, bookingId, status, serviceName }) {
  if (!email) return;
  await sendEmail({
    to: email,
    subject: "Booking status update",
    text: `Hi ${full_name || ""}, your booking #${bookingId} for ${serviceName} is now ${status}.`
  });
}

async function notifyAdminNewBooking({ bookingId, customerName, serviceName, requestedDate, requestedTime }) {
  if (!adminNotifyEmail) {
    console.log("[admin:stub]", { bookingId, customerName, serviceName, requestedDate, requestedTime });
    return;
  }

  await sendEmail({
    to: adminNotifyEmail,
    subject: "New booking request",
    text: `New booking #${bookingId} from ${customerName || "Unknown"} for ${serviceName} on ${requestedDate} at ${requestedTime}.`
  });
}

module.exports = {
  notifyCustomerBookingRequest,
  notifyCustomerStatusChange,
  notifyAdminNewBooking
};
