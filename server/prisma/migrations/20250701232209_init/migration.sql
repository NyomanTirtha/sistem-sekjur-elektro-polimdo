-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'MAHASISWA', 'DOSEN', 'KAPRODI') NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_studi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `ketuaProdi` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `programStudiId` INTEGER NOT NULL,
    `angkatan` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `noTelp` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,

    INDEX `mahasiswa_programStudiId_fkey`(`programStudiId`),
    PRIMARY KEY (`nim`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen` (
    `nip` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `prodiId` INTEGER NOT NULL,
    `noTelp` VARCHAR(191) NULL,
    `alamat` VARCHAR(191) NULL,
    `isKaprodi` BOOLEAN NOT NULL DEFAULT false,

    INDEX `dosen_prodiId_fkey`(`prodiId`),
    PRIMARY KEY (`nip`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mata_kuliah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `sks` INTEGER NOT NULL,
    `semester` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_sa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mahasiswaId` VARCHAR(191) NOT NULL,
    `buktiPembayaran` VARCHAR(191) NOT NULL,
    `tanggalPengajuan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `semesterPengajuan` INTEGER NOT NULL,
    `status` ENUM('PROSES_PENGAJUAN', 'MENUNGGU_VERIFIKASI_KAPRODI', 'DALAM_PROSES_SA', 'SELESAI', 'DITOLAK') NOT NULL DEFAULT 'PROSES_PENGAJUAN',
    `keterangan` VARCHAR(191) NULL,
    `keteranganReject` VARCHAR(191) NULL,
    `nominal` DECIMAL(10, 2) NOT NULL,

    INDEX `pengajuan_sa_mahasiswaId_fkey`(`mahasiswaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_sa_detail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pengajuanSAId` INTEGER NOT NULL,
    `mataKuliahId` INTEGER NOT NULL,
    `dosenId` VARCHAR(191) NULL,
    `nilaiAkhir` DOUBLE NULL,

    INDEX `pengajuan_sa_detail_pengajuanSAId_fkey`(`pengajuanSAId`),
    INDEX `pengajuan_sa_detail_mataKuliahId_fkey`(`mataKuliahId`),
    INDEX `pengajuan_sa_detail_dosenId_fkey`(`dosenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_prodiId_fkey` FOREIGN KEY (`prodiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa` ADD CONSTRAINT `pengajuan_sa_mahasiswaId_fkey` FOREIGN KEY (`mahasiswaId`) REFERENCES `mahasiswa`(`nim`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_pengajuanSAId_fkey` FOREIGN KEY (`pengajuanSAId`) REFERENCES `pengajuan_sa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
