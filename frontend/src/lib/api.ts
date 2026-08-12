import axios from 'axios';

const resolvedBaseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

// 🔍 DEBUG: Log what baseURL is actually being used
console.log('[API] NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
console.log('[API] Resolved baseURL:', resolvedBaseURL);

const api = axios.create({
  baseURL: resolvedBaseURL,
});

// Request interceptor for adding the auth token + debug logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 🔍 DEBUG: Log every outgoing request
    console.log(`[API] ➡️  ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request setup error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔍 DEBUG: Log every failed response
    console.error('[API] ❌ Error:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: `${error.config?.baseURL}${error.config?.url}`,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;

