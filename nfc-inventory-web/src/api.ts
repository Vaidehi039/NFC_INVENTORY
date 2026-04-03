import axios from "axios";

// ===== BASE API URL (Ngrok Compatible) =====
const API_URL = window.location.origin + "/api";

// ===== AXIOS INSTANCE =====
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// ===== REQUEST INTERCEPTOR: Attach Bearer Token =====
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ===== RESPONSE INTERCEPTOR: Handle Expired Tokens (401) =====
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized access - clearing session");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login page if on browser
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// =========================
// AUTH APIs
// =========================

export const login = async (email: string, password: string) => {
  const response = await api.post("auth/login", { email, password });
  const data = response.data;
  
  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userEmail", data.user.email);
  }
  
  return data;
};

export const updateUserStatus = async (email: string, status: string) => {
  const response = await api.post("user/status", { email, status });
  return response.data;
};

export const logout = async () => {
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail) {
    try {
      await updateUserStatus(userEmail, "offline");
    } catch (err) {
      console.error("Failed to set offline status on logout");
    }
  }
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
};

export const register = async (name: string, email: string, password: string, role?: string) => {
  const response = await api.post("auth/register", { name, email, password, role });
  return response.data;
};

export const googleLogin = async (token: string) => {
  const response = await api.post("auth/google", { token });
  const data = response.data;

  if (data.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("userName", data.user.name);
    localStorage.setItem("userEmail", data.user.email);
  }

  return data;
};

export const getProfile = async () => {
  const response = await api.get("auth/profile");
  return response.data;
};

export const updateProfile = async (profileData: any) => {
  const response = await api.put("auth/profile", profileData);
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("auth/forgot-password", { email });
  return response.data;
};

// =========================
// DASHBOARD
// =========================

export const getDashboardStats = async () => {
  const response = await api.get("dashboard/stats");
  return response.data;
};

// =========================
// PRODUCTS
// =========================

export const getProducts = async () => {
  const response = await api.get("products");
  return response.data;
};

export const addProduct = async (productData: any) => {
  const response = await api.post("products", productData);
  return response.data;
};

export const updateProduct = async (productId: number, productData: any) => {
  const response = await api.put(`products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId: number) => {
  const response = await api.delete(`products/${productId}`);
  return response.data;
};

// =========================
// PRODUCT BY SKU
// =========================

export const getProductByTagId = async (tagId: string) => {
  const response = await api.get(`product/${tagId}`);
  return response.data;
};

export const stockUpdate = async (productId: number, action: string, quantity: number = 1) => {
  const response = await api.post("stock/update", { productId, action, quantity });
  return response.data;
};

// =========================
// TAG LINK
// =========================

export const linkTag = async (productId: number, tagId: string) => {
  const response = await api.post("link-tag", {
    product_id: productId,
    tag_id: tagId,
  });
  return response.data;
};

// =========================
// USERS
// =========================

export const getUsers = async () => {
  const response = await api.get("users");
  return response.data;
};

export const updateUser = async (userId: number, userData: any) => {
  const response = await api.put(`users/${userId}`, userData);
  return response.data;
};

export const deleteUser = async (userId: number) => {
  const response = await api.delete(`users/${userId}`);
  return response.data;
};

// =========================
// LOGS
// =========================

export const getLogs = async () => {
  const response = await api.get("logs");
  return response.data;
};

// =========================
// PRODUCT TRANSACTION
// =========================

export const productTransaction = async (
  productId: number,
  action: "IN" | "OUT",
  quantity: number
) => {
  const response = await api.post(`products/${productId}/transaction`, { action, quantity });
  return response.data;
};

// =========================
// NFC SCAN
// =========================

export const nfcScanAction = async (
  tag_id: string,
  action: string,
  quantity: number
) => {
  const response = await api.post("scan-action", { tag_id, action, quantity });
  return response.data;
};

export const storeNfcScan = async (
  serial_number: string,
  tag_data?: string,
  reader_type?: string
) => {
  const response = await api.post("nfc-scan", { serial_number, tag_data, reader_type });
  return response.data;
};

export const getNfcScans = async () => {
  const response = await api.get("nfc-scans");
  return response.data;
};

export default api;


