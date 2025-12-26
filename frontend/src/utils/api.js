import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Must match your Backend PORT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Add Token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;