import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* 🔥 VERY IMPORTANT — YOUR REAL PC IP */
const API_URL = "http://192.168.31.124:8000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  if (response.data.token) {
    await AsyncStorage.setItem("token", response.data.token);
    await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
  }

  return response.data;
};

export const register = async (
  name: string,
  email: string,
  password: string
) => {
  const response = await api.post("/api/auth/register", {
    name,
    email,
    password,
  });

  return response.data;
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

export default api;




