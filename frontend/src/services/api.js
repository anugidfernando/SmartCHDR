import axios from 'axios';

// Base URL for Flask API
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────────
export const registerUser = (data) => 
  api.post('/auth/register', data);

export const loginUser = (data) => 
  api.post('/auth/login', data);

// ── Children ──────────────────────────────────────────────
export const addChild = (data) => 
  api.post('/children', data);

export const getChildren = () => 
  api.get('/children');

// ── Growth ────────────────────────────────────────────────
export const predictGrowth = (data) => 
  api.post('/growth/predict', data);

export const getGrowthHistory = (childId) => 
  api.get(`/growth/${childId}`);

// ── Meals ─────────────────────────────────────────────────
export const generateMealPlan = (data) => 
  api.post('/meals/generate', data);

// ── Vaccines ──────────────────────────────────────────────
export const getVaccineSchedule = (childId) => 
  api.get(`/vaccines/${childId}`);

export const markVaccineComplete = (data) => 
  api.put('/vaccines/complete', data);

export default api;