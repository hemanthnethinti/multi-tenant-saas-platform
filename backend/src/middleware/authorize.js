const { error } = require("../utils/response");

module.exports = function authorize(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return error(res, 401, "Unauthorized");
    if (allowed.length === 0 || allowed.includes(role)) return next();
    return error(res, 403, "Forbidden");
  };
}
