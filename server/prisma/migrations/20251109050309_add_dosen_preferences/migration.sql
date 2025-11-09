/*
  Warnings:

  - You are about to drop the column `avoidDays` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `dosenId` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `maxGapBetweenClasses` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `preferredTimeSlots` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `semester` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to drop the column `tahunAkademik` on the `dosen_preferences` table. All the data in the column will be lost.
  - You are about to alter the column `priority` on the `dosen_preferences` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(14))` to `VarChar(191)`.
  - You are about to drop the `conflict_suggestions` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `dosenNip` to the `dosen_preferences` table without a default value. This is not possible if the table is not empty.
  - Made the column `maxDaysPerWeek` on table `dosen_preferences` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `dosen_preferences` DROP FOREIGN KEY `dosen_preferences_dosenId_fkey`;

-- DropIndex
DROP INDEX `dosen_preferences_dosenId_tahunAkademik_semester_key` ON `dosen_preferences`;

-- DropIndex
DROP INDEX `dosen_preferences_semester_idx` ON `dosen_preferences`;

-- DropIndex
DROP INDEX `dosen_preferences_tahunAkademik_idx` ON `dosen_preferences`;

-- AlterTable
ALTER TABLE `dosen_preferences` DROP COLUMN `avoidDays`,
    DROP COLUMN `dosenId`,
    DROP COLUMN `maxGapBetweenClasses`,
    DROP COLUMN `preferredTimeSlots`,
    DROP COLUMN `semester`,
    DROP COLUMN `tahunAkademik`,
    ADD COLUMN `avoidedDays` VARCHAR(191) NULL,
    ADD COLUMN `dosenNip` VARCHAR(191) NOT NULL,
    ADD COLUMN `preferredTimeSlot` VARCHAR(191) NOT NULL DEFAULT 'BOTH',
    MODIFY `maxDaysPerWeek` INTEGER NOT NULL DEFAULT 5,
    MODIFY `unavailableSlots` TEXT NULL,
    MODIFY `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL';

-- DropTable
DROP TABLE `conflict_suggestions`;

-- CreateIndex
CREATE INDEX `dosen_preferences_dosenNip_idx` ON `dosen_preferences`(`dosenNip`);

-- AddForeignKey
ALTER TABLE `dosen_preferences` ADD CONSTRAINT `dosen_preferences_dosenNip_fkey` FOREIGN KEY (`dosenNip`) REFERENCES `dosen`(`nip`) ON DELETE CASCADE ON UPDATE CASCADE;
