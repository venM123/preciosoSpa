require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../src/db");

async function seedAdmin() {
  const email = "admin@ladyboss.local";
  const plainPassword = "Admin123!";
  const fullName = "System Admin";

  const passwordHash = await bcrypt.hash(plainPassword, 10);

  const [existing] = await pool.query(
    "SELECT id FROM admins WHERE email = ?",
    [email]
  );

  if (existing.length > 0) {
    console.log("Admin already exists. No action taken.");
    process.exit(0);
  }

  await pool.query(
    `
    INSERT INTO admins (email, password_hash, full_name)
    VALUES (?, ?, ?)
    `,
    [email, passwordHash, fullName]
  );

  console.log("Admin user created:");
  console.log("Email:", email);
  console.log("Password:", plainPassword);

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seeding failed:");
  console.error(err);
  process.exit(1);
});
