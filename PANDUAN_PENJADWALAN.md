# 📅 Panduan Sistem Penjadwalan Otomatis

## 📋 Daftar Isi
- [Pengenalan](#pengenalan)
- [Perbedaan dengan Sistem Manual](#perbedaan-dengan-sistem-manual)
- [Fitur-Fitur Utama](#fitur-fitur-utama)
- [Cara Kerja Sistem](#cara-kerja-sistem)
- [Panduan Penggunaan](#panduan-penggunaan)
- [FAQ](#faq)

---

## 🎯 Pengenalan

Sistem Penjadwalan Otomatis adalah sistem yang dirancang untuk **menghasilkan jadwal perkuliahan secara otomatis** berdasarkan data yang ada (dosen, mata kuliah, ruangan) dan preferensi dosen.

### Tujuan Sistem:
- ✅ Mempercepat pembuatan jadwal (dari manual ➔ otomatis)
- ✅ Mengurangi konflik jadwal (bentrok dosen/ruangan)
- ✅ Menghormati preferensi dosen
- ✅ Menghasilkan jadwal yang lebih optimal

---

## 🔄 Perbedaan dengan Sistem Manual

### ❌ **SISTEM LAMA (Manual)**

```
┌─────────────────────────────────────────────────────────┐
│  KAPRODI                                                │
├─────────────────────────────────────────────────────────┤
│  1. Terima request dari dosen satu per satu             │
│  2. Review setiap request secara manual                 │
│  3. Approve/Reject request dosen                        │
│  4. Buat jadwal manual dengan input satu per satu       │
│  5. Cek konflik manual (dosen bentrok? ruangan penuh?)  │
│  6. Revisi berkali-kali jika ada konflik                │
│  7. Submit ke Sekjur untuk approval                     │
└─────────────────────────────────────────────────────────┘
```

**Masalah:**
- ⏰ Memakan waktu lama (bisa berhari-hari)
- 😫 Prone to human error
- 🔄 Revisi berkali-kali
- 📋 Banyak koordinasi bolak-balik dengan dosen
- 💢 Konflik sering ditemukan setelah jadwal dibuat

---

### ✅ **SISTEM BARU (Otomatis)**

```
┌─────────────────────────────────────────────────────────┐
│  DOSEN                                                  │
├─────────────────────────────────────────────────────────┤
│  1. Set preferensi sekali (hari favorit, waktu, dll)   │
│  2. Selesai! Tidak perlu request lagi                   │
└─────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────┐
│  KAPRODI                                                │
├─────────────────────────────────────────────────────────┤
│  1. Klik tombol "Generate Jadwal"                       │
│  2. Sistem otomatis buat jadwal terbaik                 │
│  3. Review jadwal yang sudah jadi                       │
│  4. (Opsional) Perbaiki konflik dengan 1 klik           │
│  5. Submit ke Sekjur                                    │
└─────────────────────────────────────────────────────────┘
```

**Keuntungan:**
- ⚡ Cepat (hitungan detik vs berhari-hari)
- 🎯 Akurat (algoritma cek semua kemungkinan)
- 🔄 No back-and-forth dengan dosen
- 🤖 Otomatis detect & kasih solusi konflik
- ✨ Preferensi dosen otomatis diterapkan

---

## 🚀 Fitur-Fitur Utama

### 1. **Enhanced Schedule Generator** 🤖

Fitur untuk generate jadwal otomatis dengan algoritma pintar.

**Cara Kerja:**
1. Sistem ambil data:
   - Mata kuliah yang perlu dijadwalkan
   - Dosen yang tersedia (dari penugasan mengajar)
   - Ruangan yang tersedia
   - Preferensi dosen

2. Sistem generate **5 kandidat jadwal** berbeda

3. Sistem nilai setiap kandidat berdasarkan 5 kriteria:
   - **Day Spread** (penyebaran hari) - Lebih baik jadwal tersebar, bukan menumpuk di 1-2 hari
   - **Gap** (jarak antar kelas) - Hindari gap terlalu lama (misal kelas jam 8-10, kosong, baru kelas lagi jam 3-5)
   - **Preference Bonus** - Kasih poin lebih jika sesuai preferensi dosen
   - **Overload** (beban dosen) - Hindari 1 dosen terlalu banyak jam dalam 1 hari
   - **Distribution** (distribusi ruangan) - Gunakan berbagai ruangan, jangan hanya 1-2 ruangan terus

4. Pilih jadwal dengan **skor tertinggi**

**Contoh Scoring:**

| Kandidat | Day Spread | Gap | Preference | Overload | Distribution | **Total** |
|----------|-----------|-----|------------|----------|--------------|-----------|
| Jadwal 1 | 85        | 70  | 90         | 75       | 80           | **400**   |
| Jadwal 2 | 90        | 85  | 80         | 85       | 90           | **430** ✅ |
| Jadwal 3 | 70        | 75  | 85         | 70       | 75           | **375**   |

→ Sistem pilih **Jadwal 2** karena skor tertinggi.

---

### 2. **Dosen Preference System** ⭐

Dosen bisa set preferensi mereka sekali, lalu otomatis diterapkan saat generate.

**Preferensi yang Bisa Diset:**

| Preferensi | Contoh | Keterangan |
|------------|--------|------------|
| **Hari Favorit** | Senin, Rabu | Hari yang disukai dosen |
| **Hari Dihindari** | Jumat | Hari yang ingin dihindari |
| **Waktu Preferensi** | PAGI / SORE / BOTH | Lebih suka ngajar pagi atau sore |
| **Max Days per Week** | 3 hari | Maksimal berapa hari dalam seminggu |
| **Unavailable Slots** | Selasa 08:00-10:00 | Waktu yang tidak bisa mengajar |
| **Priority Level** | MANDATORY / HIGH / NORMAL / LOW | Seberapa penting preferensi ini |

**Priority Level:**
- **MANDATORY** 🔴 - WAJIB dipenuhi (misal dosen ada tugas tetap hari Jumat)
- **HIGH** 🟠 - Sangat diutamakan
- **NORMAL** 🟢 - Diusahakan dipenuhi
- **LOW** 🔵 - Opsional, bonus jika bisa

**Contoh:**
```
Dosen: Dr. Budi
─────────────────────────────────────────────────
✅ Hari Favorit: Senin, Rabu (NORMAL)
❌ Hari Dihindari: Jumat (HIGH)
⏰ Waktu: PAGI (NORMAL)
📅 Max Days: 3 hari per minggu (HIGH)
🚫 Tidak Tersedia: Selasa 13:00-15:00 (MANDATORY)
─────────────────────────────────────────────────
Hasil: Sistem akan WAJIB hindari Selasa 13:00-15:00,
       usahakan tidak jadwal Jumat, dan coba kasih
       hari Senin/Rabu kalau bisa.
```

---

### 3. **Auto Conflict Resolution** 🔧

Sistem otomatis detect konflik dan kasih solusi.

**Jenis Konflik yang Dideteksi:**

1. **DOSEN_CONFLICT** 👨‍🏫
   ```
   Problem: Dr. Budi dijadwalkan mengajar 2 mata kuliah di waktu bersamaan
   Contoh: Senin 08:00-10:00 → Algoritma & Basis Data (bentrok!)
   ```

2. **RUANGAN_CONFLICT** 🏫
   ```
   Problem: Ruangan Lab 1 dipakai untuk 2 kelas di waktu bersamaan
   Contoh: Senin 08:00-10:00 → Kelas A & Kelas B di Lab 1 (bentrok!)
   ```

3. **DOSEN_OVERLOAD** 😰
   ```
   Problem: Dosen mengajar terlalu banyak jam dalam 1 hari
   Contoh: Dr. Budi mengajar 10 jam dalam 1 hari (kelebihan beban!)
   ```

4. **INVALID_TIME_SLOT** ⏰
   ```
   Problem: Jadwal bentrok dengan jam istirahat
   Contoh: Kelas mulai 11:00 selesai 13:00 (lewat jam istirahat 12:00-13:00)
   ```

5. **KAPASITAS_EXCEEDED** 👥
   ```
   Problem: Mahasiswa lebih banyak dari kapasitas ruangan
   Contoh: 50 mahasiswa masuk ruangan kapasitas 40 (overcapacity!)
   ```

**Auto Suggestions:**

Untuk setiap konflik, sistem kasih 3-5 solusi dengan skor kelayakan.

**Contoh:**

```
Konflik: Dr. Budi bentrok Senin 08:00-10:00
─────────────────────────────────────────────────────────────
Saran 1: Pindah ke Selasa 08:00-10:00
         Impact: Low | Feasibility: 95% ✅ RECOMMENDED

Saran 2: Pindah ke Senin 13:00-15:00
         Impact: Medium | Feasibility: 80%

Saran 3: Ganti dosen dengan Dr. Ahmad
         Impact: High | Feasibility: 60%
─────────────────────────────────────────────────────────────
Klik "Apply" → Konflik selesai dalam 1 klik!
```

---

### 4. **Batch Processing** (Future Use) 📦

Fitur untuk approve/reject banyak request sekaligus.

**Note:** Fitur ini masih ada di sistem tapi kemungkinan tidak akan dipakai lagi karena sudah tidak ada request manual dari dosen.

---

## ⚙️ Cara Kerja Sistem

### 🎭 **Role: Dosen**

```
┌─────────────────────────────────────────────┐
│  1. LOGIN sebagai Dosen                     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  2. Masuk Menu "Preferensi Jadwal"          │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  3. Set Preferensi:                         │
│     • Hari favorit: Senin, Rabu             │
│     • Hari dihindari: Jumat                 │
│     • Waktu: PAGI                           │
│     • Max days: 3 hari per minggu           │
│     • Priority: HIGH/MANDATORY untuk        │
│       preferensi penting                    │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  4. SIMPAN                                  │
│     ✅ Preferensi tersimpan di database     │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  5. Selesai!                                │
│     Tunggu Kaprodi generate jadwal          │
└─────────────────────────────────────────────┘
```

**Catatan untuk Dosen:**
- ✅ Cukup set preferensi **SEKALI** di awal semester
- ✅ Bisa update kapan saja kalau ada perubahan
- ✅ Tidak perlu request jadwal manual lagi
- ✅ Lihat jadwal final di menu "Jadwal Saya"

---

### 👑 **Role: Kaprodi**

```
┌─────────────────────────────────────────────┐
│  1. LOGIN sebagai Kaprodi                   │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  2. Masuk Menu "Kelola Jadwal"              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  3. Klik "Generate Jadwal"                  │
│     • Pilih Periode (Semester & Tahun)      │
│     • Pilih Kelas (contoh: 4ti1)            │
│     • Pilih Jenis: PAGI / SORE              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  4. Sistem Bekerja... (5-10 detik)          │
│     🤖 Generate 5 kandidat jadwal           │
│     🎯 Scoring setiap kandidat              │
│     ⭐ Pilih jadwal terbaik                 │
│     ✅ Apply preferensi dosen               │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  5. Jadwal Selesai Dibuat!                  │
│     • Lihat detail jadwal                   │
│     • Cek grid view (tabel per hari/jam)    │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  6. Cek Konflik (jika ada)                  │
│     ⚠️ Sistem auto detect konflik           │
│     💡 Lihat suggestions                    │
│     ✅ Klik "Apply" untuk perbaiki          │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  7. Submit Jadwal ke Sekjur                 │
│     📤 Jadwal masuk antrian approval        │
└─────────────────────────────────────────────┘
```

**Tips untuk Kaprodi:**
- 💡 Generate jadwal **PAGI** dan **SORE** terpisah untuk hasil lebih optimal
- 🔍 Selalu review jadwal sebelum submit
- ⚠️ Perbaiki konflik dengan suggestions 1 klik
- 📊 Perhatikan scoring untuk tahu kualitas jadwal

---

### 🛡️ **Role: Sekretaris Jurusan**

```
┌─────────────────────────────────────────────┐
│  1. LOGIN sebagai Sekjur                    │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  2. Masuk Menu "Review Jadwal"              │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  3. Lihat Jadwal yang Disubmit Kaprodi      │
│     • Review detail jadwal                  │
│     • Cek grid view                         │
│     • Pastikan tidak ada konflik            │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│  4. Approve / Reject                        │
│     ✅ APPROVE → Jadwal final, publish      │
│     ❌ REJECT → Kaprodi revisi              │
└─────────────────────────────────────────────┘
```

---

## 📖 Panduan Penggunaan

### Untuk Dosen: Set Preferensi

1. **Login** → Dashboard Dosen
2. Klik menu **"Preferensi Jadwal"** atau **"Jadwal Saya"**
3. Klik tombol **"Tambah Preferensi"** atau **"Edit Preferensi"**
4. Isi form preferensi:
   ```
   Hari Favorit: [Pilih hari-hari yang disukai]
   Hari Dihindari: [Pilih hari-hari yang dihindari]
   Waktu Preferensi: [PAGI / SORE / BOTH]
   Max Days per Week: [1-6 hari]
   Priority: [LOW / NORMAL / HIGH / MANDATORY]
   ```
5. **Simpan**
6. ✅ Selesai! Preferensi akan otomatis diterapkan saat Kaprodi generate jadwal

---

### Untuk Kaprodi: Generate Jadwal

1. **Login** → Dashboard Kaprodi
2. Klik menu **"Kelola Jadwal"**
3. Klik tombol **"Generate Jadwal"** (dengan icon ✨)
4. Isi form:
   ```
   Periode: [Pilih semester & tahun akademik]
   Kelas: [Ketik kelas, contoh: 4ti1]
   Jenis Jadwal: [PAGI / SORE]
   ```
5. Klik **"Generate"**
6. Tunggu 5-10 detik
7. ✅ Jadwal otomatis terbuat!
8. Review jadwal:
   - Klik **"Lihat Detail"** untuk melihat semua mata kuliah
   - Klik **"Grid View"** untuk melihat tabel jadwal
9. Jika ada konflik:
   - Sistem akan show warning ⚠️
   - Klik **"Lihat Konflik"**
   - Pilih suggestion terbaik
   - Klik **"Apply"**
10. Setelah OK, klik **"Submit ke Sekjur"**

---

### Untuk Sekjur: Review & Approve

1. **Login** → Dashboard Sekjur
2. Klik menu **"Review Jadwal"** atau **"Kelola Jadwal"**
3. Lihat jadwal yang status **"SUBMITTED"**
4. Klik **"Review"** atau **"Detail"**
5. Periksa:
   - ✅ Tidak ada konflik
   - ✅ Penyebaran jadwal baik
   - ✅ Sesuai dengan aturan akademik
6. Klik **"Approve"** jika OK
7. Atau **"Reject"** jika ada masalah (beri catatan)

---

## ❓ FAQ (Frequently Asked Questions)

### Q1: Apakah dosen masih bisa request jadwal manual?
**A:** Tidak lagi. Sistem baru fokus pada **preferensi dosen** yang otomatis diterapkan saat generate. Ini lebih efisien dan mengurangi koordinasi bolak-balik.

---

### Q2: Bagaimana jika preferensi saya tidak bisa dipenuhi?
**A:** 
- Jika priority **MANDATORY** → Sistem WAJIB penuhi, kalau tidak bisa, jadwal tidak akan dibuat
- Jika priority **HIGH** → Sistem usahakan maksimal
- Jika priority **NORMAL/LOW** → Sistem coba terapkan, tapi tidak wajib

Saran: Set **MANDATORY** hanya untuk preferensi yang benar-benar tidak bisa ditawar (misal bentrok dengan tugas lain).

---

### Q3: Berapa lama proses generate jadwal?
**A:** 5-10 detik untuk 1 kelas. Sistem akan:
- Generate 5 kandidat jadwal
- Score masing-masing
- Pilih yang terbaik

---

### Q4: Apa bedanya jadwal PAGI dan SORE?
**A:** 
- **PAGI**: Jadwal mulai pagi sampai siang (08:00 - 14:00)
- **SORE**: Jadwal mulai siang sampai sore (13:00 - 18:00)

💡 **Tips:** Generate PAGI dan SORE secara terpisah untuk hasil lebih optimal.

---

### Q5: Apakah jadwal yang sudah digenerate bisa diedit manual?
**A:** Ya! Kaprodi bisa:
- Edit jadwal satu per satu (ubah waktu, ruangan, dosen)
- Tambah jadwal baru manual
- Hapus jadwal yang tidak diinginkan

Tapi kalau mau lebih cepat, gunakan **Auto Conflict Resolution** untuk perbaiki konflik dengan 1 klik.

---

### Q6: Bagaimana sistem tahu dosen mana yang available?
**A:** Sistem ambil data dari **Penugasan Mengajar** yang statusnya **ACTIVE**. Jadi pastikan:
1. Kaprodi sudah assign dosen ke mata kuliah
2. Status penugasan = ACTIVE
3. Data dosen, mata kuliah, dan ruangan lengkap

---

### Q7: Apakah bisa generate jadwal untuk semua kelas sekaligus?
**A:** Saat ini generate per kelas (misal 4ti1, 4ti2, dst). Ini untuk optimasi hasil yang lebih baik. Future enhancement bisa ditambahkan batch generate untuk semua kelas.

---

### Q8: Bagaimana jika ada konflik yang tidak bisa diselesaikan otomatis?
**A:** 
1. Sistem akan kasih suggestions
2. Jika tidak ada suggestion yang feasible, edit manual:
   - Ubah waktu/hari
   - Ubah ruangan
   - Ubah dosen
3. Atau regenerate jadwal dengan parameter berbeda

---

### Q9: Apakah data preferensi dosen bisa dilihat Kaprodi?
**A:** Ya, Kaprodi bisa lihat preferensi semua dosen untuk referensi saat review jadwal.

---

### Q10: Apa yang harus dilakukan dosen jika jadwal final tidak sesuai preferensi?
**A:** 
1. Hubungi Kaprodi untuk diskusi
2. Kaprodi bisa edit manual atau regenerate
3. Update preferensi untuk semester depan agar lebih akurat

---

## 🎯 Ringkasan Perbedaan

| Aspek | Sistem Lama | Sistem Baru |
|-------|-------------|-------------|
| **Input Jadwal** | Manual satu per satu | Otomatis (1 klik generate) |
| **Request Dosen** | Dosen request → Kaprodi approve/reject | Dosen set preferensi → Auto apply |
| **Deteksi Konflik** | Manual, saat review | Auto detect + kasih solusi |
| **Waktu Pembuatan** | Berhari-hari | 5-10 detik |
| **Koordinasi** | Banyak bolak-balik | Minimal (preferensi sekali) |
| **Optimasi** | Tergantung manual effort | Algoritma scoring otomatis |
| **Error Prone** | Tinggi (human error) | Rendah (sistem validasi) |

---

## 📞 Butuh Bantuan?

- 📖 Baca dokumentasi ini dengan teliti
- 🎥 Minta demo dari tim developer
- 💬 Diskusi dengan Kaprodi/admin sistem
- 🐛 Laporkan bug/issue ke tim IT

---

**Version:** 1.0  
**Last Updated:** 2024  
**Maintainer:** Tim Pengembang Sistem SA

---

**🚀 Selamat menggunakan Sistem Penjadwalan Otomatis!**