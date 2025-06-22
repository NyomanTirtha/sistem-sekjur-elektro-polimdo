/*
  Warnings:

  - Added the required column `nominal` to the `pengajuan_sa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `pengajuan_sa` ADD COLUMN `keteranganReject` VARCHAR(191) NULL,
    ADD COLUMN `nominal` DECIMAL(10, 2) NOT NULL,
    MODIFY `status` ENUM('PROSES_PENGAJUAN', 'MENUNGGU_VERIFIKASI_KAPRODI', 'DALAM_PROSES_SA', 'SELESAI', 'DITOLAK') NOT NULL DEFAULT 'PROSES_PENGAJUAN';
