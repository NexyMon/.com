import axios from 'axios';

// Lese die API-URL aus den Vite-Umgebungsvariablen
// VITE_API_URL wird beim Build-Prozess (npm run build) in den Code eingebettet.
// Für die lokale Entwicklung kann sie in .env.development gesetzt werden.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor, um den Auth-Token zu jedem Request hinzuzufügen, falls vorhanden
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Interceptor für die Response, um z.B. Token Refresh zu handeln
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + access;
          originalRequest.headers['Authorization'] = 'Bearer ' + access;
          return apiClient(originalRequest);
        } else {
          // Wenn kein Refresh-Token vorhanden ist, abmelden oder zu Login weiterleiten
          console.error("No refresh token available.");
          // Hier könnte man den Benutzer z.B. zum Login weiterleiten
          // window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Hier könnte man den Benutzer z.B. zum Login weiterleiten
        // localStorage.removeItem('access_token');
        // localStorage.removeItem('refresh_token');
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
