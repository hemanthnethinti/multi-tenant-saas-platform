const router = require("express").Router();
const auth = require("../middleware/auth");
const c = require("../controllers/tasksController");

router.post("/projects/:projectId/tasks", auth, c.createTask);
router.get("/projects/:projectId/tasks", auth, c.listProjectTasks);
router.patch("/:taskId/status", auth, c.updateTaskStatus);
router.put("/:taskId", auth, c.updateTask);

module.exports = router;
