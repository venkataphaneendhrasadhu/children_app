require("dotenv").config();
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

initializeDatabase().finally(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 FamilyPlate Nutrition API running on http://localhost:${PORT}`);
  });
});
