import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser      = (data) => API.post('/auth/register', data);
export const loginUser         = (data) => API.post('/auth/login', data);
export const googleLogin       = (data) => API.post('/auth/google', data);
export const forgotPassword    = (data) => API.post('/auth/forgot-password', data);
export const resetPassword     = (token, data) => API.post(`/auth/reset-password/${token}`, data);
export const generateQuiz      = (formData) => API.post('/quiz/generate', formData);
export const saveManualQuiz    = (data) => API.post('/quiz/manual', data);
export const getMyQuizzes      = () => API.get('/quiz');
export const createSession     = (data) => API.post('/session', data);
export const joinSession       = (code) => API.get(`/session/${code}`);
export const getTeacherStats   = () => API.get('/analytics/teacher');
export const getStudentHistory = () => API.get('/analytics/student');
