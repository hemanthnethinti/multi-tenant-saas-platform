const { pool } = require("../db");
const { success, error } = require("../utils/response");
const { logAction } = require("../utils/audit");

exports.createProject = async (req, res) => {
  const uid = req.user.id; const tenantId = req.user.tenantId;
  const { name, description = "", status = "active" } = req.body;
  if (!name) return error(res, 400, "Validation errors");
  const tRes = await pool.query("SELECT max_projects FROM tenants WHERE id = $1", [tenantId]);
  if (tRes.rowCount === 0) return error(res, 403, "Project limit reached");
  const maxProjects = parseInt(tRes.rows[0].max_projects);
  const count = await pool.query("SELECT COUNT(*) FROM projects WHERE tenant_id = $1", [tenantId]);
  if (parseInt(count.rows[0].count) >= maxProjects) return error(res, 403, "Project limit reached");
  const { randomUUID } = require("crypto");
  const id = randomUUID();
  const p = await pool.query(
    `INSERT INTO projects(id, tenant_id, name, description, status, created_by)
     VALUES($1, $2, $3, $4, $5, $6)
     RETURNING id, tenant_id, name, description, status, created_by, created_at`,
    [id, tenantId, name, description, status, uid]
  );
  try { await logAction({ tenantId, userId: uid, action: "CREATE_PROJECT", entityType: "project", entityId: id, ip: req.ip }); } catch {}
  return success(res, p.rows[0], null, 201);
};

exports.listProjects = async (req, res) => {
  const tenantId = req.user.tenantId;
  const { status, search, page = 1, limit = 20 } = req.query;
  const l = Math.min(Math.max(parseInt(limit), 1), 100);
  const p = Math.max(parseInt(page), 1);
  const offset = (p - 1) * l;
  const where = ["tenant_id = $1"]; const vals = [tenantId]; let i = 2;
  if (status) { where.push(`status = $${i++}`); vals.push(status); }
  if (search) { where.push(`LOWER(name) LIKE $${i}`); vals.push(`%${search.toLowerCase()}%`); i++; }
  const rows = await pool.query(
    `SELECT pr.id, pr.name, pr.description, pr.status, pr.created_at,
            u.id as created_by_id, u.full_name as created_by_name,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = pr.id) AS task_count,
            (SELECT COUNT(*) FROM tasks t WHERE t.project_id = pr.id AND t.status = 'completed') AS completed_task_count
     FROM projects pr
     LEFT JOIN users u ON u.id = pr.created_by
     WHERE ${where.join(" AND ")}
     ORDER BY pr.created_at DESC
     LIMIT $${i} OFFSET $${i+1}`,
    [...vals, l, offset]
  );
  const count = await pool.query(`SELECT COUNT(*) FROM projects WHERE ${where.join(" AND ")}`,[...vals]);
  return success(res, {
    projects: rows.rows.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      status: r.status,
      createdBy: { id: r.created_by_id, fullName: r.created_by_name },
      taskCount: parseInt(r.task_count),
      completedTaskCount: parseInt(r.completed_task_count),
      createdAt: r.created_at,
    })),
    total: parseInt(count.rows[0].count),
    pagination: { currentPage: p, totalPages: Math.ceil(parseInt(count.rows[0].count)/l), limit: l }
  });
};

exports.updateProject = async (req, res) => {
  const { projectId } = req.params;
  const requester = req.user;
  const pRes = await pool.query("SELECT id, tenant_id, created_by FROM projects WHERE id = $1", [projectId]);
  if (pRes.rowCount === 0) return error(res, 404, "Project not found");
  const proj = pRes.rows[0];
  if (requester.tenantId !== proj.tenant_id) return error(res, 403, "Not authorized");
  if (requester.role !== "tenant_admin" && requester.id !== proj.created_by) return error(res, 403, "Not authorized");
  const { name, description, status } = req.body;
  const updates = []; const vals = []; let i = 1;
  if (name !== undefined) { updates.push(`name = $${i++}`); vals.push(name); }
  if (description !== undefined) { updates.push(`description = $${i++}`); vals.push(description); }
  if (status !== undefined) { updates.push(`status = $${i++}`); vals.push(status); }
  updates.push("updated_at = NOW()");
  const sql = `UPDATE projects SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, name, description, status, updated_at`;
  vals.push(projectId);
  const up = await pool.query(sql, vals);
  try { await logAction({ tenantId: proj.tenant_id, userId: requester.id, action: "UPDATE_PROJECT", entityType: "project", entityId: projectId, ip: req.ip }); } catch {}
  return success(res, up.rows[0], "Project updated successfully");
};

exports.deleteProject = async (req, res) => {
  const { projectId } = req.params;
  const requester = req.user;
  const pRes = await pool.query("SELECT id, tenant_id, created_by FROM projects WHERE id = $1", [projectId]);
  if (pRes.rowCount === 0) return error(res, 404, "Project not found");
  const proj = pRes.rows[0];
  if (requester.tenantId !== proj.tenant_id) return error(res, 403, "Not authorized");
  if (requester.role !== "tenant_admin" && requester.id !== proj.created_by) return error(res, 403, "Not authorized");
  await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);
  try { await logAction({ tenantId: proj.tenant_id, userId: requester.id, action: "DELETE_PROJECT", entityType: "project", entityId: projectId, ip: req.ip }); } catch {}
  return success(res, null, "Project deleted successfully");
};
