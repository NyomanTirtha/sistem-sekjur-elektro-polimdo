/*
  Warnings:

  - The values [ADMIN] on the enum `users_role` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `programStudiId` to the `mata_kuliah` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jurusanId` to the `program_studi` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `mahasiswa` MODIFY `angkatan` VARCHAR(191) NULL,
    MODIFY `semester` INTEGER NULL,
    MODIFY `noTelp` VARCHAR(191) NULL,
    MODIFY `alamat` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `mata_kuliah` ADD COLUMN `programStudiId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `program_studi` ADD COLUMN `jurusanId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `jurusanId` INTEGER NULL,
    MODIFY `role` ENUM('SEKJUR', 'MAHASISWA', 'DOSEN', 'KAPRODI') NOT NULL;

-- CreateTable
CREATE TABLE `jurusan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `jurusan_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penugasan_mengajar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mataKuliahId` INTEGER NOT NULL,
    `dosenId` VARCHAR(191) NOT NULL,
    `tahunAjaran` VARCHAR(191) NOT NULL,
    `semester` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `penugasan_mengajar_dosenId_idx`(`dosenId`),
    UNIQUE INDEX `penugasan_mengajar_mataKuliahId_tahunAjaran_semester_key`(`mataKuliahId`, `tahunAjaran`, `semester`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `mata_kuliah_programStudiId_idx` ON `mata_kuliah`(`programStudiId`);

-- CreateIndex
CREATE INDEX `program_studi_jurusanId_idx` ON `program_studi`(`jurusanId`);

-- CreateIndex
CREATE INDEX `users_jurusanId_idx` ON `users`(`jurusanId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `program_studi` ADD CONSTRAINT `program_studi_jurusanId_fkey` FOREIGN KEY (`jurusanId`) REFERENCES `jurusan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mata_kuliah` ADD CONSTRAINT `mata_kuliah_programStudiId_fkey` FOREIGN KEY (`programStudiId`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_mengajar` ADD CONSTRAINT `penugasan_mengajar_mataKuliahId_fkey` FOREIGN KEY (`mataKuliahId`) REFERENCES `mata_kuliah`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penugasan_mengajar` ADD CONSTRAINT `penugasan_mengajar_dosenId_fkey` FOREIGN KEY (`dosenId`) REFERENCES `dosen`(`nip`) ON DELETE RESTRICT ON UPDATE CASCADE;
