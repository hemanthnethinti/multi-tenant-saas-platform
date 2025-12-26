const { pool } = require("../db");
const { success, error } = require("../utils/response");
const bcrypt = require("bcrypt");
const { logAction } = require("../utils/audit");

exports.addUserToTenant = async (req, res) => {
  const { tenantId } = req.params;
  if (req.user.role !== "tenant_admin" || req.user.tenantId !== tenantId) return error(res, 403, "Forbidden");
  const { email, password, fullName, role = "user" } = req.body;
  if (!email || !password || !fullName) return error(res, 400, "Validation errors");
  const tRes = await pool.query("SELECT max_users FROM tenants WHERE id = $1", [tenantId]);
  if (tRes.rowCount === 0) return error(res, 404, "Tenant not found");
  const maxUsers = parseInt(tRes.rows[0].max_users);
  const count = await pool.query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [tenantId]);
  if (parseInt(count.rows[0].count) >= maxUsers) return error(res, 403, "Subscription limit reached");
  const exists = await pool.query("SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2", [tenantId, email]);
  if (exists.rowCount > 0) return error(res, 409, "Email already exists in this tenant");
  const { randomUUID } = require("crypto");
  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  const user = await pool.query(
    `INSERT INTO users(id, tenant_id, email, password_hash, full_name, role, is_active)
     VALUES($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id, email, full_name, role, tenant_id, is_active, created_at`,
    [id, tenantId, email, hash, fullName, role]
  );
  try { await logAction({ tenantId, userId: req.user.id, action: "CREATE_USER", entityType: "user", entityId: id, ip: req.ip }); } catch {}
  return success(res, user.rows[0], "User created successfully", 201);
};

exports.listTenantUsers = async (req, res) => {
  const { tenantId } = req.params;
  if (req.user.role !== "super_admin" && req.user.tenantId !== tenantId) return error(res, 403, "Unauthorized");
  const { search, role, page = 1, limit = 50 } = req.query;
  const l = Math.min(Math.max(parseInt(limit), 1), 100);
  const p = Math.max(parseInt(page), 1);
  const offset = (p - 1) * l;
  const where = ["tenant_id = $1"]; const vals = [tenantId]; let i = 2;
  if (role) { where.push(`role = $${i++}`); vals.push(role); }
  if (search) { where.push(`(LOWER(full_name) LIKE $${i} OR LOWER(email) LIKE $${i})`); vals.push(`%${search.toLowerCase()}%`); i++; }
  const rows = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at FROM users
     WHERE ${where.join(" AND ")}
     ORDER BY created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...vals, l, offset]
  );
  const count = await pool.query(`SELECT COUNT(*) FROM users WHERE ${where.join(" AND ")}`,[...vals]);
  return success(res, {
    users: rows.rows,
    total: parseInt(count.rows[0].count),
    pagination: { currentPage: p, totalPages: Math.ceil(parseInt(count.rows[0].count)/l), limit: l }
  });
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const requester = req.user;
  const uRes = await pool.query("SELECT id, tenant_id, role FROM users WHERE id = $1", [userId]);
  if (uRes.rowCount === 0) return error(res, 404, "User not found");
  const target = uRes.rows[0];
  if (requester.role !== "tenant_admin" && requester.id !== target.id) return error(res, 403, "Forbidden");
  if (requester.role !== "super_admin" && requester.tenantId !== target.tenant_id) return error(res, 403, "Forbidden");

  const { fullName, role, isActive } = req.body;
  const updates = []; const vals = []; let i = 1;
  if (typeof fullName === "string" && requester.id === target.id) { updates.push(`full_name = $${i++}`); vals.push(fullName); }
  if (role !== undefined) {
    if (requester.role !== "tenant_admin") return error(res, 403, "Forbidden");
    updates.push(`role = $${i++}`); vals.push(role);
  }
  if (isActive !== undefined) {
    if (requester.role !== "tenant_admin") return error(res, 403, "Forbidden");
    updates.push(`is_active = $${i++}`); vals.push(!!isActive);
  }
  if (updates.length === 0) return success(res, { id: target.id, updatedAt: new Date().toISOString() }, "User updated successfully");
  updates.push("updated_at = NOW()");
  const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, full_name, role, updated_at`;
  vals.push(userId);
  const up = await pool.query(sql, vals);
  try { await logAction({ tenantId: target.tenant_id, userId: requester.id, action: "UPDATE_USER", entityType: "user", entityId: userId, ip: req.ip }); } catch {}
  return success(res, up.rows[0], "User updated successfully");
};

exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  const requester = req.user;
  if (requester.role !== "tenant_admin") return error(res, 403, "Forbidden");
  const uRes = await pool.query("SELECT id, tenant_id FROM users WHERE id = $1", [userId]);
  if (uRes.rowCount === 0) return error(res, 404, "User not found");
  const target = uRes.rows[0];
  if (requester.id === target.id) return error(res, 403, "Cannot delete yourself");
  if (requester.tenantId !== target.tenant_id) return error(res, 403, "Forbidden");
  // Unassign tasks
  await pool.query("UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  try { await logAction({ tenantId: target.tenant_id, userId: requester.id, action: "DELETE_USER", entityType: "user", entityId: userId, ip: req.ip }); } catch {}
  return success(res, null, "User deleted successfully");
};
