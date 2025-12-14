-- AlterTable
ALTER TABLE `ServiceRequest` ADD COLUMN `certificateRecipientBirthDate` DATETIME(3) NULL,
    ADD COLUMN `certificateRecipientName` VARCHAR(191) NULL,
    ADD COLUMN `requesterRelationship` VARCHAR(191) NULL;



