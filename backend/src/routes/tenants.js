const router = require("express").Router();
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const c = require("../controllers/tenantsController");

router.get("/:tenantId", auth, c.getTenant);
router.put("/:tenantId", auth, c.updateTenant); // role checks inside
router.get("/", auth, authorize(["super_admin"]), c.listTenants);

module.exports = router;
