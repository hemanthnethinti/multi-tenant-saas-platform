const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/projectsController");

router.post("/", auth, c.createProject);
router.get("/", auth, c.listProjects);
router.put("/:projectId", auth, c.updateProject);
router.delete("/:projectId", auth, c.deleteProject);

module.exports = router;
