import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, X, LogOut, Menu, ChevronDown, UserCircle, KeyRound, Shield, IdCard, Building, Building2, Calendar, GraduationCap, Phone, MapPin, Users } from 'lucide-react';
import { usePasswordChange } from '../../kait/usePasswordChange';

const roleInfo = {
  SEKJUR: { label: 'Sekretaris Jurusan', getSubtitle: (u) => u.jurusan?.nama ? `Jurusan ${u.jurusan.nama}` : 'Sekretaris Jurusan' },
  KAPRODI: { label: 'Ketua Program Studi', getSubtitle: (u) => u.prodi?.nama || u.programStudi?.nama || 'Ketua Program Studi' },
  DOSEN: { label: 'Dosen', getSubtitle: (u) => u.prodi?.nama || u.programStudi?.nama || 'Dosen' },
  MAHASISWA: { label: 'Mahasiswa', getSubtitle: (u) => u.programStudi?.nama || u.prodi?.nama || 'Mahasiswa' }
};

const profileFieldsConfig = {
  SEKJUR: [
    { key: 'username', label: 'Username', icon: IdCard, color: 'blue' },
    { key: 'jurusan', label: 'Jurusan', icon: Building2, color: 'purple', path: 'jurusan.nama' },
    { key: 'access', label: 'Akses Data', icon: Shield, color: 'green', custom: (u) => u.jurusan?.nama ? `Data Jurusan ${u.jurusan.nama}` : 'Terbatas' }
  ],
  MAHASISWA: [
    { key: 'nim', label: 'NIM', icon: IdCard, color: 'blue' },
    { key: 'programStudi', label: 'Program Studi', icon: Building, color: 'purple', path: 'programStudi.nama' },
    { key: 'jurusan', label: 'Jurusan', icon: Building2, color: 'indigo', path: 'programStudi.jurusan.nama' },
    { key: 'angkatan', label: 'Angkatan', icon: Calendar, color: 'orange' },
    { key: 'semester', label: 'Semester', icon: GraduationCap, color: 'cyan' },
    { key: 'noTelp', label: 'No. Telepon', icon: Phone, color: 'teal' },
    { key: 'alamat', label: 'Alamat', icon: MapPin, color: 'pink' }
  ],
  DOSEN: [
    { key: 'nip', label: 'NIP', icon: IdCard, color: 'blue' },
    { key: 'prodi', label: 'Program Studi', icon: Building, color: 'purple', path: 'prodi.nama' },
    { key: 'jurusan', label: 'Jurusan', icon: Building2, color: 'indigo', path: 'prodi.jurusan.nama' },
    { key: 'noTelp', label: 'No. Telepon', icon: Phone, color: 'teal' },
    { key: 'alamat', label: 'Alamat', icon: MapPin, color: 'pink' }
  ],
  KAPRODI: [
    { key: 'nip', label: 'NIP', icon: IdCard, color: 'blue' },
    { key: 'prodi', label: 'Program Studi', icon: Building, color: 'purple', path: 'prodi.nama' },
    { key: 'jurusan', label: 'Jurusan', icon: Building2, color: 'indigo', path: 'prodi.jurusan.nama' },
    { key: 'status', label: 'Status', icon: Users, color: 'amber', custom: (u) => u.isKaprodi ? 'Ketua Program Studi' : 'Dosen' },
    { key: 'noTelp', label: 'No. Telepon', icon: Phone, color: 'teal' },
    { key: 'alamat', label: 'Alamat', icon: MapPin, color: 'pink' }
  ]
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const Header = ({ 
  title = "Dashboard", 
  user = "Sekretaris Jurusan", 
  role = "SEKJUR",
  onToggleSidebar,
  sidebarCollapsed = false,
  onLogout = () => {},
  currentUser = {},
  authToken
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const toggleButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  const { changePassword, isLoading, success, resetMessages } = usePasswordChange(authToken, currentUser);

  const normalizedRole = (currentUser.role || role).toUpperCase();
  const roleConfig = roleInfo[normalizedRole] || roleInfo.SEKJUR;
  const displayName = currentUser.nama || currentUser.name || user;
  const roleLabel = roleConfig.label;
  const subtitle = roleConfig.getSubtitle(currentUser);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!(toggleButtonRef.current?.contains(event.target)) && !(dropdownRef.current?.contains(event.target))) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Semua field harus diisi');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('Password baru tidak boleh sama dengan password lama');
      return;
    }

    const result = await changePassword(passwordData);
    if (result.success) {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setShowSystemSettings(false), 2000);
    }
  };

  const renderProfileFields = () => {
    const fields = profileFieldsConfig[normalizedRole] || [];
    const colorMap = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', text: 'text-blue-900', value: 'text-blue-700' },
      purple: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-purple-600', text: 'text-purple-900', value: 'text-purple-700' },
      indigo: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-indigo-600', text: 'text-indigo-900', value: 'text-indigo-700' },
      orange: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-orange-600', text: 'text-orange-900', value: 'text-orange-700' },
      cyan: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-cyan-600', text: 'text-cyan-900', value: 'text-cyan-700' },
      teal: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-teal-600', text: 'text-teal-900', value: 'text-teal-700' },
      pink: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-pink-600', text: 'text-pink-900', value: 'text-pink-700' },
      green: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-green-600', text: 'text-green-900', value: 'text-green-700' },
      amber: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-amber-600', text: 'text-amber-900', value: 'text-amber-700' }
    };

    return fields.map((field) => {
      const Icon = field.icon;
      const colors = colorMap[field.color] || colorMap.blue;
      let value = field.custom ? field.custom(currentUser) : (field.path ? getNestedValue(currentUser, field.path) : currentUser[field.key]);
      value = value || 'Tidak tersedia';

      return (
        <div key={field.key} className={`flex items-center space-x-3 p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
          <div>
            <span className={`text-sm font-medium ${colors.text}`}>{field.label}</span>
            <p className={`text-sm ${colors.value}`}>{value}</p>
          </div>
        </div>
      );
    });
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 bg-white border-b border-gray-200">
      <div className={`h-16 flex items-center justify-between ${sidebarCollapsed ? 'pl-20' : 'pl-72'}`}>
        <div className="flex items-center space-x-4">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700" aria-label="Toggle sidebar">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            <p className="text-sm text-gray-600">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative mr-7">
            <button ref={toggleButtonRef} onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded">
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <span className="text-sm font-semibold text-gray-900 block">{displayName}</span>
                <span className="text-xs text-gray-500">{roleLabel}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div ref={dropdownRef} className="absolute right-0 mt-2 w-64 bg-white rounded shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="p-2">
                  <button onClick={() => { setShowUserMenu(false); setShowProfile(true); }} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    <UserCircle className="w-5 h-5 text-gray-600" />
                    <span>Profil Saya</span>
                  </button>
                  <button onClick={() => { setShowUserMenu(false); setShowSystemSettings(true); }} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded">
                    <KeyRound className="w-5 h-5 text-gray-600" />
                    <span>Pengaturan Password</span>
                  </button>
                  <div className="my-2 border-t border-gray-200"></div>
                  <button onClick={() => { setShowUserMenu(false); onLogout(); }} className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                    <LogOut className="w-5 h-5 text-red-600" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {typeof window !== 'undefined' && createPortal(
        showProfile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowProfile(false)}>
            <div className="bg-white rounded shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 bg-gray-800 text-white border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{displayName}</h2>
                      <p className="text-sm text-gray-300">{roleLabel}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-gray-700 rounded text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <UserCircle className="w-5 h-5 mr-2 text-gray-600" />
                        Informasi Pribadi
                      </h3>
                      <div className="space-y-3">{renderProfileFields()}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center">
                        <Shield className="w-5 h-5 mr-2 text-gray-600" />
                        Informasi Sistem
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-700">Status Akun</span>
                          <span className="text-sm font-semibold text-green-600">Aktif</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                          <span className="text-sm text-gray-700">Role Sistem</span>
                          <span className="text-sm font-semibold text-gray-800">{roleLabel}</span>
                        </div>
                        {currentUser.role === 'SEKJUR' && (
                          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                            <span className="text-sm text-gray-700">Level Akses</span>
                            <span className="text-sm font-semibold text-gray-800">
                              {currentUser.jurusan?.nama ? `Jurusan ${currentUser.jurusan.nama}` : 'Terbatas'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button onClick={() => setShowProfile(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}

      {typeof window !== 'undefined' && createPortal(
        showSystemSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => { setShowSystemSettings(false); resetMessages(); }}>
            <div className="bg-white rounded shadow-lg w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 bg-gray-800 text-white border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold">Pengaturan Password</h2>
                <button onClick={() => { setShowSystemSettings(false); resetMessages(); }} className="p-1 hover:bg-gray-700 rounded text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">{error}</div>}
                  {success && <div className="bg-green-50 text-green-600 p-3 rounded text-sm border border-green-200">{success}</div>}
                  {['currentPassword', 'newPassword', 'confirmPassword'].map((name, idx) => (
                    <div key={name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {name === 'currentPassword' ? 'Password Saat Ini' : name === 'newPassword' ? 'Password Baru' : 'Konfirmasi Password Baru'}
                      </label>
                      <input
                        type="password"
                        name={name}
                        value={passwordData[name]}
                        onChange={(e) => {
                          setPasswordData(prev => ({ ...prev, [name]: e.target.value }));
                          resetMessages();
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  ))}
                </form>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button onClick={() => { setShowSystemSettings(false); resetMessages(); }} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300">
                  Batal
                </button>
                <button onClick={handlePasswordChange} disabled={isLoading} className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </header>
  );
};

export default Header;
