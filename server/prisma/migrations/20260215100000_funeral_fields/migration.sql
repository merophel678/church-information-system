-- AlterTable
ALTER TABLE `SacramentRecord`
  ADD COLUMN `residence` VARCHAR(191) NULL,
  ADD COLUMN `dateOfDeath` DATETIME(3) NULL,
  ADD COLUMN `causeOfDeath` VARCHAR(191) NULL,
  ADD COLUMN `placeOfBurial` VARCHAR(191) NULL;
