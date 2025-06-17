/*
  Warnings:

  - You are about to drop the column `createdAt` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `dosen` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `mahasiswa` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `pengajuan_sa` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `pengajuan_sa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `dosen` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `mahasiswa` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;

-- AlterTable
ALTER TABLE `pengajuan_sa` DROP COLUMN `createdAt`,
    DROP COLUMN `updatedAt`;
