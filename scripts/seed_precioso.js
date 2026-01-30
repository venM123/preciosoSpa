const pool = require("../src/db");

const branch = {
  name: "Matina Branch",
  address: "Dr 28A ACE Building Ilustre, Davao City; Door 2, Charlotte Dormitel, Roxas Avenue, Davao City",
  phone: "0923-085-7065, 0923-085-7066"
};

const promos = [
  // Set 1
  { name: "Facial w/ Diamond Peel + RF", price: 999, promo_set: "Set 1" },
  { name: "Facial w/ Diamond Peel + HIFU VMAX", price: 1199, promo_set: "Set 1" },
  { name: "Facial w/ Diamond Peel + Exilift", price: 1799, promo_set: "Set 1" },
  { name: "Facial w/ Diamond Peel + Carbon Peel", price: 1499, promo_set: "Set 1" },
  { name: "Facial w/ Diamond Peel + Underarm Removal (Diode)", price: 1499, promo_set: "Set 1" },
  { name: "Facial Diamond Peel + RF", price: 1499, promo_set: "Set 1" },
  { name: "Facial Diamond Peel + HIFU VMAX", price: 1499, promo_set: "Set 1" },
  { name: "UA Combo (Hair Removal, Diamond Peel, Carbon Peel)", price: 1499, promo_set: "Set 1" },

  // Set 2
  { name: "Moroccan Bath w/ Bleach", price: 1500, promo_set: "Set 2" },
  { name: "Body Scrub w/ Bleach + Foot Scrub + Hand Paraffin", price: 1299, promo_set: "Set 2" },
  { name: "Body Scrub w/ Bleach + Facial w/ Diamond Peel", price: 1299, promo_set: "Set 2" },
  { name: "Body Massage (Swedish) + Facial + Underarm Waxing + Manicure", price: 1299, promo_set: "Set 2" },
  { name: "Facial w/ Diamond Peel + Underarm Laser Hair Removal", price: 1299, promo_set: "Set 2" },
  { name: "Facial + Diamond Peel + Underarm Waxing", price: 799, promo_set: "Set 2" },

  // Set 3
  { name: "Facial w/ Mask + Underarm Hair Removal", price: 999, promo_set: "Set 3" },
  { name: "Facial w/ Mask + Mustache Hair Removal", price: 899, promo_set: "Set 3" },
  { name: "Facial w/ Mask + Upper & Lower Hair Removal", price: 899, promo_set: "Set 3" },
  { name: "Facial w/ Diamond Peel + Body Massage", price: 1100, promo_set: "Set 3" },
  { name: "Footspa + Manicure (Colored) + Pedicure (Colored)", price: 599, promo_set: "Set 3" },
  { name: "Footspa + Precioso Spa Signature Massage", price: 699, promo_set: "Set 3" },
  { name: "Footspa + Gel Polish Plain (Hands) + Pedicure Plain", price: 699, promo_set: "Set 3" },

  // Set 4
  { name: "Shiatsu + Swedish Massage", price: 499, promo_set: "Set 4" },
  { name: "Hand Massage + Paraffin Wax", price: 499, promo_set: "Set 4" },
  { name: "Foot Spa + Foot Massage + Foot Paraffin Wax", price: 799, promo_set: "Set 4" },
  { name: "Foot Massage + Dagdagay (Bamboo Stick)", price: 399, promo_set: "Set 4" },
  { name: "Foot Massage + Paraffin Wax", price: 549, promo_set: "Set 4" },
  { name: "Body Scrub + Bleach", price: 1000, promo_set: "Set 4" }
];

function needsConsultation(name) {
  const upper = name.toUpperCase();
  return upper.includes("LASER") || upper.includes("HIFU") || upper.includes("RF") || upper.includes("DIODE");
}

async function run() {
  const [branchRows] = await pool.query(
    "SELECT id FROM branches WHERE name = ?",
    [branch.name]
  );

  let branchId;
  if (branchRows.length) {
    branchId = branchRows[0].id;
    await pool.query(
      "UPDATE branches SET address = ?, phone = ?, is_active = 1 WHERE id = ?",
      [branch.address, branch.phone, branchId]
    );
  } else {
    const [result] = await pool.query(
      "INSERT INTO branches (name, address, phone, is_active) VALUES (?, ?, ?, 1)",
      [branch.name, branch.address, branch.phone]
    );
    branchId = result.insertId;
  }

  for (const promo of promos) {
    const description = `Includes: ${promo.name}`;
    const [serviceRows] = await pool.query(
      "SELECT id FROM services WHERE name = ? AND category = ? AND COALESCE(promo_set, '') = ?",
      [promo.name, "Combination Promo", promo.promo_set]
    );

    let serviceId;
    if (serviceRows.length) {
      serviceId = serviceRows[0].id;
      await pool.query(
        "UPDATE services SET price = ?, description = ?, requires_consultation = ?, is_active = 1 WHERE id = ?",
        [promo.price, description, needsConsultation(promo.name) ? 1 : 0, serviceId]
      );
    } else {
      const [result] = await pool.query(
        `
        INSERT INTO services
          (category, promo_set, name, description, duration_minutes, price, requires_consultation, is_active)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          "Combination Promo",
          promo.promo_set,
          promo.name,
          description,
          60,
          promo.price,
          needsConsultation(promo.name) ? 1 : 0
        ]
      );
      serviceId = result.insertId;
    }

    await pool.query(
      `
      INSERT INTO branch_services (branch_id, service_id, price_override, is_active)
      VALUES (?, ?, ?, 1)
      ON DUPLICATE KEY UPDATE price_override = VALUES(price_override), is_active = 1
      `,
      [branchId, serviceId, promo.price]
    );
  }

  console.log("Precioso Spa seed complete.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
