// Productionda API URL normalize:
// - VITE_API_URL=https://host         -> https://host/api
// - VITE_API_URL=https://host/api     -> https://host/api
// - env bo'lmasa production fallback  -> https://backend-a5zy.onrender.com/api
const PROD_API_FALLBACK = "https://backend-a5zy.onrender.com";
const RAW_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? PROD_API_FALLBACK : "");
const BASE = RAW_BASE
  ? `${RAW_BASE.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`
  : "/api";

// ─── Token helpers ────────────────────────────────────────────────
export const getToken  = ()    => localStorage.getItem("rm_token");
export const setToken  = (t)   => localStorage.setItem("rm_token", t);
export const clearAuth = ()    => { localStorage.removeItem("rm_token"); localStorage.removeItem("rm_user"); };

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const apiFetch = (url, opts) =>
  fetch(url, opts).catch(() => {
    const err = new Error("SERVER_OFFLINE");
    err.offline = true;
    throw err;
  });

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
  return data;
};

// ─── AUTH ─────────────────────────────────────────────────────────
export const authAPI = {
  // Telegram botga OTP kod yuborish
  sendCode: (phone) =>
    apiFetch(`${BASE}/auth/send-code`, { method: "POST", headers: headers(), body: JSON.stringify({ phone }) }).then(handle),

  register: (body) =>
    apiFetch(`${BASE}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  login: (body) =>
    apiFetch(`${BASE}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  // Bot yuborgan 1-martalik token bilan avtomatik login
  loginWithTgToken: (token) =>
    apiFetch(`${BASE}/auth/tg-token/${encodeURIComponent(token)}`, { headers: headers() }).then(handle),

  me: () =>
    apiFetch(`${BASE}/auth/me`, { headers: headers() }).then(handle),

  updateMe: (body) =>
    apiFetch(`${BASE}/auth/me`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────
export const productsAPI = {
  // Barcha mahsulotlar (o'zinikidan tashqari)
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return apiFetch(`${BASE}/products${qs ? "?" + qs : ""}`, { headers: headers() }).then(handle);
  },

  // Faqat o'z mahsulotlari
  getMy: () =>
    apiFetch(`${BASE}/products/my`, { headers: headers() }).then(handle),

  create: (body) =>
    apiFetch(`${BASE}/products`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  update: (id, body) =>
    apiFetch(`${BASE}/products/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),

  remove: (id) =>
    apiFetch(`${BASE}/products/${id}`, { method: "DELETE", headers: headers() }).then(handle),
};

// ─── OFFERS ───────────────────────────────────────────────────────
export const offersAPI = {
  send: (productId, message = "") =>
    apiFetch(`${BASE}/offers`, { method: "POST", headers: headers(), body: JSON.stringify({ productId, message }) }).then(handle),

  getReceived: () =>
    apiFetch(`${BASE}/offers`, { headers: headers() }).then(handle),

  getSent: () =>
    apiFetch(`${BASE}/offers/sent`, { headers: headers() }).then(handle),

  markPaid: (id) =>
    apiFetch(`${BASE}/offers/${id}/paid`, { method: "PUT", headers: headers() }).then(handle),
};

// ─── PAYMENTS (PostgreSQL) ─────────────────────────────────────────
export const paymentsAPI = {
  // To'lov yuborish (buyer)
  send: (body) =>
    apiFetch(`${BASE}/payments`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  // To'lovni tasdiqlash (seller)
  confirm: (offerId) =>
    apiFetch(`${BASE}/payments/${offerId}/confirm`, { method: "PUT", headers: headers() }).then(handle),

  // To'lovlar tarixi
  my: () =>
    apiFetch(`${BASE}/payments/my`, { headers: headers() }).then(handle),

  // Operator karta ma'lumotlari
  info: () =>
    apiFetch(`${BASE}/payments/info`, { headers: headers() }).then(handle),
};
