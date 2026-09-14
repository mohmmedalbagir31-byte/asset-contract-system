import axios from 'axios';

const API = axios.create({
  baseURL: 'https://prolific-transformation-production-0163.up.railway.app/api',
});

// (اختياري) إضافة التوكن تلقائياً لأي طلب يحتاجه مستقبلاً
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;