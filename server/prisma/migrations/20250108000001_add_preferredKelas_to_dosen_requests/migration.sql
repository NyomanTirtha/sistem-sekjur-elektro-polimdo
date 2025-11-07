-- AlterTable: Tambahkan kolom preferredKelas ke dosen_schedule_requests
ALTER TABLE `dosen_schedule_requests` ADD COLUMN `preferredKelas` VARCHAR(191) NULL;

-- Tambahkan index untuk preferredKelas
CREATE INDEX `dosen_schedule_requests_preferredKelas_idx` ON `dosen_schedule_requests`(`preferredKelas`);

