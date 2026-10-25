/**
 * In-memory fallback store used automatically when DATABASE_URL is not yet configured
 * or unreachable, ensuring the mobile app works out-of-the-box and switches seamlessly to Render PG.
 */
const memoryStore = {
  users: [],
  otps: [],
  members: [],
  mealLogs: [],
  mealSelections: [],
  groceryChecks: [],
  sugarLogs: [],
  customFoods: [],
};

module.exports = { memoryStore };
