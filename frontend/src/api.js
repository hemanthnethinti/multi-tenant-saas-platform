const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const getToken = () => localStorage.getItem("token");
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");

async function request(path, { method = "GET", body, headers = {}, auth = true } = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  if (auth && getToken()) h["Authorization"] = `Bearer ${getToken()}`;
  console.log(`[API] Fetching: ${BASE}${path}`);
  try {
    const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    console.log(`[API] Response status: ${res.status}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  } catch (err) {
    console.error(`[API] Error:`, err);
    // Handle network errors or fetch failures
    if (err.message.includes('fetch') || err instanceof TypeError) {
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }
    throw err;
  }
}

export const login = (email, password, tenantSubdomain) => request(`/auth/login`, { method: "POST", body: { email, password, tenantSubdomain }, auth: false });
export const registerTenant = (payload) => request(`/auth/register-tenant`, { method: "POST", body: payload, auth: false });
export const me = () => request(`/auth/me`);
export const listProjects = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request(`/projects${q ? `?${q}` : ""}`);
};
