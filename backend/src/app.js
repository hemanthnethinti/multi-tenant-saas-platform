const express = require("express");
const cors = require("cors");
const { runMigrations, runSeeds, checkDb } = require("./db");

const authRoutes = require("./routes/auth");
const tenantRoutes = require("./routes/tenants");
const userRoutes = require("./routes/users");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");

const app = express();
app.use(express.json());
// Allow requests from frontend URL (both localhost for dev and docker service name)
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://frontend:3000",
        "http://127.0.0.1:3000"
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
// Mount task routes at /api to support both /api/tasks/* and /api/projects/:projectId/tasks
app.use("/api", taskRoutes);


let isReady = false;
app.get("/api/health", async (req, res) => {
  try {
    const dbOk = await checkDb();
    if (dbOk && isReady) {
      return res.status(200).json({ status: "ok", database: "connected" });
    }
    return res
      .status(503)
      .json({ status: "error", database: dbOk ? "connected" : "disconnected" });
  } catch {
    return res
      .status(503)
      .json({ status: "error", database: "disconnected" });
  }
});

async function start() {
  try {
    console.log("▶ Running migrations...");
    await runMigrations();

    console.log("▶ Running seeds (only if empty)...");
    await runSeeds();

    isReady = true;
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log(`🚀 Backend running on port ${port}`));
  } catch (err) {
    console.error("Backend startup failed:", err);
    process.exit(1);
  }
}

start();
