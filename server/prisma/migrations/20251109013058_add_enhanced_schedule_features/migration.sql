-- CreateTable
CREATE TABLE `jurusan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `jurusan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SEKJUR', 'MAHASISWA', 'DOSEN', 'KAPRODI') NOT NULL,
    `jurusanId` INTEGER NULL,
    `programStudiId` INTEGER NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_jurusanId_idx`(`jurusanId`),
    INDEX `users_programStudiId_idx`(`programStudiId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_studi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `ketuaProdi` VARCHAR(191) NOT NULL,
    `jurusanId` INTEGER NOT NULL,

    INDEX `program_studi_jurusanId_idx`(`jurusanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `nim` VARCHAR(191) NOT NULL,
    `nama` VARCHAR(191) NOT NULL,
    `programStudiId` INTEGER NOT NULL,
    `angkatan` VARCHAR(191) NULL,
    `semester` INTEGER NULL,
    `noTelp` VARCHAR(191) NULL,
    `alamat` VARCHAR(191) NULL,

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
    `maxSKSPerSemester` INTEGER NOT NULL DEFAULT 16,

    INDEX `dosen_prodiId_fkey`(`prodiId`),
    PRIMARY KEY (`nip`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mata_kuliah` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,
    `sks` INTEGER NOT NULL,
    `semester` INTEGER NOT NULL,
    `programStudiId` INTEGER NOT NULL,

    INDEX `mata_kuliah_programStudiId_idx`(`programStudiId`),
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

-- CreateTable
CREATE TABLE `penugasan_mengajar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mataKuliahId` INTEGER NOT NULL,
    `dosenId` VARCHAR(191) NOT NULL,
    `tahunAjaran` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `assignedBy` VARCHAR(191) NOT NULL,
    `assignedById` VARCHAR(191) NOT NULL,
    `requestedBy` VARCHAR(191) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `penugasan_mengajar_dosenId_idx`(`dosenId`),
    INDEX `penugasan_mengajar_status_idx`(`status`),
    UNIQUE INDEX `penugasan_mengajar_mataKuliahId_tahunAjaran_semester_key`(`mataKuliahId`, `tahunAjaran`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `kelas` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `sekjurNotes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `prodi_schedules_prodiId_idx`(`prodiId`),
    INDEX `prodi_schedules_status_idx`(`status`),
    INDEX `prodi_schedules_kelas_idx`(`kelas`),
    UNIQUE INDEX `prodi_schedules_timetablePeriodId_prodiId_kelas_key`(`timetablePeriodId`, `prodiId`, `kelas`),
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
    `maxBebanSKS` INTEGER NULL,
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
    `preferredKelas` VARCHAR(191) NULL,
    `alasanRequest` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `kaprodiNotes` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,

    INDEX `dosen_schedule_requests_dosenId_idx`(`dosenId`),
    INDEX `dosen_schedule_requests_mataKuliahId_idx`(`mataKuliahId`),
    INDEX `dosen_schedule_requests_status_idx`(`status`),
    INDEX `dosen_schedule_requests_preferredKelas_idx`(`preferredKelas`),
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

-- CreateTable
CREATE TABLE `enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mahasiswaId` VARCHAR(191) NOT NULL,
    `prodiScheduleId` INTEGER NOT NULL,
    `tahunAkademik` VARCHAR(191) NOT NULL,
    `semester` ENUM('GANJIL', 'GENAP', 'ANTARA') NOT NULL,
    `status` ENUM('ACTIVE', 'DROPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `enrollments_mahasiswaId_idx`(`mahasiswaId`),
    INDEX `enrollments_prodiScheduleId_idx`(`prodiScheduleId`),
    INDEX `enrollments_tahunAkademik_idx`(`tahunAkademik`),
    INDEX `enrollments_semester_idx`(`semester`),
    UNIQUE INDEX `enrollments_mahasiswaId_prodiScheduleId_tahunAkademik_semest_key`(`mahasiswaId`, `prodiScheduleId`, `tahunAkademik`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `schedule_conflict_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conflictType` ENUM('DOSEN_CONFLICT', 'RUANGAN_CONFLICT', 'MAHASISWA_CONFLICT', 'KAPASITAS_EXCEEDED', 'DOSEN_OVERLOAD', 'TIME_OVERLAP', 'INVALID_TIME_SLOT') NOT NULL,
    `description` TEXT NOT NULL,
    `scheduleItemId1` INTEGER NULL,
    `scheduleItemId2` INTEGER NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL DEFAULT 'HIGH',
    `resolvedAt` DATETIME(3) NULL,
    `resolvedBy` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `schedule_conflict_logs_conflictType_idx`(`conflictType`),
    INDEX `schedule_conflict_logs_severity_idx`(`severity`),
    INDEX `schedule_conflict_logs_resolvedAt_idx`(`resolvedAt`),
    INDEX `schedule_conflict_logs_detectedAt_idx`(`detectedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen_workloads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dosenId` VARCHAR(191) NOT NULL,
    `tahunAkademik` VARCHAR(191) NOT NULL,
    `semester` ENUM('GANJIL', 'GENAP', 'ANTARA') NOT NULL,
    `totalSKS` INTEGER NOT NULL DEFAULT 0,
    `totalMataKuliah` INTEGER NOT NULL DEFAULT 0,
    `totalJamMengajar` INTEGER NOT NULL DEFAULT 0,
    `maxSKSAllowed` INTEGER NOT NULL DEFAULT 16,
    `isOverloaded` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dosen_workloads_dosenId_idx`(`dosenId`),
    INDEX `dosen_workloads_tahunAkademik_idx`(`tahunAkademik`),
    INDEX `dosen_workloads_semester_idx`(`semester`),
    INDEX `dosen_workloads_isOverloaded_idx`(`isOverloaded`),
    UNIQUE INDEX `dosen_workloads_dosenId_tahunAkademik_semester_key`(`dosenId`, `tahunAkademik`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dosenId` VARCHAR(191) NOT NULL,
    `tahunAkademik` VARCHAR(191) NOT NULL,
    `semester` ENUM('GANJIL', 'GENAP', 'ANTARA') NOT NULL,
    `preferredDays` VARCHAR(191) NULL,
    `avoidDays` VARCHAR(191) NULL,
    `preferredTimeSlots` VARCHAR(191) NULL,
    `maxDaysPerWeek` INTEGER NULL,
    `maxGapBetweenClasses` INTEGER NULL,
    `unavailableSlots` VARCHAR(191) NULL,
    `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'MANDATORY') NOT NULL DEFAULT 'NORMAL',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `dosen_preferences_dosenId_idx`(`dosenId`),
    INDEX `dosen_preferences_tahunAkademik_idx`(`tahunAkademik`),
    INDEX `dosen_preferences_semester_idx`(`semester`),
    UNIQUE INDEX `dosen_preferences_dosenId_tahunAkademik_semester_key`(`dosenId`, `tahunAkademik`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conflict_suggestions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `conflictLogId` INTEGER NOT NULL,
    `suggestionType` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `impactScore` INTEGER NOT NULL,
    `feasibilityScore` INTEGER NOT NULL,
    `proposedChanges` TEXT NOT NULL,
    `appliedAt` DATETIME(3) NULL,
    `appliedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `conflict_suggestions_conflictLogId_idx`(`conflictLogId`),
    INDEX `conflict_suggestions_feasibilityScore_idx`(`feasibilityScore`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_studi` ADD CONSTRAINT `program_studi_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_prodiId_fkey` FOREIGN KEY (`prodiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mata_kuliah` ADD CONSTRAINT `mata_kuliah_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa` ADD CONSTRAINT `pengajuan_sa_mahasiswaId_fkey` FOREIGN KEY (`mahasiswaId`) REFERENCES `mahasiswa`(`nim`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengajuan_sa_detail` ADD CONSTRAINT `pengajuan_sa_detail_pengajuanSAId_fkey` FOREIGN KEY (`pengajuanSAId`) REFERENCES `pengajuan_sa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_mengajar` ADD CONSTRAINT `penugasan_mengajar_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_mengajar` ADD CONSTRAINT `penugasan_mengajar_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_mahasiswaId_fkey` FOREIGN KEY (`mahasiswaId`) REFERENCES `mahasiswa`(`nim`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_prodiScheduleId_fkey` FOREIGN KEY (`prodiScheduleId`) REFERENCES `prodi_schedules`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen_workloads` ADD CONSTRAINT `dosen_workloads_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen_preferences` ADD CONSTRAINT `dosen_preferences_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;
