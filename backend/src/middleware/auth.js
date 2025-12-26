const { verifyToken } = require("../utils/jwt");
const { error } = require("../utils/response");

module.exports = function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return error(res, 401, "Token missing");
  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.id,
      tenantId: payload.tenant_id ?? payload.tenantId ?? null,
      role: payload.role,
    };
    next();
  } catch (e) {
    return error(res, 401, "Token invalid or expired");
  }
}
