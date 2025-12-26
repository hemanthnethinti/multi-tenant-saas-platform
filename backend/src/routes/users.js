const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/usersController");

router.post("/tenants/:tenantId/users", auth, c.addUserToTenant);
router.get("/tenants/:tenantId/users", auth, c.listTenantUsers);
router.put("/:userId", auth, c.updateUser);
router.delete("/:userId", auth, c.deleteUser);

module.exports = router;
