-- CreateTable
CREATE TABLE `jurusan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `ketuaJurusan` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_studi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `ketuaProdi` VARCHAR(191) NOT NULL,
    `jurusanId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `jurusanId` INTEGER NOT NULL,
    `programStudiId` INTEGER NOT NULL,
    `angkatan` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `noTelp` VARCHAR(191) NOT NULL,
    `alamat` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`nim`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen` (
    `nip` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `prodiId` INTEGER NOT NULL,
    `jurusanId` INTEGER NOT NULL,
    `noTelp` VARCHAR(191) NULL,
    `alamat` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`nip`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_sa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mahasiswaId` VARCHAR(191) NOT NULL,
    `dosenId` VARCHAR(191) NULL,
    `buktiPembayaran` VARCHAR(191) NOT NULL,
    `tanggalPengajuan` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PROSES_PENGAJUAN', 'DALAM_PROSES_SA', 'SELESAI') NOT NULL DEFAULT 'PROSES_PENGAJUAN',
    `nilaiAkhir` DOUBLE NULL,
    `keterangan` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_studi` ADD CONSTRAINT `program_studi_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_prodiId_fkey` FOREIGN KEY (`prodiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa` ADD CONSTRAINT `pengajuan_sa_mahasiswaId_fkey` FOREIGN KEY (`mahasiswaId`) REFERENCES `mahasiswa`(`nim`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa` ADD CONSTRAINT `pengajuan_sa_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE;
