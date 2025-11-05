# Rencana Refactoring Struktur Folder Client

## Struktur Baru (Nama Indonesia)

```
client/src/
├── aset/                          # assets (gambar, logo, dll)
│   └── gambar/
│       ├── xyz-logo.png
│       └── xyz-logoo.png
│
├── komponen/                      # components
│   ├── layout/                   # Layout components
│   │   ├── Header.js
│   │   ├── MainLayouts.js
│   │   └── Sidebar.js
│   │
│   ├── fitur/                    # Feature modules
│   │   ├── program-studi/        # Program Studi
│   │   │   └── DaftarProgramStudi.js
│   │   │
│   │   ├── dosen/                # Dosen
│   │   │   ├── DaftarDosen.js
│   │   │   └── PilihPenugasan.js
│   │   │
│   │   ├── mahasiswa/            # Mahasiswa
│   │   │   └── DaftarMahasiswa.js
│   │   │
│   │   ├── pengajuan-sa/         # Pengajuan SA
│   │   │   ├── DaftarPengajuanSA.js
│   │   │   ├── FormPengajuanSA.js
│   │   │   ├── TabelPengajuanSA.js
│   │   │   ├── ModalDetailAdmin.js
│   │   │   ├── ModalFormDetail.js
│   │   │   ├── ModalMataKuliah.js
│   │   │   ├── FilterStatus.js
│   │   │   ├── StatusBadge.js
│   │   │   ├── InfoCard.js
│   │   │   └── LaporanSA.js
│   │   │
│   │   ├── penugasan-mengajar/   # Penugasan Mengajar
│   │   │   └── KelolaPenugasan.js
│   │   │
│   │   └── pengguna/             # Users/Accounts
│   │       └── DaftarPengguna.js
│   │
│   └── umum/                     # Common/Shared components
│       └── Loading.js
│
├── halaman/                       # pages
│   └── masuk/                    # login
│       └── HalamanMasuk.js
│
├── utilitas/                      # utils
│   ├── notifikasi/               # alerts/notifications
│   │   └── alertUtils.js
│   ├── api/                      # API utilities
│   │   └── api.js
│   └── helper/                   # helper functions
│       ├── pengajuanSAUtils.js
│       └── programStudiUtils.js
│
├── layanan/                       # services
│   └── pengajuanSAService.js
│
├── kait/                          # hooks
│   ├── usePasswordChange.js
│   └── usePengajuanSA.js
│
├── konstanta/                     # constants
│   └── pengajuanSAConstants.js
│
└── gaya/                          # styles
    └── loading.css
```

## Mapping File Lama → Baru

### Assets
- `assets/images/` → `aset/gambar/`

### Components
- `components/layouts/` → `komponen/layout/`
- `components/DosenList.js` → `komponen/fitur/dosen/DaftarDosen.js`
- `components/MahasiswaList.js` → `komponen/fitur/mahasiswa/DaftarMahasiswa.js`
- `components/ProdiList.js` → `komponen/fitur/program-studi/DaftarProgramStudi.js`
- `components/UsersList.js` → `komponen/fitur/pengguna/DaftarPengguna.js`
- `components/PengajuanSAList.js` → `komponen/fitur/pengajuan-sa/DaftarPengajuanSA.js`
- `components/LaporanSA.js` → `komponen/fitur/pengajuan-sa/LaporanSA.js`
- `components/Loading.js` → `komponen/umum/Loading.js`
- `components/dosen/TeachingPicker.js` → `komponen/fitur/dosen/PilihPenugasan.js`
- `components/kaprodi/TeachingAssignmentManager.js` → `komponen/fitur/penugasan-mengajar/KelolaPenugasan.js`
- `components/pengajuan-sa/*` → `komponen/fitur/pengajuan-sa/*`

### Pages
- `pages/LoginPage.js` → `halaman/masuk/HalamanMasuk.js`

### Utils
- `utils/alertUtils.js` → `utilitas/notifikasi/alertUtils.js`
- `utils/api.js` → `utilitas/api/api.js`
- `utils/pengajuanSAUtils.js` → `utilitas/helper/pengajuanSAUtils.js`
- `utils/programStudiUtils.js` → `utilitas/helper/programStudiUtils.js`

### Services
- `services/pengajuanSAService.js` → `layanan/pengajuanSAService.js`

### Hooks
- `hooks/` → `kait/`

### Constants
- `constants/` → `konstanta/`

### Styles
- `styles/` → `gaya/`

