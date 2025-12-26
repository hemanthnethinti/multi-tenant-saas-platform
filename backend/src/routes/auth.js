const router = require("express").Router();
const controller = require("../controllers/authController");
const auth = require("../middleware/auth");

router.post("/register-tenant", controller.registerTenant);
router.post("/login", controller.login);
router.get("/me", auth, controller.me);
router.post("/logout", auth, controller.logout);

module.exports = router;
