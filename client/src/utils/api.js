// utils/api.js
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('authToken') : null;
  const token = storedToken || window.authToken;
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: getAuthHeaders(),
      ...options
    });

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      // Token expired or invalid
      try { sessionStorage.removeItem('authToken'); } catch (_) { }
      window.authToken = null;
      window.location.reload(); // Force re-login
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Authentication API calls
export const authAPI = {
  login: (credentials) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getCurrentUser: () =>
    apiCall('/auth/me'),

  register: (userData) =>
    apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
};

// Mahasiswa API calls
export const mahasiswaAPI = {
  getAll: () => apiCall('/mahasiswa'),

  getById: (id) => apiCall(`/mahasiswa/${id}`),

  create: (data) =>
    apiCall('/mahasiswa', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiCall(`/mahasiswa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    apiCall(`/mahasiswa/${id}`, {
      method: 'DELETE'
    })
};

// Dosen API calls
export const dosenAPI = {
  getAll: () => apiCall('/dosen'),

  getById: (id) => apiCall(`/dosen/${id}`),

  create: (data) =>
    apiCall('/dosen', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiCall(`/dosen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    apiCall(`/dosen/${id}`, {
      method: 'DELETE'
    })
};

// Pengajuan SA API calls
export const pengajuanSAAPI = {
  getAll: () => apiCall('/pengajuan-sa'),

  getById: (id) => apiCall(`/pengajuan-sa/${id}`),

  create: (data) =>
    apiCall('/pengajuan-sa', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiCall(`/pengajuan-sa/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    apiCall(`/pengajuan-sa/${id}`, {
      method: 'DELETE'
    }),

  // Specific to pengajuan SA
  updateStatus: (id, status, keterangan) =>
    apiCall(`/pengajuan-sa/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, keterangan })
    })
};

// Program Studi API calls
export const prodiAPI = {
  getAll: () => apiCall('/prodi'),

  getById: (id) => apiCall(`/prodi/${id}`),

  create: (data) =>
    apiCall('/prodi', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  update: (id, data) =>
    apiCall(`/prodi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  delete: (id) =>
    apiCall(`/prodi/${id}`, {
      method: 'DELETE'
    })
};

// Stats API calls (jika ada)
export const statsAPI = {
  getAll: () => apiCall('/stats'),
  getDetailed: () => apiCall('/stats/detailed'),
  getByRole: () => apiCall('/stats/by-role')
};

// Jurusan API calls (melalui auth routes dengan filtering akses)
export const jurusanAPI = {
  getAll: () => apiCall('/auth/jurusan')
};

// Error handling helper
export const handleAPIError = (error) => {
  if (error.message.includes('Failed to fetch')) {
    return 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
  }

  if (error.message.includes('401') || error.message.includes('403')) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }

  return error.message || 'Terjadi kesalahan tidak terduga.';
};

// Default export for backward compatibility
export default {
  authAPI,
  mahasiswaAPI,
  dosenAPI,
  pengajuanSAAPI,
  jurusanAPI,
  prodiAPI,
  statsAPI,
  handleAPIError
};