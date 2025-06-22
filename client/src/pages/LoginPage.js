import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, Shield } from 'lucide-react';
import logoLogin from '../assets/images/xyz-logo.png';

const LoginPage = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'ADMIN'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async () => {    
    if (!formData.username || !formData.password) {
      setError('Username dan password harus diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: formData.role
        })
      });

      const result = await response.json();

      if (result.success) {
        const token = result.data.token;
        window.authToken = token;
        
        const userData = {
          id: result.data.user.id,
          username: result.data.user.username,
          nama: result.data.user.nama,
          role: result.data.user.role,
          ...(result.data.user.nip && { nip: result.data.user.nip }),
          ...(result.data.user.nim && { nim: result.data.user.nim }),
          ...(result.data.user.programStudi && { programStudi: result.data.user.programStudi }),
          ...(result.data.user.jurusan && { jurusan: result.data.user.jurusan }),
          ...(result.data.user.isKaprodi !== undefined && { isKaprodi: result.data.user.isKaprodi }),
          ...(result.data.user.angkatan && { angkatan: result.data.user.angkatan }),
          ...(result.data.user.semester && { semester: result.data.user.semester })
        };
        
        const userType = getRoleMapping(result.data.user.role);
        
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userType', userType);
        
        if (onLoginSuccess) {
          onLoginSuccess(userData, userType, { token });
        }
      } else {
        setError(result.message || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Tidak dapat terhubung ke server. Pastikan server berjalan di localhost:5000');
    } finally {
      setLoading(false);
    }
  };

  const getRoleMapping = (backendRole) => {
    const roleMapping = {
      'ADMIN': 'admin',
      'MAHASISWA': 'mahasiswa',
      'DOSEN': 'dosen',
      'KAPRODI': 'kaprodi'
    };
    return roleMapping[backendRole] || backendRole.toLowerCase();
  };

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    if (error) setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-20 w-32 h-32 border border-blue-600 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-yellow-500 rounded-full animate-pulse delay-100"></div>
          <div className="absolute bottom-32 left-40 w-20 h-20 border border-blue-600 rounded-full animate-pulse delay-200"></div>
          <div className="absolute bottom-20 right-20 w-28 h-28 border border-yellow-500 rounded-full animate-pulse delay-300"></div>
        </div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Main Login Container */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full bg-black/5"></div>
            <div className="relative">
              {/* Logo Container */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 transform transition-transform duration-300 hover:scale-110">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src={logoLogin} 
                    alt="Polimdo Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2">
                POLITEKNIK NEGERI MANADO
              </h1>
              <p className="text-blue-100 text-sm font-medium">
                Sistem Informasi Akademik
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg animate-fade-in">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <span className="text-sm text-red-700 font-medium">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <Shield className="w-4 h-4 inline mr-2" />
                  Pilih Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'ADMIN', label: 'Admin', color: 'from-gray-500 to-gray-600', icon: '👨‍💼' },
                    { value: 'DOSEN', label: 'Dosen', color: 'from-blue-500 to-blue-600', icon: '👨‍🏫' },
                    { value: 'KAPRODI', label: 'Kaprodi', color: 'from-yellow-500 to-yellow-600', icon: '👨‍🎓' },
                    { value: 'MAHASISWA', label: 'Mahasiswa', color: 'from-green-500 to-green-600', icon: '👨‍🎓' }
                  ].map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => handleRoleChange(roleOption.value)}
                      className={`relative px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                        formData.role === roleOption.value
                          ? `bg-gradient-to-r ${roleOption.color} text-white shadow-lg transform scale-105`
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="mr-2">{roleOption.icon}</span>
                      {roleOption.label}
                      {formData.role === roleOption.value && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-current"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Masukkan username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-12 pr-14 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Masukkan password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </div>
          </div>

          {/* Footer Section */}
          <div className="px-8 pb-6">
            {/* Footer content removed */}
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500 font-medium">
            © 2025 Politeknik Negeri Manado. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;