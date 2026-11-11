import { Platform, NativeModules } from "react-native";

// Automatically selects the right host for:
// 1. Real Android phone over Wi-Fi LAN (192.168.0.38:4001)
// 2. Real Android phone via USB adb-reverse (127.0.0.1:4001)
// 3. Local web / simulator / emulator
function resolveDefaultHost() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname === "localhost" ? "127.0.0.1" : window.location.hostname;
    return `http://${host}:4001`;
  }

  return Platform.OS === "android" ? "http://192.168.0.38:4001" : "http://127.0.0.1:4001";
}

const DEFAULT_HOST = resolveDefaultHost();
const USB_FALLBACK_URL = "http://127.0.0.1:4001/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || `${DEFAULT_HOST}/api`;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    // Fallback to USB adb-reverse localhost if on a different Wi-Fi
    response = await fetch(`${USB_FALLBACK_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.error || `Request failed (${response.status})`);
    err.fields = data.fields || {};
    err.status = response.status;
    throw err;
  }
  return data;
}

export const api = {
  requestEmailOtp: (email, fullName) =>
    request("/auth/request-otp", {
      method: "POST",
      body: { email, fullName },
    }),

  verifyEmailOtp: (email, otp, fullName) =>
    request("/auth/verify-otp", {
      method: "POST",
      body: { email, otp, fullName },
    }),

  getMembers: (token) => request("/members", { token }),

  previewTargets: (payload) =>
    request("/members/preview-targets", {
      method: "POST",
      body: payload,
    }),

  createMember: (token, payload) =>
    request("/members", {
      method: "POST",
      token,
      body: payload,
    }),

  updateMember: (token, id, payload) =>
    request(`/members/${id}`, {
      method: "PUT",
      token,
      body: payload,
    }),

  deleteMember: (token, id) =>
    request(`/members/${id}`, {
      method: "DELETE",
      token,
    }),

  getDailyPlan: (token, memberId, dayOffset = 0) =>
    request(`/meals/daily-plan/${memberId}?dayOffset=${dayOffset}`, { token }),

  getWeeklyPlan: (token, memberId) =>
    request(`/meals/weekly-plan/${memberId}`, { token }),

  toggleMealLog: (token, payload) =>
    request("/meals/log", {
      method: "POST",
      token,
      body: payload,
    }),

  saveMealSelection: (token, payload) =>
    request("/meals/select", {
      method: "POST",
      token,
      body: payload,
    }),

  saveGroceryCheck: (token, payload) =>
    request("/meals/grocery-check", {
      method: "POST",
      token,
      body: payload,
    }),

  getDiabetesGuide: () => request("/diabetes/guide"),

  getSugarLogs: (token, memberId) =>
    request(`/diabetes/sugar-logs/${memberId}`, { token }),

  addSugarLog: (token, payload) =>
    request("/diabetes/sugar-logs", {
      method: "POST",
      token,
      body: payload,
    }),

  getCatalog: (token, slot = "", diet = "") =>
    request(`/meals/catalog?slot=${encodeURIComponent(slot)}&diet=${encodeURIComponent(diet)}`, {
      token,
    }),

  createCustomDish: (token, payload) =>
    request("/meals/catalog", {
      method: "POST",
      token,
      body: payload,
    }),

  updateCustomDish: (token, slug, payload) =>
    request(`/meals/catalog/${encodeURIComponent(slug)}`, {
      method: "PUT",
      token,
      body: payload,
    }),
};
