-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 11, 2025 at 03:19 AM
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
-- Database: `p3m_polimdo`
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
  `alamat` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `dosen`
--

INSERT INTO `dosen` (`nip`, `nama`, `prodiId`, `jurusanId`, `noTelp`, `alamat`) VALUES
('198105172022031002', 'Maksy Sendiang, SST, MIT', 4, 3, '0812-3456-7890', 'Jl. Lorem Ipsum No. 123, Kel. Dolor Sit, Kec. Amet, Kota Consectetur, Provinsi Adipiscing');

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
(3, 'Teknik Elektro', 'Marson James Budiman, SST., MT.');

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
('22024000', 'Dimas Ardiansyah', 3, 4, '2022', 6, '0896-7890-1234', 'Perumahan Elit Lorem Blok A2 No. 45, Desa Tempor Incididunt, Kec. Ut Labore, Kab. Magna, Provinsi Aliqua');

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
  `status` enum('PROSES_PENGAJUAN','DALAM_PROSES_SA','SELESAI') NOT NULL DEFAULT 'PROSES_PENGAJUAN',
  `nilaiAkhir` double DEFAULT NULL,
  `keterangan` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengajuan_sa`
--

INSERT INTO `pengajuan_sa` (`id`, `mahasiswaId`, `dosenId`, `buktiPembayaran`, `tanggalPengajuan`, `status`, `nilaiAkhir`, `keterangan`) VALUES
(1, '22024000', '198105172022031002', '1749603779816-Bukti Pembayaran.jpeg', '2025-06-11 01:02:59.828', 'SELESAI', 90, 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.');

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
(4, 'Teknik Informatika', 'Harson Kapoh, ST.,MT.', 3);

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
('57d06172-b530-4a35-87bb-e8730e7e6b2d', '27525c17411a9357513291a33320c6d97a388c47195dd01d903c6edf78c564e8', '2025-06-02 06:07:47.708', '20250602060747_init', NULL, NULL, '2025-06-02 06:07:47.696', 1),
('5d0027fd-ac00-4ed7-8320-536498f2ec2e', '5424414bdebb271d48d33d2952b9bde3cbc57e3e9a07c6fdf5c4e4da65d073d9', '2025-06-02 06:07:47.175', '20250526104207_init', NULL, NULL, '2025-06-02 06:07:46.968', 1);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `program_studi`
--
ALTER TABLE `program_studi`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

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
