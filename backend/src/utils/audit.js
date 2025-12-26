const { pool } = require("../db");

exports.logAction = async ({ tenantId, userId, action, entityType, entityId, ip }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs(id, tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES(gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
      [tenantId || null, userId || null, action, entityType || null, entityId || null, ip || null]
    );
  } catch (e) {
    console.error("Audit log failed:", e.message);
  }
};
