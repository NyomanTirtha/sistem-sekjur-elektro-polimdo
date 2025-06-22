/*
  Warnings:

  - You are about to drop the column `jurusanId` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `jurusanId` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `dosenId` on the `pengajuan_sa` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiAkhir` on the `pengajuan_sa` table. All the data in the column will be lost.
  - You are about to drop the column `jurusanId` on the `program_studi` table. All the data in the column will be lost.
  - You are about to drop the `jurusan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `dosen` DROP FOREIGN KEY `dosen_jurusanId_fkey`;

-- DropForeignKey
ALTER TABLE `mahasiswa` DROP FOREIGN KEY `mahasiswa_jurusanId_fkey`;

-- DropForeignKey
ALTER TABLE `pengajuan_sa` DROP FOREIGN KEY `pengajuan_sa_dosenId_fkey`;

-- DropForeignKey
ALTER TABLE `program_studi` DROP FOREIGN KEY `program_studi_jurusanId_fkey`;

-- AlterTable
ALTER TABLE `dosen` DROP COLUMN `jurusanId`;

-- AlterTable
ALTER TABLE `mahasiswa` DROP COLUMN `jurusanId`;

-- AlterTable
ALTER TABLE `pengajuan_sa` DROP COLUMN `dosenId`,
    DROP COLUMN `nilaiAkhir`,
    MODIFY `status` ENUM('PROSES_PENGAJUAN', 'MENUNGGU_VERIFIKASI_KAPRODI', 'DALAM_PROSES_SA', 'SELESAI') NOT NULL DEFAULT 'PROSES_PENGAJUAN';

-- AlterTable
ALTER TABLE `program_studi` DROP COLUMN `jurusanId`;

-- DropTable
DROP TABLE `jurusan`;

-- CreateTable
CREATE TABLE `mata_kuliah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `sks` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengajuan_sa_detail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pengajuanSAId` INTEGER NOT NULL,
    `mataKuliahId` INTEGER NOT NULL,
    `dosenId` VARCHAR(191) NULL,
    `nilaiAkhir` DOUBLE NULL,
    `keterangan` VARCHAR(191) NULL,

    INDEX `pengajuan_sa_detail_pengajuanSAId_fkey`(`pengajuanSAId`),
    INDEX `pengajuan_sa_detail_mataKuliahId_fkey`(`mataKuliahId`),
    INDEX `pengajuan_sa_detail_dosenId_fkey`(`dosenId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_pengajuanSAId_fkey` FOREIGN KEY (`pengajuanSAId`) REFERENCES `pengajuan_sa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE;
