import apiClient from './api';

const register = (username, email, password, password2, firstName = '', lastName = '') => {
  return apiClient.post('auth/register/', {
    username,
    email,
    password,
    password2,
    first_name: firstName,
    last_name: lastName,
  });
};

const login = async (username, password) => {
  try {
    const response = await apiClient.post('auth/token/', {
      username,
      password,
    });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      // Setzt den Token auch direkt in den apiClient für nachfolgende Anfragen in dieser Session
      apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + response.data.access;
    }
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete apiClient.defaults.headers.common['Authorization'];
  // Hier könnte man den User zur Login-Seite weiterleiten, falls gewünscht
  // window.location.href = '/login';
};

const getCurrentUser = () => {
  // Diese Funktion ist vereinfacht. Normalerweise würde man hier den Token dekodieren
  // oder einen Endpunkt wie /api/auth/user/ aufrufen, um die User-Daten zu bekommen.
  // Für den Anfang reicht es, zu prüfen, ob ein Token da ist.
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    return null;
  }
  // Hier könnte man den Token dekodieren, um User-Infos zu erhalten, wenn sie im Token gespeichert sind.
  // import { jwtDecode } from 'jwt-decode'; // (müsste installiert werden: npm install jwt-decode)
  // try {
  //   return jwtDecode(accessToken);
  // } catch (e) {
  //   console.error("Error decoding token", e);
  //   return null;
  // }
  return { token: accessToken }; // Placeholder für User-Objekt
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;
