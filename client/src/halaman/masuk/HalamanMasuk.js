import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import logoLogin from '../../assets/gambar/xyz-logo.png';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} - Sistem Sekretaris Jurusan` : 'Sistem Sekretaris Jurusan';
    return () => { document.title = 'Sistem Sekretaris Jurusan'; };
  }, [title]);
};

const LoginPage = ({ onLoginSuccess }) => {
  useDocumentTitle('Login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'SEKJUR'
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

    if (loading) return;

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

      if (response.status === 429) {
        const errorData = await response.json().catch(() => ({}));
        const retryAfter = errorData.retryAfter ||
          response.headers.get('Retry-After') ||
          response.headers.get('X-RateLimit-Reset') ||
          null;

        let waitMessage = 'Terlalu banyak percobaan login. Silakan tunggu beberapa saat sebelum mencoba lagi.';

        if (retryAfter && retryAfter > 0) {
          const minutes = Math.ceil(retryAfter / 60);
          const seconds = retryAfter % 60;
          if (minutes > 0) {
            waitMessage = `Terlalu banyak percobaan login. Silakan tunggu ${minutes} menit sebelum mencoba lagi.`;
          } else if (seconds > 0) {
            waitMessage = `Terlalu banyak percobaan login. Silakan tunggu ${seconds} detik sebelum mencoba lagi.`;
          }
        }

        setError(errorData.message || waitMessage);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan pada server' }));
        setError(errorData.message || `Error ${response.status}: ${response.statusText}`);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (result.success) {
        const token = result.data.token;
        const user = result.data.user;
        window.authToken = token;

        const userDataFields = ['jurusanId', 'jurusan', 'nip', 'nim', 'programStudi', 'prodi', 'angkatan', 'semester', 'noTelp', 'alamat'];
        const userData = {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role,
          ...Object.fromEntries(userDataFields.filter(field => user[field] !== undefined).map(field => [field, user[field]])),
          ...(user.isKaprodi !== undefined && { isKaprodi: user.isKaprodi })
        };

        const userType = getRoleMapping(user.role);
        ['token', 'userData', 'userType'].forEach((key, idx) => {
          localStorage.setItem(key, idx === 1 ? JSON.stringify(userData) : (idx === 0 ? token : userType));
        });

        if (onLoginSuccess) {
          onLoginSuccess(userData, userType, { token });
        }
      } else {
        setError(result.message || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.name === 'AbortError') {
        setError('Request timeout. Pastikan server berjalan di localhost:5000');
      } else if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Tidak dapat terhubung ke server. Pastikan server berjalan di localhost:5000');
      } else {
        setError('Terjadi kesalahan saat login. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleMapping = (backendRole) => {
    const mapping = { 'SEKJUR': 'sekjur', 'MAHASISWA': 'mahasiswa', 'DOSEN': 'dosen', 'KAPRODI': 'kaprodi' };
    return mapping[backendRole] || backendRole.toLowerCase();
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-800 px-8 py-8 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-lg mb-4">
                <div className="w-12 h-12 rounded flex items-center justify-center overflow-hidden">
                  <img
                    src={logoLogin}
                    alt="Polimdo Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <h1 className="text-xl font-semibold text-white mb-2">
                POLITEKNIK NEGERI MANADO
              </h1>
              <p className="text-gray-300 text-sm">
                Sistem Sekretaris Jurusan
              </p>
            </div>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'SEKJUR', label: 'Sekretaris Jurusan' },
                    { value: 'DOSEN', label: 'Dosen' },
                    { value: 'KAPRODI', label: 'Ketua Prodi' },
                    { value: 'MAHASISWA', label: 'Mahasiswa' }
                  ].map((roleOption) => (
                    <button
                      key={roleOption.value}
                      type="button"
                      onClick={() => handleRoleChange(roleOption.value)}
                      className={`px-4 py-3 text-sm font-medium rounded-lg transition-colors ${formData.role === roleOption.value
                        ? 'bg-blue-600 text-white border border-blue-600'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                        }`}
                    >
                      {roleOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.role === 'MAHASISWA' ? 'NIM' :
                    formData.role === 'DOSEN' || formData.role === 'KAPRODI' ? 'NIP' :
                      'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      formData.role === 'MAHASISWA' ? 'Masukkan NIM' :
                        formData.role === 'DOSEN' || formData.role === 'KAPRODI' ? 'Masukkan NIP' :
                          'Masukkan username'
                    }
                    disabled={loading}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.role === 'SEKJUR' && 'Gunakan username sekretaris jurusan (contoh: sekjur_elektro)'}
                  {formData.role === 'MAHASISWA' && 'Masukkan NIM Anda'}
                  {(formData.role === 'DOSEN' || formData.role === 'KAPRODI') && 'Masukkan NIP Anda'}
                </p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="block w-full pl-11 pr-14 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
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

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 Politeknik Negeri Manado. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;