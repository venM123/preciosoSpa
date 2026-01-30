const { rateLimit } = require("../config");

const store = new Map();

function isStaticPath(pathname) {
  return pathname.startsWith("/css/") || pathname.startsWith("/uploads/");
}

module.exports = function rateLimiter(req, res, next) {
  if (isStaticPath(req.path)) {
    return next();
  }

  const now = Date.now();
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const windowMs = rateLimit.windowMs;
  const max = rateLimit.max;

  const entry = store.get(ip) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  store.set(ip, entry);

  if (entry.count > max) {
    res.status(429).send("Too many requests. Please try again later.");
    return;
  }

  next();
};
