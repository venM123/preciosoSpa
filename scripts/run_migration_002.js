const fs = require("fs");
const path = require("path");
const pool = require("../src/db");

async function run() {
  const filePath = path.join(__dirname, "..", "db", "migrations", "002_branch_services.sql");
  const sql = fs.readFileSync(filePath, "utf8");
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await pool.query(stmt);
  }

  console.log("Migration 002_branch_services.sql applied.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
