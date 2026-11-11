require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { pool } = require("./db/pool");
const { initializeDatabase } = require("./db/init");

const authRoutes = require("./routes/auth");
const memberRoutes = require("./routes/members");
const mealRoutes = require("./routes/meals");
const diabetesRoutes = require("./routes/diabetes");

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  let dbConnected = false;
  if (pool) {
    try {
      await pool.query("SELECT 1");
      dbConnected = true;
    } catch {
      dbConnected = false;
    }
  }
  res.json({
    status: "ok",
    service: "nutrition-children-api",
    database: dbConnected ? "Render PostgreSQL Connected" : "Ready (Fallback Memory Mode until DATABASE_URL set)",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/diabetes", diabetesRoutes);

// Direct Android APK download endpoint so users can install FamilyPlate.apk directly on their phone
app.get("/download/FamilyPlate.apk", (_req, res) => {
  const releaseApk = path.resolve(
    __dirname,
    "../../mobile/android/app/build/outputs/apk/release/app-release.apk"
  );
  const debugApk = path.resolve(
    __dirname,
    "../../mobile/android/app/build/outputs/apk/debug/app-debug.apk"
  );
  const apkPath = fs.existsSync(releaseApk) ? releaseApk : debugApk;
  if (!fs.existsSync(apkPath)) {
    return res.status(404).send("APK is still building, please try again in a moment.");
  }
  res.download(apkPath, "FamilyPlate-Nutrition.apk");
});

initializeDatabase().finally(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 FamilyPlate Nutrition API running on http://localhost:${PORT}`);
  });
});
