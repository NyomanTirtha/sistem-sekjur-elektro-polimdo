# Sistem Sekjur Teknik Elektro - Polimdo

Aplikasi web untuk mendukung proses pengelolaan administrasi dan pengajuan surat di Sekretariat Jurusan Teknik Elektro Politeknik Negeri Manado. Sistem ini mencakup fitur pengajuan semester antara serta manajemen data mahasiswa, dosen, dan akun pengguna.

## 📌 Fitur Utama

- ✉️ **Pengajuan Semester Antara** oleh mahasiswa
- 👨‍🏫 Manajemen data **dosen**, **mahasiswa**, dan **program studi**
- 🔐 Sistem login dan manajemen akun **admin**, **kaprodi**, dan **pengguna lainnya**
- 🧑‍💼 Pembuatan dan pengelolaan **akun pengguna**
- 🔍 Pencarian dan filter data

## 🛠️ Teknologi yang Digunakan

### Frontend
- React.js
- Axios
- React Router DOM
- Tailwind CSS (jika digunakan)

### Backend
- Node.js
- Express.js
- Prisma ORM
- MySQL (database)

## 🚀 Cara Menjalankan Proyek

### 1. Jalankan Backend
```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```
### 2. Jalankan Frontend
```bash
cd client
npm install
npm start
```

Pastikan backend dan frontend berjalan pada port yang sesuai (localhost:5000 dan localhost:3000 misalnya), dan koneksi database MySQL sudah dikonfigurasi pada .env.

## 📧 Kontak
**Pengembang:**
- I Nyoman Tirtha Yuda  
- Edi  
- Ariel Arya Putra  
- Mohammad Agil Saputra Kantu  
- Wilsaylin Tahupia  
- Iron Tabuni  
- Fathan Masloman

Jurusan Teknik Elektro, Program Studi Teknik Informatika, Politeknik Negeri Manado
