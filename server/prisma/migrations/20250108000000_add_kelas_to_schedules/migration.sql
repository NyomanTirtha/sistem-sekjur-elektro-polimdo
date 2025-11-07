-- AlterTable: Tambahkan kolom kelas ke prodi_schedules
-- Step 1: Tambahkan kolom sebagai nullable
ALTER TABLE `prodi_schedules` ADD COLUMN `kelas` VARCHAR(191) NULL;

-- Step 2: Update data existing dengan nilai default
-- Format: [semester][kode_prodi][1]
UPDATE `prodi_schedules` ps
INNER JOIN `timetable_periods` tp ON ps.timetablePeriodId = tp.id
INNER JOIN `program_studi` p ON ps.prodiId = p.id
SET ps.kelas = CONCAT(
  CASE 
    WHEN tp.semester = 'GANJIL' THEN '1'
    WHEN tp.semester = 'GENAP' THEN '2'
    ELSE '1'
  END,
  CASE 
    WHEN p.nama LIKE '%Informatika%' THEN 'TI'
    WHEN p.nama LIKE '%Listrik%' THEN 'TL'
    WHEN p.nama LIKE '%Konstruksi%' AND p.nama LIKE '%Gedung%' THEN 'TKBG'
    WHEN p.nama LIKE '%Konstruksi%' AND p.nama LIKE '%Jalan%' THEN 'TKJJ'
    ELSE 'TI'
  END,
  '1'
)
WHERE ps.kelas IS NULL;

-- Step 3: Ubah kolom menjadi NOT NULL setelah semua data diupdate
ALTER TABLE `prodi_schedules` MODIFY COLUMN `kelas` VARCHAR(191) NOT NULL;

-- Step 4: Tambahkan unique constraint
CREATE UNIQUE INDEX `prodi_schedules_timetablePeriodId_prodiId_kelas_key` ON `prodi_schedules`(`timetablePeriodId`, `prodiId`, `kelas`);

-- Step 5: Tambahkan index untuk kelas
CREATE INDEX `prodi_schedules_kelas_idx` ON `prodi_schedules`(`kelas`);

