import axios from 'axios';

const API_URL = import.meta.env.BACKEND_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});



export default api;
