-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3307
-- Generation Time: Jun 12, 2025 at 09:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sekjur`
--

-- --------------------------------------------------------

--
-- Table structure for table `dosen`
--

CREATE TABLE `dosen` (
  `nip` varchar(191) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `prodiId` int(11) NOT NULL,
  `jurusanId` int(11) NOT NULL,
  `noTelp` varchar(191) DEFAULT NULL,
  `alamat` varchar(191) DEFAULT NULL,
  `isKaprodi` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dosen`
--

INSERT INTO `dosen` (`nip`, `nama`, `prodiId`, `jurusanId`, `noTelp`, `alamat`, `isKaprodi`) VALUES
('198501012010011001', 'Dr. Andi Pratama, M.Kom', 1, 1, '081234567801', 'Jl. Merdeka No. 1, Jakarta', 1),
('198502022010012002', 'Dr. Nina Sari, M.T', 2, 2, '081234567802', 'Jl. Sudirman No. 2, Jakarta', 1),
('198503032010013003', 'Dr. Rudi Hermawan, M.Eng', 3, 3, '081234567803', 'Jl. Thamrin No. 3, Jakarta', 1),
('198504042010014004', 'Ir. Dewi Kusuma, M.Kom', 4, 1, '081234567804', 'Jl. Gatot Subroto No. 4, Jakarta', 1),
('198505052010015005', 'Prof. Budi Santoso, Ph.D', 1, 1, '081234567805', 'Jl. Kuningan No. 5, Jakarta', 0);

-- --------------------------------------------------------

--
-- Table structure for table `jurusan`
--

CREATE TABLE `jurusan` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `ketuaJurusan` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jurusan`
--

INSERT INTO `jurusan` (`id`, `nama`, `ketuaJurusan`) VALUES
(1, 'Teknik Informatika', 'Dr. Ahmad Sutrisno, M.Kom'),
(2, 'Sistem Informasi', 'Dr. Sari Wulandari, M.T'),
(3, 'Teknik Komputer', 'Prof. Budi Santoso, Ph.D');

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa`
--

CREATE TABLE `mahasiswa` (
  `nim` varchar(191) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `jurusanId` int(11) NOT NULL,
  `programStudiId` int(11) NOT NULL,
  `angkatan` varchar(191) NOT NULL,
  `semester` int(11) NOT NULL,
  `noTelp` varchar(191) NOT NULL,
  `alamat` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `mahasiswa`
--

INSERT INTO `mahasiswa` (`nim`, `nama`, `jurusanId`, `programStudiId`, `angkatan`, `semester`, `noTelp`, `alamat`) VALUES
('2021001', 'Ahmad Rizki Pratama', 1, 1, '2021', 7, '081234567001', 'Jl. Kebon Jeruk No. 1, Jakarta'),
('2021002', 'Sari Dewi Lestari', 1, 1, '2021', 7, '081234567002', 'Jl. Cempaka Putih No. 2, Jakarta'),
('2021003', 'Budi Setiawan', 2, 2, '2021', 7, '081234567003', 'Jl. Pasar Minggu No. 3, Jakarta'),
('2021004', 'Rina Kartika Sari', 2, 2, '2021', 7, '081234567004', 'Jl. Kalimalang No. 4, Jakarta'),
('2021005', 'Doni Prasetyo', 3, 3, '2021', 7, '081234567005', 'Jl. Raya Bogor No. 5, Jakarta'),
('2022001', 'Maya Sari Indah', 1, 1, '2022', 5, '081234567006', 'Jl. Pancoran No. 6, Jakarta'),
('2022002', 'Eko Wahyudi', 1, 4, '2022', 5, '081234567007', 'Jl. Tebet No. 7, Jakarta'),
('2022003', 'Fitri Handayani', 2, 2, '2022', 5, '081234567008', 'Jl. Menteng No. 8, Jakarta'),
('2023001', 'Arif Rahman Hakim', 1, 1, '2023', 3, '081234567009', 'Jl. Kemang No. 9, Jakarta'),
('2023002', 'Lina Marlina', 3, 3, '2023', 3, '081234567010', 'Jl. Senayan No. 10, Jakarta'),
('22024103', 'I Nyoman Tirtha Yuda', 1, 1, '2022', 6, '085157637227', 'Singkil, Manado'),
('22024169', 'Edi', 1, 1, '2022', 6, '080889384903', 'Manado');

-- --------------------------------------------------------

--
-- Table structure for table `pengajuan_sa`
--

CREATE TABLE `pengajuan_sa` (
  `id` int(11) NOT NULL,
  `mahasiswaId` varchar(191) NOT NULL,
  `dosenId` varchar(191) DEFAULT NULL,
  `buktiPembayaran` varchar(191) NOT NULL,
  `tanggalPengajuan` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `mataKuliah` varchar(191) DEFAULT NULL,
  `status` enum('PROSES_PENGAJUAN','DALAM_PROSES_SA','SELESAI') NOT NULL DEFAULT 'PROSES_PENGAJUAN',
  `nilaiAkhir` double DEFAULT NULL,
  `keterangan` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengajuan_sa`
--

INSERT INTO `pengajuan_sa` (`id`, `mahasiswaId`, `dosenId`, `buktiPembayaran`, `tanggalPengajuan`, `mataKuliah`, `status`, `nilaiAkhir`, `keterangan`) VALUES
(1, '2021001', '198501012010011001', 'bukti_pembayaran_2021001.pdf', '2025-06-12 03:38:06.696', NULL, 'DALAM_PROSES_SA', NULL, 'Pengajuan SA untuk semester 7'),
(2, '2021003', '198502022010012002', 'bukti_pembayaran_2021003.pdf', '2025-06-12 03:38:06.696', NULL, 'SELESAI', 85.5, 'SA selesai dengan baik'),
(3, '2022001', NULL, 'bukti_pembayaran_2022001.pdf', '2025-06-12 03:38:06.696', NULL, 'PROSES_PENGAJUAN', NULL, 'Menunggu persetujuan kaprodi'),
(4, '2021002', '198501012010011001', 'bukti_pembayaran_2021002.pdf', '2025-06-12 03:38:06.696', NULL, 'DALAM_PROSES_SA', NULL, 'Sedang mengerjakan tugas akhir'),
(5, '2021004', '198501012010011001', '1749700973000-messi.jpeg', '2025-06-12 04:02:53.007', NULL, 'SELESAI', 75, 'Pemrograman Web - Perbaikan nilai'),
(6, '22024103', NULL, '1749704976966-messi.jpeg', '2025-06-12 05:09:36.973', NULL, 'PROSES_PENGAJUAN', NULL, 'Pengajuan SA'),
(7, '22024103', '198501012010011001', '1749705250614-messi.jpeg', '2025-06-12 05:14:10.618', 'Pemrograman Web', 'DALAM_PROSES_SA', NULL, 'Nilai D'),
(8, '22024103', '198502022010012002', '1749708075873-messi.jpeg', '2025-06-12 06:01:15.891', NULL, 'SELESAI', 100, 'Pengajuan SA'),
(9, '22024169', NULL, '1749712338774-messi.jpeg', '2025-06-12 07:12:18.778', 'Basis Data', 'DALAM_PROSES_SA', NULL, 'Nilai kurang'),
(10, '22024103', '198504042010014004', '1749713239476-messi.jpeg', '2025-06-12 07:27:19.480', 'Pemrograman Web', 'SELESAI', 90, 'Nilai C, ingin memperbaiki nilai');

-- --------------------------------------------------------

--
-- Table structure for table `program_studi`
--

CREATE TABLE `program_studi` (
  `id` int(11) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `ketuaProdi` varchar(191) NOT NULL,
  `jurusanId` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `program_studi`
--

INSERT INTO `program_studi` (`id`, `nama`, `ketuaProdi`, `jurusanId`) VALUES
(1, 'S1 Teknik Informatika', 'Dr. Andi Pratama, M.Kom', 1),
(2, 'S1 Sistem Informasi', 'Dr. Nina Sari, M.T', 2),
(3, 'S1 Teknik Komputer', 'Dr. Rudi Hermawan, M.Eng', 3),
(4, 'D3 Teknik Informatika', 'Ir. Dewi Kusuma, M.Kom', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(191) NOT NULL,
  `nama` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('ADMIN','MAHASISWA','DOSEN','KAPRODI') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `nama`, `password`, `role`) VALUES
(1, 'admin', 'Administrator', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'ADMIN'),
(2, '198501012010011001', 'Dr. Andi Pratama, M.Kom', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'DOSEN'),
(3, '198502022010012002', 'Dr. Nina Sari, M.T', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'DOSEN'),
(4, '198503032010013003', 'Dr. Rudi Hermawan, M.Eng', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'DOSEN'),
(5, '198504042010014004', 'Ir. Dewi Kusuma, M.Kom', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'DOSEN'),
(6, '198505052010015005', 'Prof. Budi Santoso, Ph.D', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'KAPRODI'),
(7, '2021001', 'Ahmad Rizki Pratama', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(8, '2021002', 'Sari Dewi Lestari', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(9, '2021003', 'Budi Setiawan', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(10, '2021004', 'Rina Kartika Sari', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(11, '2021005', 'Doni Prasetyo', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(12, '2022001', 'Maya Sari Indah', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(13, '2022002', 'Eko Wahyudi', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(14, '2022003', 'Fitri Handayani', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(15, '2023001', 'Arif Rahman Hakim', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(16, '2023002', 'Lina Marlina', '$2b$10$iyKBrmAOLvLP3L23l41hDOZOwILV2bjlegqvZ4SKY7MtFtpEtUNr6', 'MAHASISWA'),
(17, '22024103', 'I Nyoman Tirtha Yuda', '$2b$10$UFBap54qiH87UM9ZEuBEluXCw8SWnxzFscA5wygpf2UJuXNZQze4i', 'MAHASISWA'),
(18, '22024169', 'Edi', '$2b$10$jvYWa4TWOQeC1eUHs2AJ4OG3QhK3QEXjW0/9Tp1KER2/Ut8XXJxyW', 'MAHASISWA');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('141a4ae9-5384-49c6-9a06-db917eb51d25', '040bbeffed9dfa8147adef6a18e665a5c58d019fff71a459027d2aede7df770b', '2025-06-12 03:01:21.647', '20250612030121_init', NULL, NULL, '2025-06-12 03:01:21.625', 1),
('960e9715-8f0a-4150-9ba4-437dbf7fb110', '27525c17411a9357513291a33320c6d97a388c47195dd01d903c6edf78c564e8', '2025-06-12 03:01:21.076', '20250602060747_init', NULL, NULL, '2025-06-12 03:01:21.063', 1),
('b5c2f67a-d6de-4810-9da3-6eb1f2b73c44', '5424414bdebb271d48d33d2952b9bde3cbc57e3e9a07c6fdf5c4e4da65d073d9', '2025-06-12 03:01:21.062', '20250526104207_init', NULL, NULL, '2025-06-12 03:01:20.828', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `dosen`
--
ALTER TABLE `dosen`
  ADD PRIMARY KEY (`nip`),
  ADD KEY `dosen_prodiId_fkey` (`prodiId`),
  ADD KEY `dosen_jurusanId_fkey` (`jurusanId`);

--
-- Indexes for table `jurusan`
--
ALTER TABLE `jurusan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD PRIMARY KEY (`nim`),
  ADD KEY `mahasiswa_jurusanId_fkey` (`jurusanId`),
  ADD KEY `mahasiswa_programStudiId_fkey` (`programStudiId`);

--
-- Indexes for table `pengajuan_sa`
--
ALTER TABLE `pengajuan_sa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pengajuan_sa_mahasiswaId_fkey` (`mahasiswaId`),
  ADD KEY `pengajuan_sa_dosenId_fkey` (`dosenId`);

--
-- Indexes for table `program_studi`
--
ALTER TABLE `program_studi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `program_studi_jurusanId_fkey` (`jurusanId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_key` (`username`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `jurusan`
--
ALTER TABLE `jurusan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pengajuan_sa`
--
ALTER TABLE `pengajuan_sa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `program_studi`
--
ALTER TABLE `program_studi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `dosen`
--
ALTER TABLE `dosen`
  ADD CONSTRAINT `dosen_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `dosen_prodiId_fkey` FOREIGN KEY (`prodiId`) REFERENCES `program_studi` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD CONSTRAINT `mahasiswa_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `mahasiswa_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `pengajuan_sa`
--
ALTER TABLE `pengajuan_sa`
  ADD CONSTRAINT `pengajuan_sa_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen` (`nip`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `pengajuan_sa_mahasiswaId_fkey` FOREIGN KEY (`mahasiswaId`) REFERENCES `mahasiswa` (`nim`) ON UPDATE CASCADE;

--
-- Constraints for table `program_studi`
--
ALTER TABLE `program_studi`
  ADD CONSTRAINT `program_studi_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
