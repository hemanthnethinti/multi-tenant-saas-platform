const { pool } = require("../db");
const { success, error } = require("../utils/response");
const { logAction } = require("../utils/audit");

exports.createTask = async (req, res) => {
  const { projectId } = req.params;
  const { title, description = "", assignedTo = null, priority = "medium", dueDate = null } = req.body;
  if (!title) return error(res, 400, "Validation errors");
  const pRes = await pool.query("SELECT id, tenant_id FROM projects WHERE id = $1", [projectId]);
  if (pRes.rowCount === 0) return error(res, 404, "Project not found");
  const proj = pRes.rows[0];
  if (req.user.role !== "super_admin" && req.user.tenantId !== proj.tenant_id) return error(res, 403, "Project doesn't belong to user's tenant");
  if (assignedTo) {
    const uRes = await pool.query("SELECT id FROM users WHERE id = $1 AND tenant_id = $2", [assignedTo, proj.tenant_id]);
    if (uRes.rowCount === 0) return error(res, 400, "assignedTo user doesn't belong to same tenant");
  }
  const { randomUUID } = require("crypto");
  const id = randomUUID();
  const t = await pool.query(
    `INSERT INTO tasks(id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date)
     VALUES($1, $2, $3, $4, $5, 'todo', $6, $7, $8)
     RETURNING id, project_id, tenant_id, title, description, status, priority, assigned_to, due_date, created_at`,
    [id, projectId, proj.tenant_id, title, description, priority, assignedTo || null, dueDate]
  );
  try { await logAction({ tenantId: proj.tenant_id, userId: req.user.id, action: "CREATE_TASK", entityType: "task", entityId: id, ip: req.ip }); } catch {}
  return success(res, t.rows[0], null, 201);
};

exports.listProjectTasks = async (req, res) => {
  const { projectId } = req.params;
  const pRes = await pool.query("SELECT id, tenant_id FROM projects WHERE id = $1", [projectId]);
  if (pRes.rowCount === 0) return error(res, 404, "Project not found");
  const proj = pRes.rows[0];
  if (req.user.role !== "super_admin" && req.user.tenantId !== proj.tenant_id) return error(res, 403, "Project doesn't belong to user's tenant");
  const { status, assignedTo, priority, search, page = 1, limit = 50 } = req.query;
  const l = Math.min(Math.max(parseInt(limit), 1), 100);
  const p = Math.max(parseInt(page), 1);
  const offset = (p - 1) * l;
  const where = ["project_id = $1"]; const vals = [projectId]; let i = 2;
  if (status) { where.push(`status = $${i++}`); vals.push(status); }
  if (assignedTo) { where.push(`assigned_to = $${i++}`); vals.push(assignedTo); }
  if (priority) { where.push(`priority = $${i++}`); vals.push(priority); }
  if (search) { where.push(`LOWER(title) LIKE $${i}`); vals.push(`%${search.toLowerCase()}%`); i++; }
  const rows = await pool.query(
    `SELECT t.id, t.title, t.description, t.status, t.priority, t.assigned_to, t.due_date, t.created_at,
            u.id as aid, u.full_name as aname, u.email as aemail
     FROM tasks t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE ${where.join(" AND ")}
     ORDER BY priority DESC, due_date ASC NULLS LAST
     LIMIT $${i} OFFSET $${i+1}`,
    [...vals, l, offset]
  );
  const count = await pool.query(`SELECT COUNT(*) FROM tasks WHERE ${where.join(" AND ")}`,[...vals]);
  return success(res, {
    tasks: rows.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      assignedTo: r.aid ? { id: r.aid, fullName: r.aname, email: r.aemail } : null,
      dueDate: r.due_date,
      createdAt: r.created_at,
    })),
    total: parseInt(count.rows[0].count),
    pagination: { currentPage: p, totalPages: Math.ceil(parseInt(count.rows[0].count)/l), limit: l }
  });
};

exports.updateTaskStatus = async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  if (!status) return error(res, 400, "Validation errors");
  const tRes = await pool.query("SELECT id, tenant_id FROM tasks WHERE id = $1", [taskId]);
  if (tRes.rowCount === 0) return error(res, 404, "Task not found");
  const t = tRes.rows[0];
  if (req.user.role !== "super_admin" && req.user.tenantId !== t.tenant_id) return error(res, 403, "Forbidden");
  const up = await pool.query(
    `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at`,
    [status, taskId]
  );
  return success(res, up.rows[0]);
};

exports.updateTask = async (req, res) => {
  const { taskId } = req.params;
  const tRes = await pool.query("SELECT id, tenant_id FROM tasks WHERE id = $1", [taskId]);
  if (tRes.rowCount === 0) return error(res, 404, "Task not found");
  const t = tRes.rows[0];
  if (req.user.role !== "super_admin" && req.user.tenantId !== t.tenant_id) return error(res, 403, "Forbidden");
  let { title, description, status, priority, assignedTo, dueDate } = req.body;
  if (assignedTo !== undefined && assignedTo !== null) {
    const uRes = await pool.query("SELECT id FROM users WHERE id = $1 AND tenant_id = $2", [assignedTo, t.tenant_id]);
    if (uRes.rowCount === 0) return error(res, 400, "assignedTo user doesn't belong to same tenant");
  }
  if (assignedTo === null) assignedTo = null;
  const updates = []; const vals = []; let i = 1;
  if (title !== undefined) { updates.push(`title = $${i++}`); vals.push(title); }
  if (description !== undefined) { updates.push(`description = $${i++}`); vals.push(description); }
  if (status !== undefined) { updates.push(`status = $${i++}`); vals.push(status); }
  if (priority !== undefined) { updates.push(`priority = $${i++}`); vals.push(priority); }
  if (assignedTo !== undefined) { updates.push(`assigned_to = $${i++}`); vals.push(assignedTo); }
  if (dueDate !== undefined) { updates.push(`due_date = $${i++}`); vals.push(dueDate); }
  updates.push("updated_at = NOW()");
  const sql = `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${i} RETURNING id, title, description, status, priority, assigned_to, due_date, updated_at`;
  vals.push(taskId);
  const up = await pool.query(sql, vals);
  const row = up.rows[0];
  let assigned = null;
  if (row.assigned_to) {
    const u = await pool.query("SELECT id, full_name, email FROM users WHERE id = $1", [row.assigned_to]);
    assigned = u.rows[0] || null;
  }
  try { await logAction({ tenantId: t.tenant_id, userId: req.user.id, action: "UPDATE_TASK", entityType: "task", entityId: taskId, ip: req.ip }); } catch {}
  return success(res, {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assignedTo: assigned,
    dueDate: row.due_date,
    updatedAt: row.updated_at,
  }, "Task updated successfully");
};
