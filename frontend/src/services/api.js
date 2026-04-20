import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const API = axios.create({
  baseURL: BACKEND_URL,
  timeout: 120000,
});

const API_LONG = axios.create({
  baseURL: BACKEND_URL,
  timeout: 180000,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API_LONG.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
export const googleLogin = (data) => API.post("/auth/google", data);
export const forgotPassword = (data) => API.post("/auth/forgot-password", data);
export const resetPassword = (token, data) => API.post(`/auth/reset-password/${token}`, data);
export const generateQuiz = (formData) => API_LONG.post("/quiz/generate", formData);
export const saveManualQuiz = (data) => API.post("/quiz/manual", data);
export const getMyQuizzes = () => API.get("/quiz");
export const deleteQuiz = (id) => API.delete(`/quiz/${id}`);
export const createSession = (data) => API.post("/session", data);
export const joinSession = (code) => API.get(`/session/${code}`);
export const getTeacherStats = () => API.get("/analytics/teacher");
export const getStudentHistory = () => API.get("/analytics/student");
