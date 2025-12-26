const { pool } = require("../db");
const { success, error } = require("../utils/response");
const { logAction } = require("../utils/audit");

function canAccessTenant(req, tenantId) {
  return req.user.role === "super_admin" || req.user.tenantId === tenantId;
}

exports.getTenant = async (req, res) => {
  const { tenantId } = req.params;
  const tRes = await pool.query(
    `SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at
     FROM tenants WHERE id = $1`,
    [tenantId]
  );
  if (tRes.rowCount === 0) return error(res, 404, "Tenant not found");
  if (!canAccessTenant(req, tenantId)) return error(res, 403, "Unauthorized access");
  const t = tRes.rows[0];
  const [users, projects, tasks] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [tenantId]),
    pool.query("SELECT COUNT(*) FROM projects WHERE tenant_id = $1", [tenantId]),
    pool.query("SELECT COUNT(*) FROM tasks WHERE tenant_id = $1", [tenantId]),
  ]);
  return success(res, {
    id: t.id,
    name: t.name,
    subdomain: t.subdomain,
    status: t.status,
    subscriptionPlan: t.subscription_plan,
    maxUsers: t.max_users,
    maxProjects: t.max_projects,
    createdAt: t.created_at,
    stats: {
      totalUsers: parseInt(users.rows[0].count),
      totalProjects: parseInt(projects.rows[0].count),
      totalTasks: parseInt(tasks.rows[0].count),
    },
  });
};

exports.updateTenant = async (req, res) => {
  const { tenantId } = req.params;
  const role = req.user.role;
  const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;
  const tRes = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantId]);
  if (tRes.rowCount === 0) return error(res, 404, "Tenant not found");
  if (role !== "super_admin" && (status || subscriptionPlan || maxUsers || maxProjects)) {
    return error(res, 403, "Forbidden");
  }
  if (role !== "super_admin" && !canAccessTenant(req, tenantId)) return error(res, 403, "Unauthorized access");

  const updates = [];
  const values = [];
  let idx = 1;
  if (typeof name === "string") { updates.push(`name = $${idx++}`); values.push(name); }
  if (typeof status === "string") { updates.push(`status = $${idx++}`); values.push(status); }
  if (typeof subscriptionPlan === "string") { updates.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan); }
  if (maxUsers !== undefined) { updates.push(`max_users = $${idx++}`); values.push(maxUsers); }
  if (maxProjects !== undefined) { updates.push(`max_projects = $${idx++}`); values.push(maxProjects); }
  updates.push(`updated_at = NOW()`);
  const sql = `UPDATE tenants SET ${updates.join(", ")} WHERE id = $${idx} RETURNING id, name, updated_at`;
  values.push(tenantId);
  const up = await pool.query(sql, values);
  try { await logAction({ tenantId, userId: req.user.id, action: "UPDATE_TENANT", entityType: "tenant", entityId: tenantId, ip: req.ip }); } catch {}
  return success(res, up.rows[0], "Tenant updated successfully");
};

exports.listTenants = async (req, res) => {
  if (req.user.role !== "super_admin") return error(res, 403, "Not super_admin");
  const page = Math.max(parseInt(req.query.page || "1"), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "10"), 1), 100);
  const offset = (page - 1) * limit;
  const { status, subscriptionPlan } = req.query;

  const where = [];
  const values = [];
  let i = 1;
  if (status) { where.push(`status = $${i++}`); values.push(status); }
  if (subscriptionPlan) { where.push(`subscription_plan = $${i++}`); values.push(subscriptionPlan); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const rows = await pool.query(
    `SELECT t.id, t.name, t.subdomain, t.status, t.subscription_plan, t.created_at,
            (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
            (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects
     FROM tenants t ${whereSql}
     ORDER BY t.created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...values, limit, offset]
  );
  const count = await pool.query(`SELECT COUNT(*) FROM tenants ${whereSql}`, values);
  return success(res, {
    tenants: rows.rows.map(r => ({
      id: r.id,
      name: r.name,
      subdomain: r.subdomain,
      status: r.status,
      subscriptionPlan: r.subscription_plan,
      totalUsers: parseInt(r.total_users),
      totalProjects: parseInt(r.total_projects),
      createdAt: r.created_at,
    })),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
      totalTenants: parseInt(count.rows[0].count),
      limit,
    }
  });
};
