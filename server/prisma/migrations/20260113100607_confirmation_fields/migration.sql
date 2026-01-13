-- AlterTable
ALTER TABLE `SacramentRecord` ADD COLUMN `baptismDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ServiceRequest` ADD COLUMN `confirmationCandidateBirthDate` DATETIME(3) NULL,
    ADD COLUMN `confirmationCandidateName` VARCHAR(191) NULL;

