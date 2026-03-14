import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= API URL ================= */

const DEFAULT_API_URL = "https://abcd1234.ngrok-free.app";
let API_URL = DEFAULT_API_URL;

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Bypass-Tunnel-Reminder": "true",
  },
});

// Update baseURL dynamically
export const setBaseURL = async (newUrl: string) => {
  API_URL = newUrl;
  api.defaults.baseURL = newUrl;
  await AsyncStorage.setItem("api_url", newUrl);
};

// Initialize URL from storage
export const initAPI = async () => {
  const savedUrl = await AsyncStorage.getItem("api_url");
  if (savedUrl) {
    API_URL = savedUrl;
    api.defaults.baseURL = savedUrl;
  }
  return API_URL;
};

/* ================= TOKEN INTERCEPTOR ================= */

api.interceptors.request.use(async (config: any) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= AUTH ================= */

export const login = async (email: string, password: string) => {
  // Always use absolute path for login
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  if (response.data.access_token) {
    await AsyncStorage.setItem("token", response.data.access_token);
    await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await api.post("/api/auth/register", data);
  return response.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem("token");
  await AsyncStorage.removeItem("user");
};

/* ================= DASHBOARD ================= */

export const getDashboardStats = async () => {
  const response = await api.get("/api/dashboard/stats");
  return response.data;
};

/* ================= PRODUCTS ================= */

export const getProducts = async () => {
  const response = await api.get("/api/products");
  return response.data;
};

export const createProduct = async (productData: any) => {
  const response = await api.post("/api/products", productData);
  return response.data;
};

export const getProductByTag = async (tagId: string) => {
  const response = await api.get(`/api/product/${tagId}`);
  return response.data;
};

export const updateProduct = async (
  productId: number,
  productData: any
) => {
  const response = await api.put(`/api/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId: number) => {
  const response = await api.delete(`/api/products/${productId}`);
  return response.data;
};

/* ================= NFC / SCAN ================= */

export const productTransaction = async (
  tag_id: string,
  action: string,
  quantity: number
) => {
  const response = await api.post("/api/scan-action", {
    tag_id,
    action,
    quantity,
  });

  return response.data;
};

export const storeNfcScan = async (
  serialNumber: string,
  tagData: string,
  readerType: string = "mobile"
) => {
  const response = await api.post("/api/nfc-scan", {
    serial_number: serialNumber,
    tag_data: tagData,
    reader_type: readerType,
  });

  return response.data;
};

export const quickScan = async (tag_id: string) => {
  const response = await api.post("/api/scan", { tag_id });
  return response.data;
};

export const getNfcScans = async () => {
  const response = await api.get("/api/nfc-scans");
  return response.data;
};

/* ================= FETCH FUNCTIONS (OPTIONAL) ================= */

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.json();
};

export const getProductsFetch = async (token: string) => {
  const response = await fetch(`${API_URL}/api/products`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Bypass-Tunnel-Reminder": "true",
    },
  });

  return response.json();
};

export const scanTag = async (tag_id: string, token: string) => {
  const response = await fetch(`${API_URL}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Bypass-Tunnel-Reminder": "true",
    },
    body: JSON.stringify({
      tag_id,
    }),
  });

  return response.json();
};

export default api;






