export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Server Components fetch through this instead of API_BASE_URL. On a single-
// VPS Docker deployment, API_BASE_URL is the public IP — a server-side
// fetch() to that address leaves the frontend container, hits the host's
// public interface, and gets port-forwarded back into the backend container.
// Docker's hairpin NAT then makes the backend see the source as the bridge
// gateway IP, not the real visitor — so every page render, for every visitor
// site-wide, was sharing ONE rate-limit bucket keyed on that single gateway
// address. API_INTERNAL_URL (unprefixed, so it never reaches the browser
// bundle) points at the Docker-internal service name instead, which avoids
// the round trip entirely and gives each container its own address. Falls
// back to the public URL for non-Docker / local dev setups that don't set it.
export const SERVER_API_BASE_URL = process.env.API_INTERNAL_URL || API_BASE_URL;

const TOKEN_KEY = "hw_access_token";

export function getStoredToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") query.append(key, item);
      });
      return;
    }
    query.set(key, value);
  });

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function normalizeApiError(error) {
  if (error?.message) return error.message;
  return "Something went wrong. Please try again.";
}

let refreshPromise = null;

async function callRefreshEndpoint() {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("refresh_failed");
  }
  const payload = await response.json();
  const newToken = payload?.data?.accessToken || payload?.accessToken;
  if (!newToken) {
    throw new Error("refresh_failed");
  }
  setStoredToken(newToken);
  return newToken;
}

async function performFetch(endpoint, options, token) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;
  return { response, payload };
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  let { response, payload } = await performFetch(endpoint, options, token);

  // Access token expired -> try ONE silent refresh, then retry the original request.
  if (response.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
    try {
      if (!refreshPromise) {
        refreshPromise = callRefreshEndpoint().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      ({ response, payload } = await performFetch(endpoint, options, newToken));
    } catch {
      setStoredToken("");
      // fall through — the original 401 response/payload will be thrown below
    }
  }

  if (!response.ok) {
    throw {
      message: payload?.message || `Request failed with status ${response.status}`,
      statusCode: response.status,
      errors: payload?.errors || [],
      raw: payload,
    };
  }

  return payload;
}

export async function safeApiRequest(endpoint, options = {}) {
  try {
    return await apiRequest(endpoint, options);
  } catch (error) {
    return {
      success: false,
      data: null,
      message: normalizeApiError(error),
      pagination: null,
      error,
    };
  }
}

export const authApi = {
  register: (body) => apiRequest("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => apiRequest("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  google: (credential) => apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential }) }),
  facebook: (accessToken) => apiRequest("/auth/facebook", { method: "POST", body: JSON.stringify({ accessToken }) }),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  me: () => apiRequest("/auth/me"),
  forgotPassword: (body) => apiRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
  resetPassword: (body) => apiRequest("/auth/reset-password", { method: "POST", body: JSON.stringify(body) }),
};

export const vehicleApi = {
  list: (params) => apiRequest(`/vehicles${buildQuery(params)}`),
  featured: (limit = 8) => apiRequest(`/vehicles/featured?limit=${limit}`),
  detail: (id) => apiRequest(`/vehicles/${id}`),
  similar: (id, limit = 6) => apiRequest(`/vehicles/${id}/similar?limit=${limit}`),
  myAds: (params) => apiRequest(`/vehicles/my-ads${buildQuery(params)}`),
  create: (body) => apiRequest("/vehicles", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/vehicles/${id}`, { method: "DELETE" }),
  markSold: (id, salePrice, buyerContact) => apiRequest(`/vehicles/${id}/sold`, { method: "PATCH", body: JSON.stringify({ salePrice, buyerContact }) }),
  incrementView: (id) => apiRequest(`/vehicles/${id}/view`, { method: "POST" }),
};

export const partApi = {
  list: (params) => apiRequest(`/parts${buildQuery(params)}`),
  featured: (limit = 8) => apiRequest(`/parts/featured?limit=${limit}`),
  detail: (id) => apiRequest(`/parts/${id}`),
  myParts: (params) => apiRequest(`/parts/my-parts${buildQuery(params)}`),
  create: (body) => apiRequest("/parts", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/parts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/parts/${id}`, { method: "DELETE" }),
  // Parts settle exactly like vehicles: the endpoint requires the final sale
  // price so a commission can be recorded, so send the same payload.
  markSold: (id, salePrice, buyerContact) => apiRequest(`/parts/${id}/sold`, { method: "PATCH", body: JSON.stringify({ salePrice, buyerContact }) }),
  incrementView: (id) => apiRequest(`/parts/${id}/view`, { method: "POST" }),
};

export const uploadApi = {
  image: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest("/upload/image", { method: "POST", body: formData });
  },
  images: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    return apiRequest("/upload/images", { method: "POST", body: formData });
  },
  remove: (publicId) => apiRequest("/upload/delete", { method: "DELETE", body: JSON.stringify({ publicId }) }),
};

export const userApi = {
  profile: () => apiRequest("/users/profile"),
  updateProfile: (body) => {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    return apiRequest("/users/profile", { method: "PUT", body: isFormData ? body : JSON.stringify(body) });
  },
  publicProfile: (id) => apiRequest(`/users/${id}/public`),
  saved: () => apiRequest("/users/saved"),
  savedAds: () => apiRequest("/users/saved"),
  saveAd: (vehicleId) => apiRequest(`/users/saved/${vehicleId}`, { method: "POST" }),
  unsaveAd: (vehicleId) => apiRequest(`/users/saved/${vehicleId}`, { method: "DELETE" }),
};

export const metaApi = {
  // Distinct makes/cities from real listings (merged with static seeds client-side).
  filters: () => apiRequest("/meta/filters"),
};

export const assistantApi = {
  chat: (body) => apiRequest("/assistant/chat", { method: "POST", body: JSON.stringify(body) }),
};

export const dealerApi = {
  list: (params) => apiRequest(`/dealers${buildQuery(params)}`),
  detail: (id) => apiRequest(`/dealers/${id}`),
  register: (body) => apiRequest("/dealers/register", { method: "POST", body: JSON.stringify(body) }),
  mine: () => apiRequest("/dealers/me"),
  update: (id, body) => apiRequest(`/dealers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  requestWarranty: (terms) => apiRequest("/dealers/me/warranty", { method: "PATCH", body: JSON.stringify({ terms }) }),
  // Admin
  adminWarrantyList: (status) => apiRequest(`/dealers/admin/warranty${status ? `?status=${status}` : ""}`),
  adminReviewWarranty: (id, approve, note) => apiRequest(`/dealers/admin/${id}/warranty`, { method: "PATCH", body: JSON.stringify({ approve, note: note || "" }) }),
  adminApplications: (status) => apiRequest(`/dealers/admin/applications${status ? `?status=${status}` : ""}`),
  adminReviewApplication: (id, approve, note) => apiRequest(`/dealers/admin/${id}/approval`, { method: "PATCH", body: JSON.stringify({ approve, note: note || "" }) }),
};

export const adApi = {
  // Public
  serve: (placement, limit) => apiRequest(`/ads${buildQuery({ placement, limit })}`),
  impression: (id) => apiRequest(`/ads/${id}/impression`, { method: "POST" }),
  clickUrl: (id) => `${API_BASE_URL}/ads/${id}/click`,
  request: (body) => apiRequest("/ads/request", { method: "POST", body: JSON.stringify(body) }),
  // Admin
  adminList: (status) => apiRequest(`/ads/admin${status ? `?status=${status}` : ""}`),
  adminCreate: (body) => apiRequest("/ads/admin", { method: "POST", body: JSON.stringify(body) }),
  adminUpdate: (id, body) => apiRequest(`/ads/admin/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  adminRemove: (id) => apiRequest(`/ads/admin/${id}`, { method: "DELETE" }),
};

export const businessApi = {
  list: (params) => apiRequest(`/businesses${buildQuery(params)}`),
  detail: (id) => apiRequest(`/businesses/${id}`),
  mine: () => apiRequest("/businesses/me"),
  register: (body) => apiRequest("/businesses/register", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiRequest(`/businesses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  // Admin
  adminApplications: (status) => apiRequest(`/businesses/admin/applications${status ? `?status=${status}` : ""}`),
  adminReview: (id, approve, note) => apiRequest(`/businesses/admin/${id}/approval`, { method: "PATCH", body: JSON.stringify({ approve, note: note || "" }) }),
  adminToggleFeatured: (id, featured) => apiRequest(`/businesses/admin/${id}/featured`, { method: "PATCH", body: JSON.stringify({ featured }) }),
};

export const subscriptionApi = {
  plans: () => apiRequest("/subscriptions/plans"),
  me: () => apiRequest("/subscriptions/me"),
  checkout: (body) => apiRequest("/subscriptions/checkout", { method: "POST", body: JSON.stringify(body) }),
  // Card rail → returns { checkoutUrl, paymentId }; redirect the browser to checkoutUrl.
  checkoutCard: (body) => apiRequest("/subscriptions/checkout/card", { method: "POST", body: JSON.stringify(body) }),
  feature: (vehicleId) => apiRequest(`/subscriptions/feature/${vehicleId}`, { method: "POST" }),
  unfeature: (vehicleId) => apiRequest(`/subscriptions/feature/${vehicleId}`, { method: "DELETE" }),
  // Admin
  adminPayments: (status) => apiRequest(`/subscriptions/admin/payments${status ? `?status=${status}` : ""}`),
  adminVerify: (id, note) => apiRequest(`/subscriptions/admin/payments/${id}/verify`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
  adminReject: (id, note) => apiRequest(`/subscriptions/admin/payments/${id}/reject`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
};

export const commissionApi = {
  mine: () => apiRequest("/commissions/me"),
  pay: (id, body) => apiRequest(`/commissions/${id}/pay`, { method: "POST", body: JSON.stringify(body) }),
  // Admin
  adminList: (status) => apiRequest(`/commissions/admin${status ? `?status=${status}` : ""}`),
  adminMarkPaid: (id, note) => apiRequest(`/commissions/admin/${id}/paid`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
  adminWaive: (id, note) => apiRequest(`/commissions/admin/${id}/waive`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
};

export const saleApi = {
  myPurchases: () => apiRequest("/sales/purchases"),
  confirm: (id) => apiRequest(`/sales/${id}/confirm`, { method: "PATCH" }),
  dispute: (id, note) => apiRequest(`/sales/${id}/dispute`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
};

export const adUpgradeApi = {
  options: () => apiRequest("/ad-upgrades/options"),
  checkout: (body) => apiRequest("/ad-upgrades/checkout", { method: "POST", body: JSON.stringify(body) }),
  // Card rail → returns { checkoutUrl, paymentId }; redirect the browser to checkoutUrl.
  checkoutCard: (body) => apiRequest("/ad-upgrades/checkout/card", { method: "POST", body: JSON.stringify(body) }),
  // Admin
  adminList: (status) => apiRequest(`/ad-upgrades/admin${status ? `?status=${status}` : ""}`),
  adminVerify: (id, note) => apiRequest(`/ad-upgrades/admin/${id}/verify`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
  adminReject: (id, note) => apiRequest(`/ad-upgrades/admin/${id}/reject`, { method: "PATCH", body: JSON.stringify({ note: note || "" }) }),
};

export const paymentApi = {
  // Read a payment's status after returning from the gateway checkout.
  status: (id) => apiRequest(`/payments/${id}/status`),
};

export const serviceRequestApi = {
  create: (body) => apiRequest("/service-requests", { method: "POST", body: JSON.stringify(body) }),
  mine: (type) => apiRequest(`/service-requests/mine${type ? `?type=${type}` : ""}`),
  detail: (id) => apiRequest(`/service-requests/${id}`),
  cancel: (id) => apiRequest(`/service-requests/${id}/cancel`, { method: "PATCH" }),
  // Admin
  adminList: (params) => apiRequest(`/service-requests/admin${buildQuery(params)}`),
  adminUpdateStatus: (id, status, note) =>
    apiRequest(`/service-requests/admin/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note: note || "" }) }),
};

export const inspectorApi = {
  list: (params) => apiRequest(`/inspectors${buildQuery(params)}`),
  detail: (id) => apiRequest(`/inspectors/${id}`),
  mine: () => apiRequest("/inspectors/me"),
  register: (body) => apiRequest("/inspectors/register", { method: "POST", body: JSON.stringify(body) }),
  updateMine: (body) => apiRequest("/inspectors/me", { method: "PUT", body: JSON.stringify(body) }),
  partner: (body) => apiRequest("/inspectors/partner", { method: "POST", body: JSON.stringify(body) }),
  // Admin
  adminList: (status) => apiRequest(`/inspectors/admin${status ? `?status=${status}` : ""}`),
  adminVerify: (id, verified) => apiRequest(`/inspectors/admin/${id}/verify`, { method: "PATCH", body: JSON.stringify({ verified }) }),
  adminToggle: (id, active) => apiRequest(`/inspectors/admin/${id}/active`, { method: "PATCH", body: JSON.stringify({ active }) }),
};

export const chatApi = {
  start: (listingId, listingType = "vehicle") =>
    apiRequest("/chat/conversations", { method: "POST", body: JSON.stringify({ listingId, listingType }) }),
  conversations: () => apiRequest("/chat/conversations"),
  messages: (id) => apiRequest(`/chat/conversations/${id}/messages`),
  send: (id, text) => apiRequest(`/chat/conversations/${id}/messages`, { method: "POST", body: JSON.stringify({ text }) }),
  unread: () => apiRequest("/chat/unread"),
};

export const commentApi = {
  list: (listingId, listingType = "vehicle") => apiRequest(`/comments${buildQuery({ listingId, listingType })}`),
  create: (body) => apiRequest("/comments", { method: "POST", body: JSON.stringify(body) }),
  remove: (id) => apiRequest(`/comments/${id}`, { method: "DELETE" }),
};

export const searchApi = {
  // Unified vehicle+part search for the homepage box — /vehicles and
  // /parts keep their own per-collection ?q= search; this is the one that
  // doesn't assume which side of the marketplace the visitor means.
  run: (q, limit) => apiRequest(`/search${buildQuery({ q, limit })}`),
};

export const reportApi = {
  create: (body) => apiRequest("/reports", { method: "POST", body: JSON.stringify(body) }),
  adminList: (status) => apiRequest(`/reports/admin${status ? `?status=${status}` : ""}`),
  adminSetStatus: (listingId, listingType, status) =>
    apiRequest("/reports/admin/status", { method: "PATCH", body: JSON.stringify({ listingId, listingType, status }) }),
};

export const adminApi = {
  overview: () => apiRequest("/admin/overview"),
  subscribers: (params) => apiRequest(`/admin/subscribers${buildQuery(params)}`),
  users: (params) => apiRequest(`/admin/users${buildQuery(params)}`),
  setRole: (id, role) => apiRequest(`/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  setBan: (id, banned, reason) => apiRequest(`/admin/users/${id}/ban`, { method: "PATCH", body: JSON.stringify({ banned, reason: reason || "" }) }),
};

const api = {
  auth: authApi,
  vehicles: vehicleApi,
  parts: partApi,
  upload: uploadApi,
  users: userApi,
  dealers: dealerApi,
  meta: metaApi,
  subscriptions: subscriptionApi,
  commissions: commissionApi,
  sales: saleApi,
  adUpgrades: adUpgradeApi,
  payments: paymentApi,
  serviceRequests: serviceRequestApi,
  inspectors: inspectorApi,
  chat: chatApi,
  comments: commentApi,
  search: searchApi,
  reports: reportApi,
  admin: adminApi,
};

export default api;
