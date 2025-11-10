# 📚 Dokumentasi Sistem Informasi Semester Antara (SA)

> **Comprehensive Documentation** - Panduan lengkap untuk memahami dan menggunakan Sistem Informasi Semester Antara

---

## 📋 Daftar Isi

1. [Overview](#-overview)
2. [Quick Start](#-quick-start)
3. [Tech Stack](#️-tech-stack)
4. [Struktur Folder](#-struktur-folder)
5. [Fitur Utama](#-fitur-utama)
6. [User Roles](#-user-roles)
7. [Workflow Sistem](#-workflow-sistem)
8. [Panduan Penjadwalan](#-panduan-penjadwalan-otomatis)
9. [Setup & Installation](#-setup--installation)
10. [Database Schema](#-database-schema)
11. [API Documentation](#-api-documentation)
12. [Security](#-security)
13. [Troubleshooting](#-troubleshooting)

---

## 🎯 Overview

**Sistem Informasi Semester Antara (SA)** adalah aplikasi web untuk mengelola proses pengajuan dan penjadwalan Semester Antara di lingkungan akademik Politeknik Negeri Manado.

### Tujuan Sistem:
- ✅ Digitalisasi proses pengajuan SA (paperless)
- ✅ Otomasi penjadwalan perkuliahan
- ✅ Mempercepat approval workflow
- ✅ Transparansi status pengajuan
- ✅ Mengurangi konflik jadwal

### Lingkup Sistem:
1. **Pengajuan SA** - Mahasiswa mengajukan SA dengan upload bukti bayar
2. **Verifikasi Pembayaran** - Sekjur verifikasi bukti pembayaran
3. **Penugasan Dosen** - Kaprodi assign dosen pembimbing
4. **Penjadwalan Otomatis** - Generate jadwal dengan algoritma pintar (1 klik, 10 detik!)
5. **Manajemen Data** - Master data akademik (jurusan, prodi, dosen, mahasiswa, mata kuliah)

---

## ⚡ Quick Start

### 🚀 Setup Cepat (5 Menit)

#### 1. Clone & Install
```bash
# Clone repository
git clone https://github.com/NyomanTirtha/sistem-sekjur-elektro-polimdo.git
cd "Sistem - SA"

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

#### 2. Setup Database
```bash
# Start XAMPP → MySQL
# Create database: sekjur

# Di folder server/
npx prisma migrate dev
npm run seed
```

#### 3. Setup Environment Variables
```bash
# Di folder server/, buat file .env
JWT_SECRET=your-super-secret-key-here
DATABASE_URL="mysql://root@localhost:3306/sekjur"
```

#### 4. Jalankan Aplikasi
```bash
# Terminal 1 - Backend
cd server
npm run dev
# → http://localhost:5000

# Terminal 2 - Frontend
cd client
npm start
# → http://localhost:3000
```

#### 5. Login Test Account
```
Sekjur:    sekjur_informatika / 123456
Kaprodi:   197101011999031004 / 123456
Dosen:     198502022010012001 / 123456
Mahasiswa: 2141720001 / 123456
```

---

## 🛠️ Tech Stack

### Frontend:
- **React.js 18** - UI Framework
- **Tailwind CSS** - Styling utility-first
- **Lucide React** - Icon library
- **Framer Motion** - Animation library
- **Axios** - HTTP client

### Backend:
- **Node.js 18+** - Runtime
- **Express.js** - Web framework
- **Prisma ORM** - Database ORM
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload

### Database:
- **MySQL** - Relational database via XAMPP

### DevOps:
- **Git** - Version control
- **npm** - Package manager
- **Nodemon** - Hot reload development

---

## 📂 Struktur Folder

### Frontend Structure (setelah refactoring)
```
client/src/
├── components/              ✅ React components
│   ├── common/             ✅ Reusable components (Loading, etc)
│   ├── error/              ✅ Error handling components
│   ├── features/           ✅ Feature-specific components
│   │   ├── dosen/          → Dosen management
│   │   ├── jadwal/         → Scheduling system
│   │   ├── mahasiswa/      → Student management
│   │   ├── pengajuan-sa/   → SA submission
│   │   ├── pengguna/       → User management
│   │   ├── penugasan-mengajar/ → Teaching assignment
│   │   └── program-studi/  → Study program management
│   └── layout/             ✅ Layout components (Header, Sidebar, etc)
│
├── pages/                  ✅ Page components
│   └── masuk/              → Login page
│
├── hooks/                  ✅ Custom React hooks
│   ├── usePasswordChange.js
│   └── usePengajuanSA.js
│
├── utils/                  ✅ Utility functions
│   ├── api/                → API configuration
│   ├── helpers/            → Helper functions
│   ├── network/            → Network utilities
│   ├── notifications/      → Alert/notification utils
│   ├── theme.js            → Theme configuration
│   └── tokenStorage.js     → Token management
│
├── services/               ✅ API services
│   └── pengajuanSAService.js
│
├── constants/              ✅ Constants and configs
│   ├── colors.js           → Color constants
│   └── pengajuanSAConstants.js
│
├── assets/                 ✅ Static assets
│   └── gambar/             → Images
│
├── App.js                  ✅ Main app component
├── index.js                ✅ Entry point
└── index.css               ✅ Global styles
```

### Backend Structure
```
server/
├── prisma/
│   ├── schema.prisma       → Database schema
│   ├── seed.js             → Database seeding
│   └── migrations/         → Database migrations
│
├── routes/                 → API routes
│   ├── auth.js             → Authentication endpoints
│   ├── dosen.js            → Dosen endpoints
│   ├── dosenPreferences.js → Dosen preference endpoints
│   ├── jadwal.js           → Schedule endpoints
│   ├── mahasiswa.js        → Student endpoints
│   ├── mataKuliah.js       → Course endpoints
│   ├── pengajuanSA.js      → SA submission endpoints
│   ├── penugasanMengajar.js → Teaching assignment endpoints
│   ├── prodi.js            → Study program endpoints
│   ├── prodiSchedules.js   → Schedule by prodi endpoints
│   └── users.js            → User management endpoints
│
├── services/               → Business logic
│   ├── enhancedScheduleGenerator.js  → 🤖 Schedule generation
│   ├── conflictResolver.js           → 🔧 Conflict resolution
│   └── scheduleScoring.js            → 📊 Schedule scoring
│
├── middleware/             → Express middleware
│   ├── cache.js            → Caching middleware
│   └── security.js         → Security middleware
│
├── utils/                  → Utility functions
│
├── uploads/                → Uploaded files storage
│
├── server.js               → Entry point
└── package.json            → Dependencies
```

### Documentation Structure
```
Sistem - SA/
├── DOKUMENTASI_SISTEM.md      ← 📚 YOU ARE HERE (Complete docs)
├── README.md                  ← 📖 Project overview
└── .gitignore                 ← Git ignore rules
```

---

## 🎯 Fitur Utama

### 1. Pengajuan Semester Antara 📝

**Untuk Mahasiswa:**
- Submit pengajuan SA dengan pilih mata kuliah
- Upload bukti pembayaran (JPG/PNG, max 5MB)
- Track status pengajuan real-time
- Lihat riwayat pengajuan

**Untuk Kaprodi:**
- Review pengajuan mahasiswa
- Assign dosen pembimbing
- Approve/reject pengajuan
- Generate laporan pengajuan

**Untuk Sekjur:**
- Verifikasi bukti pembayaran
- Approve/reject pengajuan final
- Monitoring semua pengajuan
- Generate statistik pengajuan

---

### 2. Penjadwalan Otomatis 🤖

**Fitur Unggulan:**
- ⚡ **Auto Generate** - Klik 1 tombol, jadwal jadi dalam 10 detik
- 🎯 **Smart Scoring** - Algoritma pilih jadwal terbaik dari 5 kandidat
- ⭐ **Dosen Preference** - Dosen set preferensi waktu mengajar
- 🔧 **Auto Conflict Resolution** - Deteksi konflik + kasih solusi otomatis
- 📊 **Grid View** - Visual jadwal dalam bentuk tabel
- 📈 **Schedule Analytics** - Statistik dan analisis jadwal

**Cara Kerja:**
```
Dosen set preferensi (1x) → Kaprodi klik "Generate" → 
Sistem generate 5 kandidat → Pilih terbaik → 
Auto resolve konflik → Submit ke Sekjur → 
Sekjur review & approve → DONE! ✅
```

**Scoring Criteria:**
1. **Day Spread** (Penyebaran hari) - Jadwal tidak menumpuk
2. **Gap Time** (Jarak waktu) - Hindari gap terlalu lama
3. **Preference Match** (Sesuai preferensi) - Bonus jika cocok dengan dosen
4. **Workload Balance** (Beban seimbang) - Distribusi adil
5. **Room Distribution** (Penyebaran ruangan) - Variasi ruangan

---

### 3. Preferensi Dosen ⭐

**Komponen Preferensi:**
- **Hari Favorit** - Pilih hari yang disukai (multi-select)
- **Hari Dihindari** - Pilih hari yang dihindari (multi-select)
- **Waktu Mengajar** - PAGI (08:00-14:00) / SORE (13:00-18:00) / BOTH
- **Priority Level** - MANDATORY / HIGH / NORMAL / LOW

**Priority Explanation:**
- 🔴 **MANDATORY** - WAJIB dipenuhi (sistem error jika tidak bisa)
- 🟠 **HIGH** - Sangat diutamakan, akan diprioritaskan
- 🟢 **NORMAL** - Diusahakan, tapi tidak wajib
- 🔵 **LOW** - Opsional, bonus jika bisa

**Best Practice:**
```javascript
// ✅ GOOD - Fleksibel, jadwal optimal
{
  preferredDays: ['SENIN', 'RABU'],
  avoidDays: ['JUMAT'],
  preferredTime: 'BOTH',
  priority: 'NORMAL'
}

// ❌ BAD - Terlalu strict, susah dijadwalkan
{
  preferredDays: ['SENIN'],
  avoidDays: ['SELASA', 'RABU', 'KAMIS', 'JUMAT'],
  preferredTime: 'PAGI',
  priority: 'MANDATORY'
}
```

---

### 4. Penugasan Mengajar 👨‍🏫

**Flow:**
1. Dosen ajukan mengajar (optional, bisa diassign langsung oleh Kaprodi)
2. Kaprodi review pengajuan
3. Kaprodi approve atau assign manual
4. Status: PENDING → APPROVED → ACTIVE
5. Hanya penugasan **ACTIVE** yang bisa dijadwalkan

**Status Penugasan:**
- 🟡 **PENDING** - Menunggu approval Kaprodi
- 🟢 **APPROVED** - Disetujui, siap dijadwalkan
- 🔵 **ACTIVE** - Sedang berjalan, sudah ada jadwal
- 🔴 **REJECTED** - Ditolak
- ⚫ **INACTIVE** - Tidak aktif

---

### 5. Manajemen Data Master 📊

**CRUD Operations untuk:**
- Jurusan (Sekjur only)
- Program Studi (Sekjur only)
- Dosen (Sekjur only)
- Mahasiswa (Sekjur only)
- Mata Kuliah (Sekjur only)
- Ruangan (Sekjur only)
- Users (Sekjur only)

**Access Control:**
- Sekjur: Full CRUD access
- Kaprodi: Read-only untuk data prodi sendiri
- Dosen: Read-only untuk data terkait
- Mahasiswa: Read-only untuk data sendiri

---

## 👥 User Roles

### 🛡️ Sekretaris Jurusan (SEKJUR)

**Hak Akses:**
- ✅ Full CRUD semua data master
- ✅ Verifikasi bukti pembayaran SA
- ✅ Approve/reject pengajuan SA
- ✅ Review & approve jadwal dari semua prodi
- ✅ Generate laporan dan statistik
- ✅ Manage user accounts

**Menu Utama:**
```
📊 Data Akademik
   → Program Studi
   → Mahasiswa
   → Dosen

📅 Manajemen Jadwal
   → Periode Jadwal
   → Review Jadwal Prodi

🏫 Semester Antara
   → Pengajuan SA

⚙️ Sistem
   → Daftar Akun
```

---

### 👑 Ketua Program Studi (KAPRODI)

**Hak Akses:**
- ✅ Manage pengajuan SA untuk prodi sendiri
- ✅ Assign dosen pembimbing
- ✅ Generate jadwal prodi (Auto!)
- ✅ Review penugasan mengajar
- ✅ Submit jadwal ke Sekjur
- ✅ View data mahasiswa dan dosen prodi

**Menu Utama:**
```
📊 Data Akademik
   → Mahasiswa (read-only)

📅 Manajemen Jadwal
   → Kelola Jadwal Prodi
   → Review Pengajuan Dosen

🏫 Semester Antara
   → Pengajuan SA
```

**Workflow Penjadwalan:**
1. Pastikan ada penugasan mengajar ACTIVE
2. Klik "Generate Jadwal"
3. Isi form (periode, kelas, jenis PAGI/SORE)
4. Review hasil generate (10 detik)
5. Perbaiki konflik jika ada (gunakan Auto Suggestions)
6. Submit ke Sekjur

---

### 👨‍🏫 Dosen

**Hak Akses:**
- ✅ Set preferensi jadwal mengajar
- ✅ Ajukan mengajar (optional)
- ✅ View jadwal mengajar sendiri
- ✅ View mahasiswa bimbingan SA
- ✅ Input nilai SA (coming soon)

**Menu Utama:**
```
📅 Manajemen Jadwal
   → Preferensi Jadwal
   → Jadwal Mengajar Saya
   → Ajukan Mengajar

🏫 Semester Antara
   → Pengajuan SA (view bimbingan)
```

**Tips Preferensi:**
- Set preferensi **SEKALI** di awal semester
- Gunakan priority MANDATORY hanya untuk yang WAJIB
- Semakin fleksibel = jadwal lebih optimal
- Update preferensi jika ada perubahan

---

### 👨‍🎓 Mahasiswa

**Hak Akses:**
- ✅ Submit pengajuan SA
- ✅ Upload bukti pembayaran
- ✅ Pilih mata kuliah (multi-select)
- ✅ Track status pengajuan
- ✅ View riwayat pengajuan

**Menu Utama:**
```
🏫 Semester Antara
   → Pengajuan SA
```

**Workflow Pengajuan:**
1. Klik "Ajukan SA"
2. Pilih mata kuliah (bisa pilih banyak)
3. Upload bukti bayar (JPG/PNG, max 5MB)
4. Submit
5. Tunggu verifikasi (Sekjur → Kaprodi)
6. Status APPROVED → bisa lihat jadwal

---

## 🔄 Workflow Sistem

### 1. Workflow Pengajuan SA

```
[MAHASISWA]
   ↓ Submit pengajuan + upload bukti bayar
   ↓
[SEKJUR]
   ↓ Verifikasi bukti pembayaran
   ↓ Cek nominal = SKS × Rp 300.000
   ↓ Approve/Reject
   ↓
[KAPRODI]
   ↓ Review pengajuan mahasiswa prodi
   ↓ Assign dosen pembimbing
   ↓ Approve/Reject
   ↓
✅ STATUS: APPROVED
   ↓
[MAHASISWA]
   ✅ Bisa lihat jadwal SA
```

**Status Flow:**
```
PENDING → VERIFIED (Sekjur) → APPROVED (Kaprodi) → SELESAI
         ↓
      REJECTED (bisa di any stage)
```

---

### 2. Workflow Penjadwalan Otomatis

```
[SEMESTER BARU]
   ↓
[DOSEN] Set Preferensi (1x di awal)
   ↓ Hari favorit, hindari, waktu, priority
   ↓
[KAPRODI] Assign Penugasan Mengajar
   ↓ Dosen + Mata Kuliah (status: ACTIVE)
   ↓
[KAPRODI] Klik "Generate Jadwal" ⚡
   ↓ Input: Periode, Kelas, Jenis (PAGI/SORE)
   ↓ 
[SISTEM] Generate Otomatis (10 detik)
   ↓ Buat 5 kandidat jadwal
   ↓ Score setiap kandidat
   ↓ Pilih yang terbaik
   ↓ Auto detect konflik
   ↓
[KAPRODI] Review Jadwal
   ↓ Lihat grid view
   ↓ Cek scoring
   ↓ Perbaiki konflik (gunakan Auto Suggestions)
   ↓ Status: DRAFT → IN_PROGRESS
   ↓
[KAPRODI] Submit ke Sekjur
   ↓ Status: SUBMITTED
   ↓
[SEKJUR] Review & Approve
   ↓ Cek jadwal semua prodi
   ↓ Approve/Reject
   ↓
✅ STATUS: APPROVED (JADWAL FINAL)
```

**Status Jadwal:**
- 🟡 **DRAFT** - Ada konflik, perlu diperbaiki
- 🔵 **IN_PROGRESS** - Sedang dikerjakan Kaprodi
- 🟣 **SUBMITTED** - Sudah disubmit, tunggu approval
- 🟢 **APPROVED** - Disetujui, jadwal final
- 🔴 **REJECTED** - Ditolak, perlu revisi

---

## 📅 Panduan Penjadwalan Otomatis

### 🎯 Konsep Dasar

**Sistem Penjadwalan Otomatis** adalah sistem yang bisa **generate jadwal kuliah otomatis** dengan algoritma pintar dalam hitungan detik.

**Perbandingan:**

| Aspek | Manual (Lama) | Otomatis (Baru) |
|-------|---------------|-----------------|
| Input | Satu per satu | 1 klik |
| Waktu | Berhari-hari | 10 detik |
| Konflik | Cek manual | Auto detect + solusi |
| Koordinasi | Bolak-balik | Minimal |
| Optimasi | Trial error | Algorithm scoring |
| Request Dosen | Submit manual | Set preferensi 1x |

---

### 🚀 Fitur-Fitur Penjadwalan

#### 1. Enhanced Schedule Generator 🤖

**Cara Kerja:**
1. Input: periode, kelas, jenis (PAGI/SORE)
2. Sistem buat **5 kandidat jadwal** dengan berbagai kombinasi
3. Setiap kandidat di-**score** berdasarkan 5 kriteria
4. Pilih kandidat dengan **score tertinggi**
5. Auto **detect konflik**
6. Kasih **suggestions** untuk resolve

**Scoring System:**
```javascript
Total Score = 500 points

1. Day Spread (100 pts)      - Penyebaran hari baik
2. Gap Time (100 pts)        - Jarak waktu optimal
3. Preference Match (100 pts) - Sesuai preferensi dosen
4. Workload Balance (100 pts) - Beban dosen seimbang
5. Room Distribution (100 pts)- Ruangan bervariasi

Jadwal Excellent: 450-500 pts
Jadwal Good:      400-449 pts
Jadwal Average:   350-399 pts
Jadwal Poor:      < 350 pts
```

---

#### 2. Dosen Preference System ⭐

**Komponen:**
- Hari yang disukai (multi-select)
- Hari yang dihindari (multi-select)
- Waktu mengajar (PAGI/SORE/BOTH)
- Priority level (MANDATORY/HIGH/NORMAL/LOW)

**Cara Sistem Gunakan Preferensi:**
```javascript
// Saat generate jadwal
if (slot.day in dosen.preferredDays) {
  score += 20; // Bonus!
}

if (slot.day in dosen.avoidDays && priority == 'MANDATORY') {
  skip_slot(); // Tidak akan dipilih
}

if (slot.time matches dosen.preferredTime) {
  score += 15; // Bonus lagi!
}
```

---

#### 3. Auto Conflict Resolution 🔧

**Jenis Konflik yang Dideteksi:**

1. **DOSEN_CONFLICT**
   - Dosen mengajar 2 kelas di waktu sama
   - Auto suggestion: geser ke slot lain

2. **RUANGAN_CONFLICT**
   - Ruangan dipakai 2 kelas bersamaan
   - Auto suggestion: ganti ruangan atau geser waktu

3. **DOSEN_OVERLOAD**
   - Dosen mengajar terlalu banyak dalam 1 hari
   - Auto suggestion: distribusikan ke hari lain

4. **INVALID_TIME_SLOT**
   - Jadwal bentrok dengan jam istirahat
   - Auto suggestion: pilih slot valid

5. **KAPASITAS_EXCEEDED**
   - Jumlah mahasiswa > kapasitas ruangan
   - Auto suggestion: ganti ruangan lebih besar

**Format Suggestions:**
```
⚠️ Konflik Terdeteksi:
─────────────────────────────────────────
Dr. Budi bentrok di Senin 08:00-10:00
Mengajar 2 kelas: 4TI1 dan 4TI2

✅ Saran 1: Pindah 4TI2 ke Selasa 08:00
   Feasibility: 95%
   Impact: Low
   [Apply]

⚠️ Saran 2: Pindah 4TI2 ke Senin 13:00
   Feasibility: 80%
   Impact: Medium (preferensi dosen PAGI)
   [Apply]

❌ Saran 3: Ganti dosen untuk 4TI2
   Feasibility: 60%
   Impact: High
   [Apply]
─────────────────────────────────────────
Klik "Apply" untuk terapkan solusi!
```

---

### 📖 Panduan Lengkap per Role

#### 🧑‍🏫 Untuk Dosen: Set Preferensi

**Step-by-step:**

1. Login sebagai Dosen
2. Menu → "Preferensi Jadwal"
3. Klik tombol "Atur Preferensi"
4. Isi form:
   ```
   Hari yang Disukai: ☑️ Senin ☑️ Rabu ☐ Jumat
   Hari yang Dihindari: ☑️ Jumat
   Waktu Mengajar: ● PAGI ○ SORE ○ BOTH
   Priority: ○ MANDATORY ● HIGH ○ NORMAL ○ LOW
   ```
5. Klik "Simpan"
6. Selesai! ✅

**Tips:**
- Set preferensi **1x di awal semester**
- Gunakan MANDATORY hanya untuk yang **WAJIB**
- Semakin fleksibel = jadwal lebih optimal
- Update jika ada perubahan

**Contoh Preferensi:**
```javascript
// ✅ GOOD - Fleksibel
{
  preferredDays: ['SENIN', 'RABU'],
  avoidDays: ['JUMAT'],
  preferredTime: 'BOTH',
  priority: 'NORMAL'
}
// Score: ⭐⭐⭐⭐⭐ (Optimal!)

// ⚠️ STRICT - Kurang fleksibel
{
  preferredDays: ['SENIN', 'SELASA'],
  avoidDays: ['RABU', 'KAMIS', 'JUMAT'],
  preferredTime: 'PAGI',
  priority: 'HIGH'
}
// Score: ⭐⭐⭐ (Masih OK)

// ❌ BAD - Terlalu ketat
{
  preferredDays: ['SENIN'],
  avoidDays: ['SELASA', 'RABU', 'KAMIS', 'JUMAT'],
  preferredTime: 'PAGI',
  priority: 'MANDATORY'
}
// Score: ⭐ (Susah dijadwalkan!)
```

---

#### 👑 Untuk Kaprodi: Generate Jadwal

**Prerequisite:**
1. ✅ Penugasan mengajar sudah di-assign (status ACTIVE)
2. ✅ Dosen sudah set preferensi (optional, tapi recommended)
3. ✅ Periode jadwal sudah dibuat (oleh Sekjur)

**Step-by-step:**

1. Login sebagai Kaprodi
2. Menu → "Kelola Jadwal Prodi"
3. Klik tombol **"Generate Jadwal"** ⚡
4. Isi form generator:
   ```
   Periode: Ganjil 2024/2025
   Kelas: 4TI1
   Jenis Jadwal: ● PAGI ○ SORE
   ```
5. Klik "Generate" → Tunggu **10 detik** ⏱️
6. Review hasil:
   - Lihat **Grid View** (tabel jadwal)
   - Cek **Score** (aim for 400+)
   - Cek **Konflik** (harus 0!)
7. Perbaiki konflik (jika ada):
   - Klik tab "Konflik"
   - Lihat suggestions
   - Klik "Apply" pada solusi terbaik
8. Ulangi step 7 sampai konflik = 0
9. Klik **"Submit ke Sekjur"** 🚀
10. Selesai! ✅

**Tips Generate:**
- Generate **PAGI** dan **SORE terpisah** (lebih cepat & optimal)
- Pastikan ada **minimal 3-4 penugasan** per kelas
- Cek preferensi dosen sebelum generate
- Gunakan **Auto Suggestions** untuk fix konflik (1 klik!)

**Interpretasi Score:**
```
Score 450-500: 🌟🌟🌟🌟🌟 EXCELLENT - Jadwal sempurna!
Score 400-449: 🌟🌟🌟🌟   GOOD      - Jadwal bagus
Score 350-399: 🌟🌟🌟     AVERAGE   - Jadwal standar
Score < 350:   🌟🌟       POOR      - Perlu perbaikan
```

---

#### 🛡️ Untuk Sekjur: Review & Approve

**Step-by-step:**

1. Login sebagai Sekjur
2. Menu → "Review Jadwal Prodi"
3. Lihat list jadwal yang di-submit
4. Klik detail jadwal
5. Review:
   - Grid view (tabel)
   - Detail setiap schedule item
   - Check konflik (harus 0!)
   - Check score (aim 400+)
6. Decision:
   - ✅ **Approve** jika OK
   - ❌ **Reject** jika ada masalah (kasih catatan)
7. Selesai! ✅

**Checklist Review:**
- [ ] Tidak ada konflik
- [ ] Score minimal 350
- [ ] Distribusi hari merata
- [ ] Tidak ada gap terlalu lama
- [ ] Preferensi dosen terpenuhi (>70%)
- [ ] Beban dosen seimbang

---

### ❓ FAQ Penjadwalan

#### Q1: Apakah dosen masih bisa request jadwal manual?
**A:** Tidak perlu lagi! Dosen cukup **set preferensi 1x** di awal semester. Sistem otomatis terapkan preferensi saat generate jadwal.

#### Q2: Bagaimana jika preferensi saya tidak bisa dipenuhi?
**A:** Tergantung priority:
- **MANDATORY** → Sistem akan error, harus dipenuhi
- **HIGH** → Akan diprioritaskan, tapi tidak wajib
- **NORMAL/LOW** → Bonus jika bisa, tidak masalah jika tidak

**Tip:** Jangan set semua MANDATORY! Jadwal jadi susah di-generate.

#### Q3: Berapa lama proses generate jadwal?
**A:** 
- 1 kelas (3-5 mata kuliah): **5-10 detik**
- 1 kelas (6-10 mata kuliah): **10-20 detik**
-
