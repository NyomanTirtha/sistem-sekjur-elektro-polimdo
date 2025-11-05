/*
  Warnings:

  - Added the required column `assignedBy` to the `penugasan_mengajar` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedById` to the `penugasan_mengajar` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add columns as nullable first
ALTER TABLE `penugasan_mengajar` 
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `approvedBy` VARCHAR(191) NULL,
    ADD COLUMN `assignedBy` VARCHAR(191) NULL,
    ADD COLUMN `assignedById` VARCHAR(191) NULL,
    ADD COLUMN `rejectionReason` VARCHAR(191) NULL,
    ADD COLUMN `requestedBy` VARCHAR(191) NULL,
    ADD COLUMN `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CANCELLED') NULL;

-- Step 2: Update existing rows with default values
UPDATE `penugasan_mengajar` 
SET 
    `assignedBy` = 'DOSEN',
    `assignedById` = `dosenId`,
    `requestedBy` = `dosenId`,
    `status` = 'ACTIVE',
    `approvedBy` = 'SYSTEM',
    `approvedAt` = NOW()
WHERE `assignedBy` IS NULL;

-- Step 3: Make columns NOT NULL
ALTER TABLE `penugasan_mengajar` 
    MODIFY COLUMN `assignedBy` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `assignedById` VARCHAR(191) NOT NULL,
    MODIFY COLUMN `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING_APPROVAL';

-- CreateIndex
CREATE INDEX `penugasan_mengajar_status_idx` ON `penugasan_mengajar`(`status`);
