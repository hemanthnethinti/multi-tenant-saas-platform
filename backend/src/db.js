const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");


const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`▶ Running migration: ${file}`);
    await pool.query(sql);
  }
}

async function runSeeds() {
  // If we already have a super admin, we assume seed exists
  const res = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'super_admin'");
  if (parseInt(res.rows[0].count) > 0) {
    console.log("✔ Seed data already exists — skipping");
    return;
  }

  console.log("▶ Seeding database (users, tenant, projects, tasks)…");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Create super admin
    const superAdminId = randomUUID();
    const superHash = await bcrypt.hash("Admin@123", 10);
    await client.query(
      `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES($1, NULL, $2, $3, $4, 'super_admin', TRUE)`,
      [superAdminId, "superadmin@system.com", superHash, "System Super Admin"]
    );

    // Create Demo tenant
    const tenantId = randomUUID();
    await client.query(
      `INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES($1, $2, $3, 'active', 'pro', 25, 15)`,
      [tenantId, "Demo Company", "demo"]
    );

    // Create tenant admin and users
    const adminId = randomUUID();
    const adminHash = await bcrypt.hash("Demo@123", 10);
    await client.query(
      `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES($1, $2, $3, $4, $5, 'tenant_admin', TRUE)`,
      [adminId, tenantId, "admin@demo.com", adminHash, "Demo Admin"]
    );

    const user1Id = randomUUID();
    const user2Id = randomUUID();
    const userHash = await bcrypt.hash("User@123", 10);
    await client.query(
      `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES($1, $2, $3, $4, $5, 'user', TRUE)`,
      [user1Id, tenantId, "user1@demo.com", userHash, "Demo User One"]
    );
    await client.query(
      `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES($1, $2, $3, $4, $5, 'user', TRUE)`,
      [user2Id, tenantId, "user2@demo.com", userHash, "Demo User Two"]
    );

    // Create projects
    const project1Id = randomUUID();
    const project2Id = randomUUID();
    await client.query(
      `INSERT INTO projects(id, tenant_id, name, description, status, created_by)
       VALUES($1, $2, $3, $4, 'active', $5)`,
      [project1Id, tenantId, "Internal Operations", "First demo project", adminId]
    );
    await client.query(
      `INSERT INTO projects(id, tenant_id, name, description, status, created_by)
       VALUES($1, $2, $3, $4, 'active', $5)`,
      [project2Id, tenantId, "Customer Support", "Second demo project", adminId]
    );

    // Create sample tasks
    const tasks = [
      {
        title: "Setup tenant onboarding flow",
        description: "Implement new registration & onboarding UX",
        status: "in_progress",
        priority: "high",
        assigned_to: user1Id,
        project_id: project1Id,
        dueDays: 5,
      },
      {
        title: "Define project templates",
        description: "Create reusable project templates",
        status: "todo",
        priority: "medium",
        assigned_to: user2Id,
        project_id: project1Id,
        dueDays: 7,
      },
      {
        title: "Setup ticket categories",
        description: "Define ticket priorities & routing",
        status: "todo",
        priority: "low",
        assigned_to: user1Id,
        project_id: project2Id,
        dueDays: 4,
      },
      {
        title: "Automate canned replies",
        description: "Create canned response library",
        status: "in_progress",
        priority: "medium",
        assigned_to: user2Id,
        project_id: project2Id,
        dueDays: 6,
      },
      {
        title: "Daily metrics dashboard",
        description: "Implement dashboard for support KPIs",
        status: "todo",
        priority: "high",
        assigned_to: user2Id,
        project_id: project2Id,
        dueDays: 10,
      },
    ];

    for (const t of tasks) {
      await client.query(
        `INSERT INTO tasks(id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
         VALUES($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE + ($9 || ' days')::interval)`,
        [randomUUID(), t.project_id, tenantId, t.title, t.description, t.status, t.priority, t.assigned_to, t.dueDays]
      );
    }

    await client.query("COMMIT");
    console.log("✔ Seed completed");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", e);
    throw e;
  } finally {
    client.release();
  }
}

async function checkDb() {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

module.exports = { pool, runMigrations, runSeeds, checkDb };
