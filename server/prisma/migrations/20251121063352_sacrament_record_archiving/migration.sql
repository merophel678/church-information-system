-- AlterTable
ALTER TABLE `SacramentRecord` ADD COLUMN `archiveReason` VARCHAR(191) NULL,
    ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `archivedBy` VARCHAR(191) NULL,
    ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false;
