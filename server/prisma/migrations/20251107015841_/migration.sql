-- AlterTable
ALTER TABLE `users` ADD COLUMN `programStudiId` INTEGER NULL;

-- CreateTable
CREATE TABLE `timetable_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `semester` ENUM('GANJIL', 'GENAP', 'ANTARA') NOT NULL,
    `tahunAkademik` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `createdBySekjur` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `timetable_periods_semester_tahunAkademik_key`(`semester`, `tahunAkademik`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ruangan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `kapasitas` INTEGER NOT NULL,
    `fasilitas` VARCHAR(191) NULL,
    `lokasi` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ruangan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prodi_schedules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timetablePeriodId` INTEGER NOT NULL,
    `prodiId` INTEGER NOT NULL,
    `kaprodiId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `sekjurNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prodi_schedules_prodiId_idx`(`prodiId`),
    INDEX `prodi_schedules_status_idx`(`status`),
    UNIQUE INDEX `prodi_schedules_timetablePeriodId_prodiId_key`(`timetablePeriodId`, `prodiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prodiScheduleId` INTEGER NOT NULL,
    `mataKuliahId` INTEGER NOT NULL,
    `dosenId` VARCHAR(191) NOT NULL,
    `hari` ENUM('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU') NOT NULL,
    `jamMulai` VARCHAR(191) NOT NULL,
    `jamSelesai` VARCHAR(191) NOT NULL,
    `ruanganId` INTEGER NOT NULL,
    `kelas` VARCHAR(191) NULL,
    `kapasitasMahasiswa` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `schedule_items_prodiScheduleId_idx`(`prodiScheduleId`),
    INDEX `schedule_items_mataKuliahId_idx`(`mataKuliahId`),
    INDEX `schedule_items_dosenId_idx`(`dosenId`),
    INDEX `schedule_items_ruanganId_idx`(`ruanganId`),
    INDEX `schedule_items_hari_idx`(`hari`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen_schedule_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dosenId` VARCHAR(191) NOT NULL,
    `kaprodiId` VARCHAR(191) NOT NULL,
    `mataKuliahId` INTEGER NOT NULL,
    `preferredHari` ENUM('SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU') NOT NULL,
    `preferredJamMulai` VARCHAR(191) NOT NULL,
    `preferredJamSelesai` VARCHAR(191) NOT NULL,
    `preferredRuanganId` INTEGER NULL,
    `alasanRequest` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `kaprodiNotes` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `dosen_schedule_requests_dosenId_idx`(`dosenId`),
    INDEX `dosen_schedule_requests_mataKuliahId_idx`(`mataKuliahId`),
    INDEX `dosen_schedule_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_revisions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prodiScheduleId` INTEGER NOT NULL,
    `revisionNotes` VARCHAR(191) NOT NULL,
    `createdBySekjur` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `schedule_revisions_prodiScheduleId_idx`(`prodiScheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `users_programStudiId_idx` ON `users`(`programStudiId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prodi_schedules` ADD CONSTRAINT `prodi_schedules_timetablePeriodId_fkey` FOREIGN KEY (`timetablePeriodId`) REFERENCES `timetable_periods`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prodi_schedules` ADD CONSTRAINT `prodi_schedules_prodiId_fkey` FOREIGN KEY (`prodiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_items` ADD CONSTRAINT `schedule_items_prodiScheduleId_fkey` FOREIGN KEY (`prodiScheduleId`) REFERENCES `prodi_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_items` ADD CONSTRAINT `schedule_items_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_items` ADD CONSTRAINT `schedule_items_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_items` ADD CONSTRAINT `schedule_items_ruanganId_fkey` FOREIGN KEY (`ruanganId`) REFERENCES `ruangan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen_schedule_requests` ADD CONSTRAINT `dosen_schedule_requests_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen_schedule_requests` ADD CONSTRAINT `dosen_schedule_requests_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen_schedule_requests` ADD CONSTRAINT `dosen_schedule_requests_preferredRuanganId_fkey` FOREIGN KEY (`preferredRuanganId`) REFERENCES `ruangan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `schedule_revisions` ADD CONSTRAINT `schedule_revisions_prodiScheduleId_fkey` FOREIGN KEY (`prodiScheduleId`) REFERENCES `prodi_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
