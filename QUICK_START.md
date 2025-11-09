# 🚀 Quick Start Guide - Sistem SA

> **Quick Reference** - Panduan cepat untuk mulai menggunakan sistem

---

## ⚡ Setup Cepat (5 Menit)

### 1. Clone & Install
```bash
# Clone repository
git clone <repo-url>
cd "Sistem - SA"

# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 2. Setup Database
```bash
# Start XAMPP → MySQL
# Create database: sekjur

# Di folder server/
npx prisma migrate dev
npm run seed
```

### 3. Jalankan Aplikasi
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

### 4. Login
```
Sekjur:    sekjur_informatika / 123456
Kaprodi:   197101011999031004 / 123456
Dosen:     198502022010012001 / 123456
Mahasiswa: 2141720001 / 123456
```

---

## 🎯 Fitur Utama (What Can I Do?)

### Mahasiswa 👨‍🎓
```
✅ Submit pengajuan SA
✅ Upload bukti bayar
✅ Pilih mata kuliah
✅ Track status real-time
```

### Dosen 👨‍🏫
```
✅ Set preferensi jadwal (1x)
✅ Ajukan mengajar (optional)
✅ Lihat mahasiswa bimbingan
✅ Input nilai SA
```

### Kaprodi 👑
```
✅ Verifikasi pengajuan SA
✅ Assign dosen pembimbing
✅ Generate jadwal (1 klik, 10 detik!)
✅ Resolve konflik otomatis
✅ Submit jadwal ke Sekjur
```

### Sekjur 🛡️
```
✅ Verifikasi bukti bayar
✅ Approve/reject pengajuan
✅ Approve jadwal
✅ Manage data master (CRUD all)
```

---

## 🔄 Workflow Singkat

### Pengajuan SA
```
Mahasiswa submit → Sekjur verif bayar → Kaprodi assign dosen → Done
```

### Penjadwalan
```
Dosen set preferensi → Kaprodi klik "Generate" → 10 detik → Jadwal jadi!
```

---

## 🎨 Tech Stack

**Frontend:** React + Tailwind CSS  
**Backend:** Node.js + Express + Prisma  
**Database:** MySQL (XAMPP)  
**Auth:** JWT (24h expiration)

---

## 📊 Database Schema (Simple)

```
Users ──→ Dosen ──→ DosenPreference
  │         │
  │         └──→ PenugasanMengajar ──→ ScheduleItem
  │
  ├──→ Mahasiswa ──→ PengajuanSA ──→ PengajuanSADetail
  │
  └──→ ProgramStudi ──→ MataKuliah
          │
          └──→ ProdiSchedule ──→ ScheduleItem
```

---

## 🔥 Common Commands

```bash
# Backend
cd server
npm run dev          # Start server
npm run seed         # Seed database
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Run migrations

# Frontend
cd client
npm start            # Start dev server
npm run build        # Build for production
```

---

## 💡 Pro Tips

### Untuk Dosen:
- ⭐ Set preferensi **MANDATORY** hanya untuk yang WAJIB
- ⭐ Semakin fleksibel = jadwal lebih optimal

### Untuk Kaprodi:
- ⚡ Generate **PAGI** dan **SORE** terpisah
- ⚡ Pastikan penugasan mengajar **ACTIVE**
- ⚡ Gunakan **Auto Suggestions** untuk fix konflik (1 klik!)

### Untuk Sekjur:
- 📋 Cek nominal pembayaran = SKS × Rp 300.000
- 📋 Verifikasi foto bukti bayar dengan teliti

---

## 🐛 Troubleshooting Kilat

| Problem | Solution |
|---------|----------|
| Server error | Pastikan MySQL running (XAMPP) |
| Login gagal | Cek username/password, atau seed ulang |
| Generate gagal | Pastikan ada penugasan **ACTIVE** |
| Token expired | Logout & login ulang |
| Upload gagal | Max 5MB, format JPG/PNG |

---

## 📂 File Struktur Penting

```
Sistem - SA/
├── client/src/
│   ├── komponen/fitur/
│   │   ├── jadwal/              ← Penjadwalan
│   │   ├── pengajuan-sa/        ← Pengajuan SA
│   │   └── penugasan-mengajar/  ← Penugasan
│   └── App.js                   ← Main routes
│
├── server/
│   ├── routes/                  ← API endpoints
│   ├── services/                ← Business logic
│   │   ├── enhancedScheduleGenerator.js  ← Magic happens here!
│   │   └── conflictResolver.js
│   ├── prisma/schema.prisma     ← Database schema
│   └── server.js                ← Entry point
│
└── Dokumentasi/
    ├── DOKUMENTASI_SISTEM.md    ← Complete docs (this!)
    ├── PANDUAN_PENJADWALAN.md   ← Scheduling guide
    └── SECURITY_JWT_GUIDE.md    ← Security guide
```

---

## 🔐 Security Checklist

- [x] JWT_SECRET di `.env`
- [x] Password hashed (bcrypt)
- [x] Rate limiting enabled
- [x] CORS configured
- [ ] HTTPS for production
- [ ] Change default passwords!

---

## 📞 Need Help?

1. 📖 Baca `DOKUMENTASI_SISTEM.md` (lengkap!)
2. 📗 Baca `PANDUAN_PENJADWALAN.md` (detail scheduling)
3. 💬 Tanya tim developer
4. 🐛 Report bugs

---

## 🎯 Quick Actions

| Aksi | Command |
|------|---------|
| Reset DB | `npx prisma migrate reset` |
| View DB | `npx prisma studio` |
| Generate secret | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| Check ports | `netstat -ano \| findstr :3000` (frontend)<br>`netstat -ano \| findstr :5000` (backend) |

---

## 🚀 One-Liner Commands

```bash
# Full reset & restart
cd server && npx prisma migrate reset && npm run dev

# Quick test
curl http://localhost:5000/api/auth/verify

# Seed only
cd server && npm run seed
```

---

## 📊 System Status Indicators

| Status | Meaning |
|--------|---------|
| 🟢 APPROVED | Jadwal/pengajuan disetujui |
| 🟡 PENDING | Menunggu approval |
| 🔵 IN_PROGRESS | Sedang proses |
| ⚠️ DRAFT | Ada konflik, perlu diperbaiki |
| ❌ REJECTED | Ditolak |

---

## 🎨 Priority Levels (Preferensi)

| Level | Icon | Keterangan |
|-------|------|------------|
| MANDATORY | 🔴 | WAJIB dipenuhi |
| HIGH | 🟠 | Sangat diutamakan |
| NORMAL | 🟢 | Diusahakan |
| LOW | 🔵 | Opsional |

---

## ⚡ Performance Tips

- ✅ Generate PAGI & SORE terpisah (lebih cepat)
- ✅ Seed database dengan data realistic
- ✅ Clear browser cache jika lemot
- ✅ Use Chrome DevTools untuk debug
- ✅ Check Network tab untuk API errors

---

## 🎉 That's It!

**Sistem siap digunakan!** 🚀

Untuk dokumentasi lengkap, baca **`DOKUMENTASI_SISTEM.md`**

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Ready to Rock!