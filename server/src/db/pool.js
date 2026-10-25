const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

// Render PostgreSQL requires SSL on external connections
const needsSsl =
  connectionString &&
  (connectionString.includes("render.com") ||
    process.env.NODE_ENV === "production" ||
    process.env.DB_SSL === "true");

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : null;

async function query(text, params) {
  if (!pool) {
    const err = new Error(
      "DATABASE_URL is not configured. Add your Render PostgreSQL URL in server/.env"
    );
    err.code = "NO_DB_URL";
    throw err;
  }
  return pool.query(text, params);
}

module.exports = { pool, query };
