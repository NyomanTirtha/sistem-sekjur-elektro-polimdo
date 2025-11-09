// utilitas/tokenStorage.js
// Utility untuk mengelola token dengan lebih aman

/**
 * Token Storage Utility
 *
 * Menyediakan abstraksi untuk menyimpan dan mengambil token
 * dengan beberapa layer keamanan tambahan
 */

const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'userData';
const USER_TYPE_KEY = 'userType';
const TOKEN_TIMESTAMP_KEY = 'token_timestamp';

// Helper untuk encode/decode token (basic obfuscation)
const obfuscate = (str) => {
  try {
    return btoa(encodeURIComponent(str));
  } catch (e) {
    console.error('Error obfuscating token:', e);
    return str;
  }
};

const deobfuscate = (str) => {
  try {
    return decodeURIComponent(atob(str));
  } catch (e) {
    console.error('Error deobfuscating token:', e);
    return str;
  }
};

/**
 * Simpan token ke localStorage dengan obfuscation
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
  if (!token) {
    console.error('Token tidak boleh kosong');
    return;
  }

  try {
    const obfuscatedToken = obfuscate(token);
    localStorage.setItem(TOKEN_KEY, obfuscatedToken);
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());

    // TIDAK menyimpan ke window.authToken untuk security
    // Jika benar-benar diperlukan, gunakan getter function
  } catch (error) {
    console.error('Error menyimpan token:', error);
  }
};

/**
 * Ambil token dari localStorage
 * @returns {string|null} JWT token atau null jika tidak ada
 */
export const getToken = () => {
  try {
    const obfuscatedToken = localStorage.getItem(TOKEN_KEY);
    if (!obfuscatedToken) return null;

    const token = deobfuscate(obfuscatedToken);

    // Check if token is expired (24 hours default)
    if (isTokenExpired()) {
      removeToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error mengambil token:', error);
    return null;
  }
};

/**
 * Hapus token dari localStorage
 */
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(USER_TYPE_KEY);

    // Clean up window.authToken if exists
    if (window.authToken) {
      delete window.authToken;
    }
  } catch (error) {
    console.error('Error menghapus token:', error);
  }
};

/**
 * Check apakah token sudah expired berdasarkan timestamp lokal
 * @returns {boolean} true jika expired
 */
export const isTokenExpired = () => {
  try {
    const timestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
    if (!timestamp) return true;

    const tokenAge = Date.now() - parseInt(timestamp, 10);
    const maxAge = 24 * 60 * 60 * 1000; // 24 jam dalam milliseconds

    return tokenAge > maxAge;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Simpan user data ke localStorage
 * @param {object} userData - Data user
 */
export const setUserData = (userData) => {
  if (!userData) {
    console.error('User data tidak boleh kosong');
    return;
  }

  try {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  } catch (error) {
    console.error('Error menyimpan user data:', error);
  }
};

/**
 * Ambil user data dari localStorage
 * @returns {object|null} User data atau null jika tidak ada
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error mengambil user data:', error);
    return null;
  }
};

/**
 * Simpan user type ke localStorage
 * @param {string} userType - Tipe user
 */
export const setUserType = (userType) => {
  if (!userType) {
    console.error('User type tidak boleh kosong');
    return;
  }

  try {
    localStorage.setItem(USER_TYPE_KEY, userType);
  } catch (error) {
    console.error('Error menyimpan user type:', error);
  }
};

/**
 * Ambil user type dari localStorage
 * @returns {string|null} User type atau null jika tidak ada
 */
export const getUserType = () => {
  try {
    return localStorage.getItem(USER_TYPE_KEY);
  } catch (error) {
    console.error('Error mengambil user type:', error);
    return null;
  }
};

/**
 * Set authentication state (token, userData, userType)
 * @param {string} token - JWT token
 * @param {object} userData - Data user
 * @param {string} userType - Tipe user
 */
export const setAuthState = (token, userData, userType) => {
  setToken(token);
  setUserData(userData);
  setUserType(userType);
};

/**
 * Get authentication state
 * @returns {object} Object berisi token, userData, userType, isAuthenticated
 */
export const getAuthState = () => {
  const token = getToken();
  const userData = getUserData();
  const userType = getUserType();

  return {
    token,
    userData,
    userType,
    isAuthenticated: !!(token && userData && userType),
  };
};

/**
 * Clear semua authentication state
 */
export const clearAuthState = () => {
  removeToken();
};

/**
 * Get Authorization header untuk axios
 * @returns {object|null} Header object atau null jika tidak ada token
 */
export const getAuthHeader = () => {
  const token = getToken();
  if (!token) return null;

  return {
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Check apakah user sudah login
 * @returns {boolean} true jika sudah login
 */
export const isAuthenticated = () => {
  const token = getToken();
  return !!token && !isTokenExpired();
};

/**
 * Refresh token timestamp (untuk extend session)
 * Hanya boleh dipanggil setelah token diverifikasi oleh server
 */
export const refreshTokenTimestamp = () => {
  try {
    localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error refreshing token timestamp:', error);
  }
};

// Export default object dengan semua functions
export default {
  setToken,
  getToken,
  removeToken,
  isTokenExpired,
  setUserData,
  getUserData,
  setUserType,
  getUserType,
  setAuthState,
  getAuthState,
  clearAuthState,
  getAuthHeader,
  isAuthenticated,
  refreshTokenTimestamp,
};
