const bcrypt = require("bcrypt");
const { pool } = require("../db");
const { signToken } = require("../utils/jwt");
const { success, error } = require("../utils/response");

exports.registerTenant = async (req, res) => {
  const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
  if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
    return error(res, 400, "Validation errors");
  }

  // basic subdomain validation
  const sd = String(subdomain).toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(sd) || sd.length < 3 || sd.length > 63) {
    return error(res, 400, "Invalid subdomain format");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Check uniqueness of subdomain
    const existing = await client.query("SELECT 1 FROM tenants WHERE subdomain = $1", [sd]);
    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return error(res, 409, "Subdomain already exists");
    }

    const { randomUUID } = require("crypto");
    const tenantId = randomUUID();
    await client.query(
      `INSERT INTO tenants(id, name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES($1, $2, $3, 'active', 'free', 5, 3)`,
      [tenantId, tenantName, sd]
    );

    const adminId = randomUUID();
    const hash = await bcrypt.hash(adminPassword, 10);
    // Check email uniqueness per tenant
    const existEmail = await client.query(
      `SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2`,
      [tenantId, adminEmail]
    );
    if (existEmail.rowCount > 0) {
      await client.query("ROLLBACK");
      return error(res, 409, "Email already exists in this tenant");
    }
    await client.query(
      `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
       VALUES($1, $2, $3, $4, $5, 'tenant_admin', TRUE)`,
      [adminId, tenantId, adminEmail, hash, adminFullName]
    );

    await client.query("COMMIT");
    return success(res, {
      tenantId,
      subdomain: sd,
      adminUser: { id: adminId, email: adminEmail, fullName: adminFullName, role: "tenant_admin" },
    }, "Tenant registered successfully", 201);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    return error(res, 500, "Failed to register tenant");
  } finally {
    client.release();
  }
};

exports.login = async (req, res) => {
  const { email, password, tenantSubdomain, tenantId } = req.body;
  if (!email || !password || (!tenantSubdomain && !tenantId)) {
    return error(res, 400, "Validation errors");
  }

  // Resolve tenant
  let tenant;
  if (tenantId) {
    const t = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantId]);
    tenant = t.rows[0];
  } else {
    const t = await pool.query("SELECT * FROM tenants WHERE subdomain = $1", [tenantSubdomain]);
    tenant = t.rows[0];
  }
  if (!tenant) return error(res, 404, "Tenant not found");
  if (tenant.status !== "active") return error(res, 403, "Account suspended/inactive");

  const result = await pool.query(
    `SELECT id, email, password_hash, role, tenant_id, full_name, is_active
     FROM users
     WHERE email = $1 AND (tenant_id = $2 OR role = 'super_admin')`,
    [email, tenant.id]
  );
  if (result.rowCount === 0) return error(res, 401, "Invalid credentials");
  const user = result.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return error(res, 401, "Invalid credentials");
  if (!user.is_active) return error(res, 403, "Account inactive");

  const token = signToken({ id: user.id, tenant_id: user.tenant_id, role: user.role });
  return success(res, {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      tenantId: user.tenant_id,
    },
    token,
    expiresIn: 86400,
  });
};

exports.me = async (req, res) => {
  const uid = req.user.id;
  const userRes = await pool.query(
    `SELECT id, email, full_name, role, is_active, tenant_id FROM users WHERE id = $1`,
    [uid]
  );
  if (userRes.rowCount === 0) return error(res, 404, "User not found");
  const u = userRes.rows[0];
  let tenant = null;
  if (u.tenant_id) {
    const t = await pool.query(
      `SELECT id, name, subdomain, subscription_plan, max_users, max_projects FROM tenants WHERE id = $1`,
      [u.tenant_id]
    );
    tenant = t.rows[0] || null;
  }
  return success(res, {
    id: u.id,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    isActive: u.is_active,
    tenant,
  });
};

exports.logout = async (req, res) => {
  // JWT-only: client should remove token
  const ip = req.ip;
  try {
    const { logAction } = require("../utils/audit");
    await logAction({ tenantId: req.user.tenantId, userId: req.user.id, action: "LOGOUT", entityType: "auth", entityId: null, ip });
  } catch {}
  return success(res, null, "Logged out successfully");
};
