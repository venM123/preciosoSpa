const env = process.env.NODE_ENV || "development";
const isProd = env === "production";

const sessionSecret = process.env.SESSION_SECRET || "dev-secret-change-later";

const rateLimit = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 120
};

const smtp = {
  host: process.env.SMTP_HOST || "",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  user: process.env.SMTP_USER || "",
  pass: process.env.SMTP_PASS || "",
  from: process.env.SMTP_FROM || "no-reply@ladyboss.local"
};

const adminNotifyEmail = process.env.ADMIN_NOTIFY_EMAIL || "";
const customerAuthEnabled = process.env.CUSTOMER_AUTH_ENABLED === "true";

module.exports = {
  env,
  isProd,
  sessionSecret,
  rateLimit,
  smtp,
  adminNotifyEmail,
  customerAuthEnabled
};
