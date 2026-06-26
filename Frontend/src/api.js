const API_BASE_URL = import.meta.env.VITE_API_URL || "https://fitzone-t8x4.onrender.com/api";

// Helper to make API requests with credentials and JSON headers
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("fitzone_token");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // If credentials are required, send cookies
  config.credentials = "include";

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};

export const api = {
  // Admin Authentication
  login: async (phone, password) => {
    const data = await request("/admin/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    if (data.token) {
      localStorage.setItem("fitzone_token", data.token);
      localStorage.setItem("fitzone_admin", JSON.stringify(data.admin));
    }
    return data;
  },

  register: async (name, phone, password) => {
    return await request("/admin/register", {
      method: "POST",
      body: JSON.stringify({ name, phone, password }),
    });
  },

  logout: async () => {
    try {
      await request("/admin/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout request failed, cleaning local storage anyway", e);
    }
    localStorage.removeItem("fitzone_token");
    localStorage.removeItem("fitzone_admin");
  },

  // Members Management
  getMembers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.plan) params.append("plan", filters.plan);
    if (filters.status) params.append("status", filters.status);
    const queryStr = params.toString();
    return await request(`/members${queryStr ? `?${queryStr}` : ""}`);
  },

  getMember: async (id) => {
    return await request(`/members/${id}`);
  },

  createMember: async (memberData) => {
    return await request("/members", {
      method: "POST",
      body: JSON.stringify(memberData),
    });
  },

  updateMember: async (id, memberData) => {
    return await request(`/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(memberData),
    });
  },

  deleteMember: async (id) => {
    return await request(`/members/${id}`, {
      method: "DELETE",
    });
  },

  checkExpiry: async () => {
    return await request("/members/check-expiry");
  },

  getCurrentAdmin: () => {
    const admin = localStorage.getItem("fitzone_admin");
    return admin ? JSON.parse(admin) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("fitzone_token");
  },
};
