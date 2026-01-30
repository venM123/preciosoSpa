function isNonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidEmail(value) {
  if (!isNonEmpty(value)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  if (!isNonEmpty(value)) return false;
  return /^[0-9+()\s-]{7,20}$/.test(value);
}

function isPositiveNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0;
}

function isValidDateTime(value) {
  if (!isNonEmpty(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

module.exports = {
  isNonEmpty,
  isValidEmail,
  isValidPhone,
  isPositiveNumber,
  isValidDateTime
};
