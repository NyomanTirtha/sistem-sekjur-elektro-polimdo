// hooks/usePasswordChange.js
import { useState } from 'react';

export const usePasswordChange = (authToken, currentUser) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const changePassword = async (passwordData) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Determine API endpoint based on user type
      let apiEndpoint = 'http://localhost:5000/api/auth/change-password';
      
      // Get user identifier based on role
      let userId;
      const userType = currentUser.role || determineUserType(currentUser);
      
      // Use username as the identifier since that's what we store in the users table
      userId = currentUser.username;

      if (!userId) {
        throw new Error('ID pengguna tidak ditemukan');
      }
      
      // Prepare request body with user identifier
      const requestBody = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        userId: userId,
        userType: userType
      };
      
      // Get token from localStorage if not provided
      const token = authToken || localStorage.getItem('token');

      if (!token) {
        throw new Error('Token autentikasi tidak ditemukan');
      }

      const response = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseData = await response.json();
      console.log('🔍 Server Response:', {
        status: response.status,
        ok: response.ok,
        message: responseData.message || responseData.error,
        data: responseData
      });

      if (response.ok) {
        setSuccess('Password berhasil diubah. Silakan login ulang dengan password baru.');
        
        // Optional: Auto logout after successful password change
        setTimeout(() => {
          // You can trigger logout here if needed
          // window.location.href = '/login';
        }, 2000);

        return { success: true, message: responseData.message };
      } else {
        // Handle specific error messages from server
        const errorMessage = responseData.message || responseData.error || 'Gagal mengubah password';
        
        if (response.status === 400) {
          throw new Error(errorMessage);
        } else if (response.status === 401) {
          throw new Error('Password saat ini tidak sesuai');
        } else if (response.status === 403) {
          throw new Error('Token tidak valid atau kadaluarsa');
        } else if (response.status === 404) {
          throw new Error('User tidak ditemukan');
        } else {
          throw new Error(errorMessage);
        }
      }

    } catch (err) {
      console.error('❌ Password change error:', err);
      const errorMessage = err.message || 'Terjadi kesalahan saat mengubah password';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine user type from user object
  const determineUserType = (user) => {
    if (user.role) return user.role;
    if (user.nim) return 'MAHASISWA';
    if (user.nip && user.isKaprodi) return 'KAPRODI';
    if (user.nip) return 'DOSEN';
    return 'SEKJUR';
  };

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  return {
    changePassword,
    isLoading,
    error,
    success,
    resetMessages
  };
};