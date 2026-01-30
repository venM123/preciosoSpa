const pool = require("../src/db");

async function run() {
  const [branches] = await pool.query("SELECT id, name FROM branches WHERE is_active = 1 ORDER BY name");
  if (!branches.length) {
    console.log("No active branches found.");
    process.exit(0);
  }

  const [missing] = await pool.query(
    `
    SELECT s.id AS service_id, s.name AS service_name
    FROM services s
    LEFT JOIN branch_services bs ON bs.service_id = s.id
    WHERE bs.id IS NULL
    ORDER BY s.id
    `
  );

  if (!missing.length) {
    console.log("No missing branch_services entries.");
    process.exit(0);
  }

  console.log(`Missing branch_services: ${missing.length}`);

  for (const branch of branches) {
    for (const service of missing) {
      await pool.query(
        `
        INSERT INTO branch_services (branch_id, service_id, price_override, is_active)
        VALUES (?, ?, NULL, 1)
        ON DUPLICATE KEY UPDATE is_active = 1
        `,
        [branch.id, service.service_id]
      );
    }
  }

  console.log("Reconciled branch_services entries for missing services.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Reconcile failed:", err);
  process.exit(1);
});
