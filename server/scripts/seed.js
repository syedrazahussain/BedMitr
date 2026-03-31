/**
 * Seed demo data: admin, hospitals, hospital staff, sample users.
 * Run: node scripts/seed.js  (from server folder, after schema.sql + .env)
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", ".env") });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "bedmitr",
  multipleStatements: true,
});

const hospitals = [
  {
    name: "Apollo Health City",
    address: "Road No 72, Jubilee Hills",
    city: "Hyderabad",
    state: "Telangana",
    phone: "+91 40 2360 7777",
    email_contact: "emergency@apollohyd.com",
    emergency_line: "1066",
    total_icu_beds: 85,
    available_icu_beds: 12,
    latitude: 17.4239,
    longitude: 78.4738,
  },
  {
    name: "Yashoda Hospitals — Secunderabad",
    address: "Alexander Road, Secunderabad",
    city: "Hyderabad",
    state: "Telangana",
    phone: "+91 40 4567 4567",
    email_contact: "icu@yashodamail.com",
    emergency_line: "040-45674567",
    total_icu_beds: 64,
    available_icu_beds: 3,
    latitude: 17.4399,
    longitude: 78.4983,
  },
  {
    name: "Manipal Hospital — Old Airport Road",
    address: "98, HAL Old Airport Rd, Kodihalli",
    city: "Bangalore",
    state: "Karnataka",
    phone: "+91 80 2502 4444",
    email_contact: "criticalcare@manipalblr.com",
    emergency_line: "080-25024444",
    total_icu_beds: 72,
    available_icu_beds: 18,
    latitude: 12.9592,
    longitude: 77.6484,
  },
  {
    name: "Narayana Health — Bommasandra",
    address: "258/A, Bommasandra Industrial Area",
    city: "Bangalore",
    state: "Karnataka",
    phone: "+91 80 7122 2222",
    email_contact: "emergency.narayana@nh.org",
    emergency_line: "18602087777",
    total_icu_beds: 95,
    available_icu_beds: 0,
    latitude: 12.8169,
    longitude: 77.7067,
  },
  {
    name: "Fortis Memorial — Gurgaon",
    address: "Sector 44, Opposite HUDA City Centre",
    city: "Delhi",
    state: "Haryana",
    phone: "+91 124 662 3000",
    email_contact: "icu.gurgaon@fortishealthcare.com",
    emergency_line: "0124-4962200",
    total_icu_beds: 48,
    available_icu_beds: 7,
    latitude: 28.4595,
    longitude: 77.0266,
  },
];

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query("DELETE FROM bed_update_log");
    await conn.query("DELETE FROM users");
    await conn.query("DELETE FROM hospitals");

    const hospitalIds = [];
    for (const h of hospitals) {
      const [r] = await conn.query(
        `INSERT INTO hospitals (name, address, city, state, phone, email_contact, emergency_line,
          total_icu_beds, available_icu_beds, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.name,
          h.address,
          h.city,
          h.state,
          h.phone,
          h.email_contact,
          h.emergency_line,
          h.total_icu_beds,
          h.available_icu_beds,
          h.latitude,
          h.longitude,
        ]
      );
      hospitalIds.push(r.insertId);
    }

    const adminHash = await bcrypt.hash("Admin123!", 12);
    await conn.query(
      `INSERT INTO users (email, password_hash, full_name, role, hospital_id) VALUES (?, ?, ?, 'admin', NULL)`,
      ["admin@bedmitr.local", adminHash, "System Administrator"]
    );

    const hospHash = await bcrypt.hash("Hospital123!", 12);
    await conn.query(
      `INSERT INTO users (email, password_hash, full_name, role, hospital_id) VALUES (?, ?, ?, 'hospital', ?)`,
      ["icu.staff@apollohyd.com", hospHash, "Apollo ICU Coordinator", hospitalIds[0]]
    );

    const userHash = await bcrypt.hash("User123!", 12);
    await conn.query(
      `INSERT INTO users (email, password_hash, full_name, role, hospital_id) VALUES (?, ?, ?, 'user', NULL)`,
      ["citizen@demo.com", userHash, "Demo Citizen"]
    );

    console.log("Seed complete.");
    console.log("  admin@bedmitr.local / Admin123!");
    console.log("  icu.staff@apollohyd.com / Hospital123! (Apollo Hyderabad)");
    console.log("  citizen@demo.com / User123!");
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
