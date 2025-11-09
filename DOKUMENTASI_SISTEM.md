# 📚 Dokumentasi Sistem Informasi Semester Antara (SA)

> **Comprehensive Documentation** - Panduan lengkap untuk memahami dan menggunakan Sistem Informasi Semester Antara

---

## 📋 Daftar Isi

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Fitur Utama](#fitur-utama)
- [User Roles](#user-roles)
- [Workflow Sistem](#workflow-sistem)
- [Setup & Installation](#setup--installation)
- [User Guide](#user-guide)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**Sistem Informasi Semester Antara (SA)** adalah aplikasi web untuk mengelola proses pengajuan dan penjadwalan Semester Antara di lingkungan akademik.

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
4. **Penjadwalan Otomatis** - Generate jadwal dengan algoritma pintar
5. **Manajemen Data** - Master data akademik (jurusan, prodi, dosen, mahasiswa, mata kuliah)

---

## 🛠️ Tech Stack

### Frontend:
- **React.js** - UI Framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **Axios** - HTTP Client
- **SweetAlert2** - Notifications

### Backend:
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **Prisma ORM** - Database ORM
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Helmet** - Security Headers
- **CORS** - Cross-Origin Resource Sharing

### Development Tools:
- **XAMPP** - Local Development Server (MySQL)
- **VS Code** - Code Editor
- **Git** - Version Control
- **npm** - Package Manager

---

## 🏗️ Architecture

### System Architecture:

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Mahasiswa │  │  Dosen   │  │ Kaprodi │  │ Sekjur  │ │
│  │Dashboard │  │Dashboard │  │Dashboard│  │Dashboard│ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│         │             │             │             │      │
│         └─────────────┴─────────────┴─────────────┘      │
│                         │                                │
│                    API Calls (Axios)                     │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│               SERVER (Node.js + Express)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Authentication (JWT)                 │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                   Routes                          │  │
│  │  • /api/auth        • /api/pengajuan-sa          │  │
│  │  • /api/users       • /api/penugasan-mengajar    │  │
│  │  • /api/dosen       • /api/prodi-schedules       │  │
│  │  • /api/mahasiswa   • /api/dosen-preferences     │  │
│  │  • /api/matkul      • /api/conflict-resolver     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Controllers & Services               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                 Prisma ORM                        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (MySQL)                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Users     │  │Pengajuan SA│  │ Schedules  │        │
│  ├────────────┤  ├────────────┤  ├────────────┤        │
│  │   Dosen    │  │ Penugasan  │  │ Preferences│        │
│  ├────────────┤  ├────────────┤  ├────────────┤        │
│  │ Mahasiswa  │  │ Mata Kuliah│  │  Ruangan   │        │
│  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Project Structure:

```
Sistem - SA/
├── client/                          # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── halaman/                # Pages
│   │   │   └── masuk/              # Login page
│   │   ├── komponen/               # Components
│   │   │   ├── fitur/              # Feature components
│   │   │   │   ├── dosen/          # Dosen management
│   │   │   │   ├── mahasiswa/      # Mahasiswa management
│   │   │   │   ├── jadwal/         # Scheduling
│   │   │   │   ├── pengajuan-sa/   # SA applications
│   │   │   │   └── penugasan-mengajar/ # Teaching assignments
│   │   │   ├── layout/             # Layout components
│   │   │   ├── umum/               # Common components
│   │   │   └── error/              # Error components
│   │   ├── utilitas/               # Utilities
│   │   │   ├── network/            # Network utils
│   │   │   ├── notifikasi/         # Notification utils
│   │   │   └── tokenStorage.js     # Token management
│   │   ├── constants/              # Constants
│   │   ├── App.js                  # Main app
│   │   └── index.js                # Entry point
│   └── package.json
│
├── server/                          # Backend Node.js
│   ├── controllers/                # Controllers
│   │   ├── dosenController.js
│   │   ├── mahasiswaController.js
│   │   └── pengajuanSAController.js
│   ├── routes/                     # API Routes
│   │   ├── auth.js                 # Authentication
│   │   ├── dosen.js
│   │   ├── mahasiswa.js
│   │   ├── pengajuanSA.js
│   │   ├── prodiSchedules.js       # Scheduling
│   │   ├── dosenPreferences.js     # Dosen preferences
│   │   └── conflictResolver.js     # Conflict resolution
│   ├── services/                   # Business logic
│   │   ├── enhancedScheduleGenerator.js
│   │   └── conflictResolver.js
│   ├── middleware/                 # Middlewares
│   │   └── security.js             # Security middleware
│   ├── prisma/                     # Prisma ORM
│   │   ├── schema.prisma           # Database schema
│   │   ├── seed.js                 # Database seeding
│   │   └── migrations/             # Database migrations
│   ├── uploads/                    # Uploaded files
│   ├── server.js                   # Server entry point
│   └── package.json
│
├── DOKUMENTASI_SISTEM.md           # This file
├── PANDUAN_PENJADWALAN.md          # Scheduling guide
├── SECURITY_JWT_GUIDE.md           # Security guide
└── README.md                        # Project overview
```

---

## 🎨 Fitur Utama

### 1. **Manajemen Pengajuan SA** 📝

**Deskripsi:** Sistem untuk mengelola pengajuan Semester Antara dari mahasiswa.

**Fitur:**
- ✅ Mahasiswa upload bukti pembayaran
- ✅ Pilih mata kuliah yang ingin diambil
- ✅ Real-time status tracking
- ✅ Multi-level approval (Sekjur → Kaprodi)
- ✅ History pengajuan
- ✅ Notifikasi status

**Workflow:**
```
Mahasiswa submit → Sekjur verifikasi bayar → Kaprodi assign dosen → Proses SA
```

---

### 2. **Penjadwalan Otomatis** 📅

**Deskripsi:** Generate jadwal kuliah otomatis dengan algoritma constraint-based scheduling.

**Fitur:**
- ✅ **Auto Generate** - Generate jadwal dalam 10 detik
- ✅ **Constraint-Based** - Hindari konflik dosen/ruangan
- ✅ **Scoring System** - Pilih jadwal terbaik dari 5 kandidat
- ✅ **Dosen Preferences** - Hormati preferensi dosen
- ✅ **Conflict Detection** - Auto detect 5 jenis konflik
- ✅ **Auto Suggestions** - Kasih solusi untuk setiap konflik
- ✅ **Grid View** - Visualisasi jadwal dalam tabel

**Kriteria Scoring:**
1. **Day Spread** (85/100) - Penyebaran hari yang baik
2. **Gap** (75/100) - Jarak antar kelas wajar
3. **Preference Bonus** (90/100) - Sesuai preferensi dosen
4. **Overload** (80/100) - Beban dosen seimbang
5. **Distribution** (85/100) - Distribusi ruangan merata

**Total Score:** 415/500 (semakin tinggi semakin baik)

---

### 3. **Preferensi Dosen** ⭐

**Deskripsi:** Dosen set preferensi jadwal yang otomatis diterapkan saat generate.

**Preferensi:**
- ✅ **Hari Favorit** - Pilih hari yang disukai
- ✅ **Hari Dihindari** - Pilih hari yang dihindari
- ✅ **Waktu Preferensi** - PAGI / SORE / BOTH
- ✅ **Max Days per Week** - Maksimal berapa hari mengajar
- ✅ **Priority Level** - MANDATORY / HIGH / NORMAL / LOW

**Priority Level:**
- 🔴 **MANDATORY** - WAJIB dipenuhi (sistem error jika tidak bisa)
- 🟠 **HIGH** - Sangat diutamakan
- 🟢 **NORMAL** - Diusahakan
- 🔵 **LOW** - Opsional, bonus jika bisa

---

### 4. **Conflict Resolution** 🔧

**Deskripsi:** Auto detect konflik dan kasih solusi.

**Jenis Konflik:**
1. **DOSEN_CONFLICT** - Dosen ngajar 2 kelas bersamaan
2. **RUANGAN_CONFLICT** - Ruangan dipakai 2 kelas bersamaan
3. **DOSEN_OVERLOAD** - Dosen kelebihan jam dalam 1 hari
4. **INVALID_TIME_SLOT** - Jadwal bentrok jam istirahat
5. **KAPASITAS_EXCEEDED** - Mahasiswa melebihi kapasitas ruangan

**Auto Suggestions:**
- ✅ CHANGE_TIME - Pindah waktu
- ✅ CHANGE_DAY - Pindah hari
- ✅ CHANGE_ROOM - Ganti ruangan
- ✅ CHANGE_DOSEN - Ganti dosen
- ✅ REDISTRIBUTE - Distribusi ulang

Setiap suggestion punya **feasibility score** (0-100%) dan **impact score** (LOW/MEDIUM/HIGH).

---

### 5. **Penugasan Mengajar** 👨‍🏫

**Deskripsi:** Kaprodi assign dosen untuk mengajar mata kuliah.

**Fitur:**
- ✅ Dosen ajukan diri untuk mengajar (opsional)
- ✅ Kaprodi review & approve/reject
- ✅ Status tracking (PENDING/APPROVED/REJECTED/ACTIVE)
- ✅ History penugasan
- ✅ Validasi kompetensi dosen

---

### 6. **Manajemen Data Akademik** 📊

**Data Master:**
- 🏛️ **Jurusan** - Data jurusan
- 🏫 **Program Studi** - Data program studi
- 👨‍🎓 **Mahasiswa** - Data mahasiswa
- 👨‍🏫 **Dosen** - Data dosen
- 📚 **Mata Kuliah** - Data mata kuliah
- 🏢 **Ruangan** - Data ruangan
- 👤 **Users** - Data pengguna (login)

**Akses:**
- **Sekjur** - Full CRUD semua data
- **Kaprodi** - Read-only mahasiswa/dosen
- **Dosen** - Read-only mahasiswa

---

## 👥 User Roles

### 1. **Mahasiswa** 👨‍🎓

**Hak Akses:**
- ✅ Submit pengajuan SA
- ✅ Upload bukti pembayaran
- ✅ Pilih mata kuliah SA
- ✅ Lihat status pengajuan
- ✅ Lihat jadwal SA (jika sudah approved)
- ✅ Update profile

**Dashboard:**
- Status pengajuan SA
- History pengajuan
- Jadwal SA (jika ada)

---

### 2. **Dosen** 👨‍🏫

**Hak Akses:**
- ✅ Set preferensi jadwal mengajar
- ✅ Ajukan diri untuk mengajar mata kuliah (opsional)
- ✅ Lihat pengajuan SA yang ditugaskan
- ✅ Input nilai SA mahasiswa
- ✅ Lihat jadwal mengajar final
- ✅ Lihat data mahasiswa (read-only)

**Dashboard:**
- Preferensi jadwal
- Jadwal mengajar saya
- Pengajuan mengajar
- Mahasiswa bimbingan SA

---

### 3. **Kaprodi** 👑

**Hak Akses:**
- ✅ Verifikasi pengajuan SA (setelah Sekjur approve)
- ✅ Assign dosen pembimbing SA
- ✅ Generate jadwal otomatis
- ✅ Manage jadwal (edit/delete/add manual)
- ✅ Resolve konflik jadwal
- ✅ Submit jadwal ke Sekjur
- ✅ Review request penugasan mengajar
- ✅ Lihat data mahasiswa/dosen (read-only)

**Dashboard:**
- Pengajuan SA pending
- Jadwal program studi
- Request penugasan mengajar
- Generate jadwal otomatis

---

### 4. **Sekretaris Jurusan (Sekjur)** 🛡️

**Hak Akses:**
- ✅ Verifikasi bukti pembayaran SA
- ✅ Approve/Reject pengajuan SA
- ✅ Review & approve jadwal dari Kaprodi
- ✅ Full CRUD data akademik (jurusan, prodi, dosen, mahasiswa, mata kuliah, ruangan)
- ✅ Manage users (create, edit, delete)
- ✅ Manage periode jadwal

**Dashboard:**
- Pengajuan SA pending verifikasi
- Jadwal pending approval
- Management data akademik
- Management users

---

## 🔄 Workflow Sistem

### A. Workflow Pengajuan SA

```
┌─────────────────────────────────────────────────────────────┐
│                    MAHASISWA                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Upload bukti pembayaran                                 │
│  2. Pilih mata kuliah yang ingin diambil                    │
│  3. Submit pengajuan                                        │
│     Status: "PENDING" (Menunggu Verifikasi Sekjur)         │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    SEKRETARIS JURUSAN                        │
├─────────────────────────────────────────────────────────────┤
│  1. Review bukti pembayaran                                 │
│  2. Cek nominal, tanggal, validitas                         │
│  3. APPROVE atau REJECT                                     │
│     ✅ APPROVE → Status: "APPROVED_BY_SEKJUR"              │
│     ❌ REJECT → Status: "REJECTED", kasih alasan           │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    KAPRODI                                   │
├─────────────────────────────────────────────────────────────┤
│  1. Review pengajuan yang sudah diapprove Sekjur           │
│  2. Assign dosen pembimbing                                │
│  3. Submit                                                  │
│     Status: "IN_PROGRESS" (Proses SA)                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    DOSEN                                     │
├─────────────────────────────────────────────────────────────┤
│  1. Bimbing mahasiswa SA                                    │
│  2. Input nilai akhir                                       │
│     Status: "COMPLETED" (Selesai)                           │
└─────────────────────────────────────────────────────────────┘
```

**Status Flow:**
```
PENDING → APPROVED_BY_SEKJUR → IN_PROGRESS → COMPLETED
         ↓
      REJECTED (bisa dari Sekjur atau Kaprodi)
```

---

### B. Workflow Penjadwalan

```
┌─────────────────────────────────────────────────────────────┐
│                    DOSEN (Di Awal Semester)                  │
├─────────────────────────────────────────────────────────────┤
│  1. Set preferensi jadwal (sekali)                          │
│     • Hari favorit: Senin, Rabu                             │
│     • Hari dihindari: Jumat                                 │
│     • Waktu: PAGI                                           │
│     • Priority: HIGH/MANDATORY                              │
│  2. Simpan preferensi                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    KAPRODI                                   │
├─────────────────────────────────────────────────────────────┤
│  1. Klik "Generate Jadwal"                                  │
│  2. Pilih:                                                  │
│     • Periode: Ganjil 2024/2025                            │
│     • Kelas: 4ti1                                          │
│     • Jenis: PAGI / SORE                                   │
│  3. Klik "Generate"                                        │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    SISTEM (10 detik)                         │
├─────────────────────────────────────────────────────────────┤
│  1. Ambil data:                                             │
│     • Mata kuliah (dari penugasan mengajar)                │
│     • Dosen tersedia                                       │
│     • Ruangan tersedia                                     │
│     • Preferensi dosen                                     │
│  2. Generate 5 kandidat jadwal                             │
│  3. Scoring setiap kandidat (5 kriteria)                   │
│  4. Pilih jadwal dengan skor tertinggi                     │
│  5. Check konflik                                          │
│     Status: "DRAFT" (jika ada konflik)                     │
│     Status: "PENDING_APPROVAL" (jika clean)                │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    KAPRODI (Review)                          │
├─────────────────────────────────────────────────────────────┤
│  1. Review jadwal hasil generate                           │
│  2. Jika ada konflik:                                      │
│     • Lihat suggestions                                    │
│     • Klik "Apply" untuk perbaiki                          │
│  3. Jika perlu, edit manual                                │
│  4. Setelah OK, klik "Submit ke Sekjur"                    │
│     Status: "SUBMITTED"                                     │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    SEKRETARIS JURUSAN                        │
├─────────────────────────────────────────────────────────────┤
│  1. Review jadwal yang disubmit                            │
│  2. Cek grid view, detail jadwal                           │
│  3. APPROVE atau REJECT                                     │
│     ✅ APPROVE → Status: "APPROVED" (Jadwal final)         │
│     ❌ REJECT → Status: "DRAFT", Kaprodi revisi            │
└─────────────────────────────────────────────────────────────┘
```

---

### C. Workflow Penugasan Mengajar

```
┌─────────────────────────────────────────────────────────────┐
│                    DOSEN (Opsional)                          │
├─────────────────────────────────────────────────────────────┤
│  1. Ajukan diri untuk mengajar mata kuliah                 │
│  2. Pilih mata kuliah                                      │
│  3. Submit request                                         │
│     Status: "PENDING"                                       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    KAPRODI                                   │
├─────────────────────────────────────────────────────────────┤
│  1. Review request penugasan                               │
│  2. Cek kompetensi dosen vs mata kuliah                    │
│  3. APPROVE atau REJECT                                     │
│     ✅ APPROVE → Status: "APPROVED"                        │
│     ❌ REJECT → Status: "REJECTED"                         │
│  4. Atau assign manual (tanpa request dari dosen)         │
│     Status langsung: "APPROVED"                             │
│  5. Activate penugasan setelah semester aktif              │
│     Status: "ACTIVE"                                        │
└─────────────────────────────────────────────────────────────┘

Note: Hanya penugasan dengan status "ACTIVE" yang dipakai
      untuk generate jadwal.
```

---

## 🚀 Setup & Installation

### Prerequisites:
- **Node.js** v14+ 
- **npm** v6+
- **XAMPP** (MySQL)
- **Git**

### 1️⃣ Clone Repository

```bash
git clone <repository-url>
cd Sistem - SA
```

### 2️⃣ Setup Database

1. Start XAMPP → Start MySQL
2. Buka phpMyAdmin (http://localhost/phpmyadmin)
3. Create database: `sekjur`

### 3️⃣ Setup Backend

```bash
cd server

# Install dependencies
npm install

# Setup environment variables
# Edit file .env, pastikan ada:
# DATABASE_URL="mysql://root:@localhost:3306/sekjur"
# JWT_SECRET=<random-secret-key>
# PORT=5000

# Generate JWT_SECRET (opsional, sudah ada default)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Run migrations
npx prisma migrate dev

# Seed database (data dummy)
npm run seed

# Start server
npm run dev
# Server running di http://localhost:5000
```

### 4️⃣ Setup Frontend

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
# App running di http://localhost:3000
```

### 5️⃣ Login

**Default Credentials:**

| Role | Username | Password |
|------|----------|----------|
| Sekjur | sekjur_informatika | 123456 |
| Kaprodi | 197101011999031004 | 123456 |
| Dosen | 198502022010012001 | 123456 |
| Mahasiswa | 2141720001 | 123456 |

---

## 📖 User Guide

### Untuk Mahasiswa:

1. **Login** dengan username (NIM) dan password
2. Klik menu **"Pengajuan SA"**
3. Klik **"Tambah Pengajuan"**
4. **Upload bukti pembayaran** (JPG/PNG, max 5MB)
5. **Pilih mata kuliah** yang ingin diambil
6. Sistem auto calculate total SKS & total bayar
7. Klik **"Submit Pengajuan"**
8. Tunggu verifikasi dari Sekjur & Kaprodi
9. Cek **status** di dashboard

**Status:**
- 🟡 **PENDING** - Menunggu verifikasi Sekjur
- 🟢 **APPROVED_BY_SEKJUR** - Menunggu Kaprodi assign dosen
- 🔵 **IN_PROGRESS** - Sedang proses SA
- ✅ **COMPLETED** - SA selesai, nilai sudah keluar
- ❌ **REJECTED** - Ditolak (lihat alasan)

---

### Untuk Dosen:

#### A. Set Preferensi Jadwal
1. **Login**
2. Klik menu **"Preferensi Jadwal"**
3. Klik **"Tambah Preferensi"**
4. Isi form:
   - Hari favorit: Senin, Rabu
   - Hari dihindari: Jumat
   - Waktu: PAGI
   - Max days: 3 hari per minggu
   - Priority: HIGH (untuk yang penting)
5. **Simpan**

**Tips:**
- Set priority **MANDATORY** hanya untuk yang WAJIB
- Semakin fleksibel preferensi, semakin mudah sistem buat jadwal optimal

#### B. Ajukan Mengajar (Opsional)
1. Klik menu **"Ajukan Mengajar"**
2. Klik **"Tambah Pengajuan"**
3. Pilih mata kuliah
4. Submit
5. Tunggu approval dari Kaprodi

#### C. Bimbingan SA & Input Nilai
1. Klik menu **"Pengajuan SA"**
2. Lihat mahasiswa yang ditugaskan ke Anda
3. Setelah bimbingan selesai, klik **"Input Nilai"**
4. Masukkan nilai akhir
5. Submit

---

### Untuk Kaprodi:

#### A. Verifikasi Pengajuan SA & Assign Dosen
1. **Login**
2. Klik menu **"Pengajuan SA"**
3. Filter status: **"Approved by Sekjur"**
4. Klik **"Detail"** pada pengajuan
5. Pilih **dosen pembimbing** yang sesuai dengan mata kuliah
6. Klik **"Assign Dosen"**

#### B. Generate Jadwal Otomatis
1. Klik menu **"Kelola Jadwal"**
2. Klik tombol **"Generate Jadwal"** ✨
3. Isi form:
   - Periode: Ganjil 2024/2025
   - Kelas: 4ti1
   - Jenis: PAGI atau SORE
4. Klik **"Generate"**
5. Tunggu 10 detik
6. Jadwal otomatis terbuat!

**Tips:**
- Generate PAGI dan SORE terpisah untuk hasil optimal
- Pastikan data penugasan mengajar sudah di-activate
- Pastikan dosen sudah set preferensi

#### C. Review & Fix Konflik
1. Setelah generate, klik **"Lihat Detail"**
2. Jika ada konflik (warning ⚠️), klik **"Lihat Konflik"**
3. Sistem akan show suggestions
4. Pilih suggestion terbaik
5. Klik **"Apply"**
6. Konflik selesai!

#### D. Submit ke Sekjur
1. Setelah jadwal OK, klik **"Submit ke Sekjur"**
2. Jadwal masuk antrian approval

---

### Untuk Sekretaris Jurusan:

#### A. Verifikasi Pembayaran SA
1. **Login**
2. Klik menu **"Pengajuan SA"**
3. Filter status: **"Pending"**
4. Klik **"Verifikasi"** pada pengajuan
5. Review:
   - Bukti pembayaran (foto)
   - Nominal pembayaran
   - Mata kuliah yang dipilih
   - Total SKS
6. **APPROVE** jika valid, **REJECT** jika tidak valid
7. Jika reject, beri **alasan** yang jelas

#### B. Review & Approve Jadwal
1. Klik menu **"Review Jadwal"**
2. Lihat jadwal yang status **"Submitted"**
3. Klik **"Review"**
4. Periksa:
   - Grid view (tabel jadwal)
   - Detail jadwal
   - Konflik (jika ada)
5. **APPROVE** jika OK
6. **REJECT** jika ada masalah (kasih catatan)

#### C. Manage Data Akademik
1. Klik menu **"Data Akademik"**
2. Pilih data yang ingin dikelola:
   - Jurusan
   - Program Studi
   - Mahasiswa
   - Dosen
   - Mata Kuliah
   - Ruangan
3. **CRUD operations**: Create, Read, Update, Delete
4. Manage users (create, edit, reset password, delete)

---

## 💾 Database Schema

### Key Tables:

#### **Users**
```sql
- id (PK)
- username (unique)
- password (hashed)
- nama
- role (MAHASISWA/DOSEN/KAPRODI/SEKJUR)
- jurusanId (FK)
- programStudiId (FK)
```

#### **Jurusan**
```sql
- id (PK)
- nama
- users (1:N)
- programStudi (1:N)
```

#### **ProgramStudi**
```sql
- id (PK)
- nama
- ketuaProdi
- jurusanId (FK)
- mahasiswa (1:N)
- dosen (1:N)
- mataKuliah (1:N)
```

#### **Dosen**
```sql
- nip (PK)
- nama
- prodiId (FK)
- isKaprodi (boolean)
- noTelp
- alamat
- user (1:1)
- penugasanMengajar (1:N)
- dosenPreferences (1:N)
```

#### **Mahasiswa**
```sql
- nim (PK)
- nama
- programStudiId (FK)
- angkatan
- semester
- noTelp
- alamat
- user (1:1)
- pengajuanSA (1:N)
```

#### **MataKuliah**
```sql
- id (PK)
- nama
- sks
- semester
- programStudiId (FK)
- penugasanMengajar (1:N)
- pengajuanSADetail (1:N)
```

#### **PengajuanSA**
```sql
- id (PK)
- mahasiswaNim (FK)
- buktiPembayaran (file path)
- totalSKS
- totalBayar
- status (enum)
- dosenPembimbingNip (FK)
- alasanRejection
- createdAt
- updatedAt
- detail (1:N PengajuanSADetail)
```

#### **PenugasanMengajar**
```sql
- id (PK)
- dosenNip (FK)
- mataKuliahId (FK)
- status (PENDING/APPROVED/REJECTED/ACTIVE)
- createdAt
- updatedAt
```

#### **ProdiSchedule**
```sql
- id (PK)
- timetablePeriodId (FK)
- programStudiId (FK)
- kelas
- status (DRAFT/PENDING_APPROVAL/SUBMITTED/APPROVED/REJECTED)
- scheduleType (PAGI/SORE)
- createdBy (FK User)
- submittedAt
- approvedAt
- items (1:N ScheduleItem)
```

#### **ScheduleItem**
```sql
- id (PK)
- scheduleId (FK)
- mataKuliahId (FK)
- dosenNip (FK)
- ruanganId (FK)
- hari (enum)
- jamMulai
- jamSelesai
- kapasitasMahasiswa
```

#### **DosenPreference**
```sql
- id (PK)
- dosenNip (FK)
- preferredDays (comma-separated)
- avoidedDays (comma-separated)
- preferredTimeSlot (PAGI/SORE/BOTH)
- maxDaysPerWeek
- priority (LOW/NORMAL/HIGH/MANDATORY)
- createdAt
- updatedAt
```

#### **Ruangan**
```sql
- id (PK)
- nama
- kapasitas
- fasilitas
- lokasi
- isActive
```

### Entity Relationship:
```
Jurusan 1---N ProgramStudi 1---N MataKuliah
                    |
                    +---N Mahasiswa
                    |
                    +---N Dosen
                            |
                            +---N PenugasanMengajar
                            |
                            +---N DosenPreference
                            |
                            +---N ScheduleItem

PengajuanSA N---N MataKuliah (via PengajuanSADetail)
PengajuanSA N---1 Dosen (pembimbing)
PengajuanSA N---1 Mahasiswa

ProdiSchedule 1---N ScheduleItem
ScheduleItem N---1 MataKuliah
ScheduleItem N---1 Dosen
ScheduleItem N---1 Ruangan
```

---

## 🔌 API Documentation

### Base URL: `http://localhost:5000/api`

### Authentication:
```
Header: Authorization: Bearer <JWT_TOKEN>
```

### Endpoints:

#### **Auth**
- `POST /auth/login` - Login user
- `POST /auth/verify` - Verify token

#### **Pengajuan SA**
- `GET /pengajuan-sa` - Get all (filtered by role)
- `POST /pengajuan-sa` - Create new
- `PUT /pengajuan-sa/:id` - Update
- `DELETE /pengajuan-sa/:id` - Delete
- `PUT /pengajuan-sa/:id/status` - Update status
- `PUT /pengajuan-sa/:id/assign-dosen` - Assign dosen
- `PUT /pengajuan-sa/:id/nilai` - Input nilai

#### **Schedules**
- `GET /prodi-schedules/my-prodi` - Get schedules for my prodi
- `POST /prodi-schedules/generate` - Generate schedule
- `PUT /prodi-schedules/:id` - Update schedule
- `DELETE /prodi-schedules/:id` - Delete schedule
- `POST /prodi-schedules/:id/submit` - Submit for approval
- `PUT /prodi-schedules/:id/approve` - Approve schedule
- `PUT /prodi-schedules/:id/reject` - Reject schedule

#### **Schedule Items**
- `GET /prodi-schedules/:id/items` - Get schedule items
- `POST /prodi-schedules/:id/items` - Add item
- `PUT /schedule-items/:id` - Update item
- `DELETE /schedule-items/:id` - Delete item

#### **Dosen Preferences**
- `GET /dosen-preferences/my-preferences` - Get my preferences
- `POST /dosen-preferences` - Create preference
- `PUT /dosen-preferences/:id` - Update preference
- `DELETE /dosen-preferences/:id` - Delete preference

#### **Conflict Resolver**
- `POST /conflict-resolver/detect` - Detect conflicts
- `POST /conflict-resolver/suggest` - Generate suggestions
- `POST /conflict-resolver/apply` - Apply suggestion

#### **Penugasan Mengajar**
- `GET /penugasan-mengajar` - Get all assignments
- `POST /penugasan-mengajar` - Create assignment
- `PUT /penugasan-mengajar/:id/status` - Update status
- `PUT /penugasan-mengajar/:id/activate` - Activate assignment

#### **Master Data**
- `GET /dosen` - Get all dosen
- `POST /dosen` - Create dosen
- `PUT /dosen/:nip` - Update dosen
- `DELETE /dosen/:nip` - Delete dosen

- `GET /mahasiswa` - Get all mahasiswa
- `POST /mahasiswa` - Create mahasiswa
- `PUT /mahasiswa/:nim` - Update mahasiswa
- `DELETE /mahasiswa/:nim` - Delete mahasiswa

- `GET /matakuliah` - Get all mata kuliah
- `POST /matakuliah` - Create mata kuliah
- `PUT /matakuliah/:id` - Update mata kuliah
- `DELETE /matakuliah/:id` - Delete mata kuliah

- `GET /ruangan` - Get all ruangan
- `POST /ruangan` - Create ruangan
- `PUT /ruangan/:id` - Update ruangan
- `DELETE /ruangan/:id` - Delete ruangan

---

## 🔐 Security

### Implemented:
- ✅ **JWT Authentication** - Token-based auth with 24h expiration
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **Role-Based Access Control** - Different permissions per role
- ✅ **Input Validation** - Prisma ORM validation
- ✅ **CORS** - Allowed origins configuration
- ✅ **Helmet.js** - Security headers
- ✅ **Rate Limiting** - API rate limiting
- ✅ **Token Storage** - Obfuscated localStorage with auto-expire

### Best Practices:
- ✅ JWT_SECRET di environment variable
- ✅ Password tidak pernah di-log
- ✅ HTTPS untuk production (recommended)
- ✅ File upload validation (size, type)
- ✅ SQL injection prevention (Prisma ORM)
- ✅ XSS prevention (input sanitization)

### Default Credentials:
⚠️ **WAJIB diganti di production!**
```
Password default semua user: 123456
```

**Referensi:** Baca `SECURITY_JWT_GUIDE.md` untuk detail lengkap.

---

## 🐛 Troubleshooting

### Problem: Server tidak bisa start
**Error:** `Error: connect ECONNREFUSED`

**Solusi:**
1. Pastikan MySQL running (XAMPP)
2. Cek `DATABASE_URL` di `.env`
3. Test koneksi: `npx prisma db push`

---

### Problem: Login gagal
**Error:** `Invalid credentials`

**Solusi:**
1. Cek username & password
2. Pastikan database sudah di-seed: `npm run seed`
3. Default credentials:
   - Sekjur: `sekjur_informatika` / `123456`
   - Kaprodi: `197101011999031004` / `123456`

---

### Problem: Generate jadwal gagal
**Error:** `No active teaching assignments found`

**Solusi:**
1. Pastikan ada **penugasan mengajar** dengan status **ACTIVE**
2. Cek di menu "Penugasan Mengajar"
3. Activate penugasan yang sudah approved

---

### Problem: Token expired
**Error:** `Token expired` atau `403 Forbidden`

**Solusi:**
1. Logout & login ulang
2. Token expired setelah 24 jam
3. Clear browser cache & localStorage

---

### Problem: Upload file gagal
**Error:** `File too large` atau `Invalid file type`

**Solusi:**
1. Max file size: **5MB**
2. Allowed types: **JPG, PNG**
3. Compress image jika terlalu besar

---

### Problem: Konflik tidak terdeteksi
**Issue:** Jadwal bentrok tapi sistem tidak detect

**Solusi:**
1. Klik **"Detect Conflicts"** manual
2. Refresh halaman
3. Report ke developer jika tetap tidak terdeteksi

---

## 📞 Support & Documentation

### Documentation Files:
- 📘 **DOKUMENTASI_SISTEM.md** - This file (complete system documentation)
- 📗 **PANDUAN_PENJADWALAN.md** - Detailed scheduling guide
- 📕 **PENJADWALAN_RINGKAS.md** - Quick reference for scheduling
- 📙 **SECURITY_JWT_GUIDE.md** - Security & JWT token guide
- 📓 **SEEDING_GUIDE.md** - Database seeding guide

### Quick Links:
- 🌐 **Prisma Docs:** https://www.prisma.io/docs
- 🌐 **React Docs:** https://react.dev
- 🌐 **Express Docs:** https://expressjs.com
- 🌐 **Tailwind CSS:** https://tailwindcss.com

### Contact:
- 💬 Diskusi dengan tim developer
- 🐛 Report bugs di issue tracker
- 📧 Email: [your-email]

---

## 🎯 Summary

### System Highlights:
1. ✅ **Digitalisasi Pengajuan SA** - Paperless, realtime tracking
2. ✅ **Auto Generate Jadwal** - 10 detik vs berhari-hari manual
3. ✅ **Smart Scheduling** - Constraint-based dengan scoring system
4. ✅ **Dosen Preferences** - Hormati preferensi dosen otomatis
5. ✅ **Auto Conflict Resolution** - Detect & kasih solusi 1 klik
6. ✅ **Multi-level Approval** - Workflow Sekjur → Kaprodi
7. ✅ **Role-Based Access** - 4 roles dengan permissions berbeda
8. ✅ **Responsive Design** - Desktop & mobile friendly
9. ✅ **Security First** - JWT, bcrypt, rate limiting, CORS
10. ✅ **Easy Maintenance** - Clean architecture, well-documented

---

## 🚀 Future Enhancements

### Planned Features:
- 📱 **Mobile App** - React Native version
- 📊 **Analytics Dashboard** - Reporting & statistics
- 📧 **Email Notifications** - Auto email untuk status changes
- 🔔 **Push Notifications** - Real-time notifications
- 📅 **Calendar Integration** - Export to Google Calendar
- 🎨 **Theme Customization** - Dark mode, custom colors
- 📤 **Export to PDF** - Download jadwal as PDF
- 🔄 **Auto Refresh Token** - Refresh token mechanism
- 🌐 **Multi-language** - English version
- 🤖 **AI Suggestions** - ML-based scheduling optimization

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready

---

**🎉 Terima kasih telah menggunakan Sistem Informasi Semester Antara!**