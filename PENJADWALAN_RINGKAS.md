# 📅 Panduan Singkat Penjadwalan Otomatis

> **Quick Reference** - Versi ringkas untuk memahami sistem penjadwalan dengan cepat

---

## 🎯 Konsep Dasar

**Sistem Penjadwalan Otomatis** = Sistem yang bisa **buat jadwal kuliah otomatis** dengan klik 1 tombol.

### Sebelumnya (Manual):
```
Dosen request → Kaprodi review satu-satu → Input manual → 
Cek konflik manual → Revisi berkali-kali → Selesai (berhari-hari)
```

### Sekarang (Otomatis):
```
Dosen set preferensi (1x) → Kaprodi klik "Generate" → 
Jadwal jadi otomatis (10 detik) → Submit → Selesai!
```

---

## 🚀 Fitur Utama (4 Fitur)

### 1️⃣ **Auto Generate Jadwal** 🤖
- Klik 1 tombol → Jadwal otomatis terbuat
- Sistem buat 5 kandidat jadwal → Pilih yang terbaik
- Waktu: **5-10 detik** (vs berhari-hari manual)

### 2️⃣ **Preferensi Dosen** ⭐
- Dosen set preferensi sekali di awal semester
- Contoh: "Saya suka ngajar Senin-Rabu, hindari Jumat, lebih suka pagi"
- Preferensi otomatis diterapkan saat generate

### 3️⃣ **Auto Detect Konflik** ⚠️
- Sistem auto cek konflik (dosen bentrok, ruangan bentrok, dll)
- Kasih **suggestions** untuk perbaiki
- Klik "Apply" → Konflik selesai dalam 1 klik!

### 4️⃣ **Scoring System** 🎯
- Setiap jadwal diberi nilai berdasarkan:
  - Penyebaran hari (jangan menumpuk)
  - Gap waktu (hindari jarak terlalu lama)
  - Preferensi dosen (kasih bonus jika sesuai)
  - Beban dosen (jangan overload)
  - Distribusi ruangan (pakai berbagai ruangan)

---

## 👥 Cara Pakai per Role

### 🧑‍🏫 **DOSEN**
1. Login → Menu "Preferensi Jadwal"
2. Set preferensi:
   - Hari favorit: Senin, Rabu
   - Hari dihindari: Jumat
   - Waktu: PAGI / SORE / BOTH
   - Priority: MANDATORY / HIGH / NORMAL / LOW
3. Simpan → Selesai!
4. Tunggu Kaprodi generate jadwal

**Catatan:** Cukup set **1x di awal semester**, tidak perlu request manual lagi!

---

### 👑 **KAPRODI**
1. Login → Menu "Kelola Jadwal"
2. Klik tombol **"Generate Jadwal"** ✨
3. Isi form:
   - Periode: Ganjil 2024/2025
   - Kelas: 4ti1
   - Jenis: PAGI / SORE
4. Klik "Generate" → Tunggu 10 detik
5. Jadwal jadi! Review:
   - Lihat detail jadwal
   - Cek grid view (tabel)
   - Perbaiki konflik jika ada (klik "Apply")
6. Klik **"Submit ke Sekjur"** → Selesai!

**Tips:** Generate PAGI dan SORE terpisah untuk hasil optimal.

---

### 🛡️ **SEKRETARIS JURUSAN**
1. Login → Menu "Review Jadwal"
2. Lihat jadwal yang disubmit Kaprodi
3. Review jadwal (detail, grid view)
4. **Approve** (jika OK) atau **Reject** (jika ada masalah)
5. Selesai!

---

## 💡 Perbedaan Utama

| Aspek | Lama | Baru |
|-------|------|------|
| Input | Manual 1-1 | Auto (1 klik) |
| Waktu | Berhari-hari | 10 detik |
| Request Dosen | Dosen request manual | Set preferensi 1x |
| Konflik | Cek manual | Auto detect + solusi |
| Koordinasi | Banyak | Minimal |

---

## 🎯 Scoring Jadwal

Sistem nilai jadwal dengan **5 kriteria**:

1. **Day Spread** (85/100) → Jadwal tersebar, tidak menumpuk
2. **Gap** (75/100) → Jarak antar kelas wajar
3. **Preference** (90/100) → Sesuai preferensi dosen
4. **Overload** (80/100) → Beban dosen seimbang
5. **Distribution** (85/100) → Ruangan bervariasi

**Total: 415/500** → Semakin tinggi semakin bagus!

---

## 🔧 Jenis Konflik & Solusi

### Konflik yang Auto Dideteksi:
1. **DOSEN_CONFLICT** - Dosen ngajar 2 kelas bersamaan
2. **RUANGAN_CONFLICT** - Ruangan dipakai 2 kelas bersamaan
3. **DOSEN_OVERLOAD** - Dosen kelebihan jam dalam 1 hari
4. **INVALID_TIME_SLOT** - Jadwal bentrok jam istirahat
5. **KAPASITAS_EXCEEDED** - Mahasiswa melebihi kapasitas ruangan

### Auto Suggestions:
```
Konflik: Dr. Budi bentrok Senin 08:00
─────────────────────────────────────
✅ Saran 1: Pindah ke Selasa 08:00 (Feasibility: 95%)
⚠️ Saran 2: Pindah ke Senin 13:00 (Feasibility: 80%)
❌ Saran 3: Ganti dosen (Feasibility: 60%)
─────────────────────────────────────
Klik "Apply" → Selesai!
```

---

## ⚙️ Priority Level Preferensi

- 🔴 **MANDATORY** → WAJIB dipenuhi (sistem error jika tidak bisa)
- 🟠 **HIGH** → Sangat diutamakan
- 🟢 **NORMAL** → Diusahakan
- 🔵 **LOW** → Opsional, bonus jika bisa

**Contoh:**
```
"Saya tidak bisa Jumat" → Set priority MANDATORY
"Saya lebih suka pagi" → Set priority NORMAL/HIGH
"Lebih baik Senin-Rabu" → Set priority LOW/NORMAL
```

---

## ❓ FAQ Kilat

**Q: Apakah dosen masih request manual?**  
A: Tidak. Sekarang cukup set preferensi 1x.

**Q: Berapa lama generate jadwal?**  
A: 5-10 detik untuk 1 kelas.

**Q: Bisa edit manual setelah generate?**  
A: Ya, bisa edit/tambah/hapus manual jika perlu.

**Q: Jadwal PAGI vs SORE?**  
A: PAGI (08:00-14:00), SORE (13:00-18:00). Generate terpisah!

**Q: Preferensi tidak dipenuhi, kenapa?**  
A: Tergantung priority. Set MANDATORY jika wajib dipenuhi.

---

## 📊 Alur Lengkap (Simplified)

```
SEMESTER BARU
     ↓
[DOSEN] Set preferensi (1x)
     ↓
[KAPRODI] Klik "Generate Jadwal"
     ↓
[SISTEM] Generate otomatis (10 detik)
     ↓
[KAPRODI] Review & perbaiki konflik
     ↓
[KAPRODI] Submit ke Sekjur
     ↓
[SEKJUR] Review & Approve
     ↓
JADWAL FINAL ✅
```

---

## 🎯 Keuntungan Sistem Baru

✅ **Cepat** - 10 detik vs berhari-hari  
✅ **Akurat** - Algoritma cek semua kemungkinan  
✅ **Mudah** - 1 klik generate  
✅ **Optimal** - Scoring system pilih jadwal terbaik  
✅ **No Drama** - Tidak perlu koordinasi bolak-balik  
✅ **Auto Detect** - Konflik langsung ketahuan + solusi  

---

## 📌 Catatan Penting

1. Dosen set preferensi **SEKALI** di awal semester
2. Kaprodi generate **PAGI & SORE TERPISAH**
3. Selalu **REVIEW** jadwal sebelum submit
4. Gunakan **AUTO SUGGESTIONS** untuk perbaiki konflik
5. Set priority **MANDATORY** hanya untuk yang wajib

---

**🚀 Singkatnya: Klik 1 tombol → Jadwal jadi → Submit → Selesai!**

---

**Version:** 1.0 (Quick Reference)  
**Untuk dokumentasi lengkap:** Baca `PANDUAN_PENJADWALAN.md`
