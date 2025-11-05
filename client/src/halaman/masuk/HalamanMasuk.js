import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import logoLogin from '../../aset/gambar/xyz-logo.png';

const useDocumentTitle = (title) => {
  useEffect(() => {
    // ✅ UPDATED: Title sekarang dinamis berdasarkan jurusan
    document.title = title ? `${title} - Sistem Sekretaris Jurusan` : 'Sistem Sekretaris Jurusan';

    // Cleanup function untuk reset title saat component unmount
    return () => {
      document.title = 'Sistem Sekretaris Jurusan';
    };
  }, [title]);
};

const LoginPage = ({ onLoginSuccess }) => {
  useDocumentTitle('Login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'SEKJUR' // ✅ CHANGED: Default role dari ADMIN ke SEKJUR
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

        // ✅ UPDATED: Enhanced userData dengan info jurusan
        const userData = {
          id: result.data.user.id,
          username: result.data.user.username,
          nama: result.data.user.nama,
          role: result.data.user.role,
          // ✅ ADDED: Jurusan info untuk SEKJUR
          ...(result.data.user.jurusanId && { jurusanId: result.data.user.jurusanId }),
          ...(result.data.user.jurusan && { jurusan: result.data.user.jurusan }),
          // Existing fields
          ...(result.data.user.nip && { nip: result.data.user.nip }),
          ...(result.data.user.nim && { nim: result.data.user.nim }),
          ...(result.data.user.programStudi && { programStudi: result.data.user.programStudi }),
          ...(result.data.user.prodi && { prodi: result.data.user.prodi }), // ✅ ADDED: Support prodi field untuk dosen
          ...(result.data.user.isKaprodi !== undefined && { isKaprodi: result.data.user.isKaprodi }),
          ...(result.data.user.angkatan && { angkatan: result.data.user.angkatan }),
          ...(result.data.user.semester && { semester: result.data.user.semester }),
          ...(result.data.user.noTelp && { noTelp: result.data.user.noTelp }),
          ...(result.data.user.alamat && { alamat: result.data.user.alamat })
        };

        const userType = getRoleMapping(result.data.user.role);

        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userType', userType);

        console.log('✅ Login successful:', {
          role: result.data.user.role,
          jurusan: result.data.user.jurusan?.nama,
          userType: userType,
          hasJurusanAccess: !!result.data.user.jurusanId
        });

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
      'SEKJUR': 'sekjur',     // ✅ CHANGED: Admin -> Sekjur
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Main Login Container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gray-800 px-8 py-8 text-center">
            <div>
              {/* Logo Container */}
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

          {/* Form Section */}
          <div className="px-8 py-8">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pilih Role
                </label>
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

              {/* Username Input */}
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

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
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

              {/* Submit Button */}
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

        {/* Copyright */}
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