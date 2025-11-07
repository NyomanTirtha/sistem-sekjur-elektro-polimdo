// Theme utility untuk menentukan warna berdasarkan jurusan

/**
 * Mendapatkan nama jurusan dari user data
 */
export const getJurusanName = (user) => {
  if (!user) return null;
  
  // Untuk SEKJUR
  if (user.jurusan?.nama) {
    return user.jurusan.nama;
  }
  
  // Untuk DOSEN/KAPRODI
  if (user.prodi?.jurusan?.nama) {
    return user.prodi.jurusan.nama;
  }
  
  // Untuk MAHASISWA
  if (user.programStudi?.jurusan?.nama) {
    return user.programStudi.jurusan.nama;
  }
  
  return null;
};

/**
 * Tema warna berdasarkan jurusan
 */
export const getTheme = (user) => {
  const jurusanName = getJurusanName(user);
  
  // Teknik Elektro - Biru dongker
  if (jurusanName && jurusanName.toLowerCase().includes('elektro')) {
    return {
      primary: {
        bg: 'bg-blue-900',           // Biru dongker
        hover: 'hover:bg-blue-800',
        text: 'text-blue-900',
        border: 'border-blue-900',
        light: 'bg-blue-800',        // Sedikit lebih terang untuk header
        dark: 'bg-blue-950',         // Lebih gelap untuk accent
      },
      accent: {
        bg: 'bg-blue-800',
        hover: 'hover:bg-blue-700',
        text: 'text-blue-800',
      },
      sidebar: {
        header: 'bg-blue-900',       // Header sidebar biru dongker
        hover: 'hover:bg-blue-800',
        active: 'bg-blue-900 text-white',
      },
    };
  }
  
  // Teknik Sipil - Cokelat dongker
  if (jurusanName && jurusanName.toLowerCase().includes('sipil')) {
    return {
      primary: {
        bg: 'bg-amber-900',          // Cokelat dongker
        hover: 'hover:bg-amber-800',
        text: 'text-amber-900',
        border: 'border-amber-900',
        light: 'bg-amber-800',       // Sedikit lebih terang untuk header
        dark: 'bg-amber-950',        // Lebih gelap untuk accent
      },
      accent: {
        bg: 'bg-amber-800',
        hover: 'hover:bg-amber-700',
        text: 'text-amber-800',
      },
      sidebar: {
        header: 'bg-amber-900',      // Header sidebar cokelat dongker
        hover: 'hover:bg-amber-800',
        active: 'bg-amber-900 text-white',
      },
    };
  }
  
  // Default (jika tidak ada jurusan atau jurusan lain)
  return {
    primary: {
      bg: 'bg-gray-800',
      hover: 'hover:bg-gray-700',
      text: 'text-gray-800',
      border: 'border-gray-800',
      light: 'bg-gray-700',
      dark: 'bg-gray-900',
    },
    accent: {
      bg: 'bg-gray-700',
      hover: 'hover:bg-gray-600',
      text: 'text-gray-700',
    },
    sidebar: {
      header: 'bg-gray-800',
      hover: 'hover:bg-gray-700',
      active: 'bg-gray-800 text-white',
    },
  };
};

/**
 * Mendapatkan class untuk sidebar header berdasarkan tema
 */
export const getSidebarHeaderClass = (user) => {
  const theme = getTheme(user);
  return theme.sidebar.header;
};

/**
 * Mendapatkan class untuk active menu item berdasarkan tema
 */
export const getActiveMenuClass = (user) => {
  const theme = getTheme(user);
  return theme.sidebar.active;
};

/**
 * Mendapatkan class untuk button dengan base style (untuk button dengan layout inline-flex)
 */
export const getButtonPrimaryClass = (user) => {
  const theme = getTheme(user);
  return `${theme.primary.bg} ${theme.primary.hover} text-white`;
};

/**
 * Mendapatkan class untuk button secondary
 */
export const getButtonSecondaryClass = (user) => {
  const theme = getTheme(user);
  return `inline-flex items-center px-4 py-2 ${theme.accent.bg} text-white rounded-lg ${theme.accent.hover}`;
};

