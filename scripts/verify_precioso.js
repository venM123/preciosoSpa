const pool = require("../src/db");

async function run() {
  const [branchCount] = await pool.query("SELECT COUNT(*) AS count FROM branches");
  const [serviceCount] = await pool.query("SELECT COUNT(*) AS count FROM services");
  const [branchServiceCount] = await pool.query("SELECT COUNT(*) AS count FROM branch_services");

  console.log("branches:", branchCount[0].count);
  console.log("services:", serviceCount[0].count);
  console.log("branch_services:", branchServiceCount[0].count);

  const [sample] = await pool.query(
    `
    SELECT b.name AS branch, s.name AS service, COALESCE(bs.price_override, s.price) AS price
    FROM branch_services bs
    JOIN branches b ON b.id = bs.branch_id
    JOIN services s ON s.id = bs.service_id
    ORDER BY bs.id DESC
    LIMIT 5
    `
  );

  console.log("sample:", sample);
  process.exit(0);
}

run().catch((err) => {
  console.error("Verify failed:", err);
  process.exit(1);
});
