-- AlterTable
ALTER TABLE `ServiceRequest`
  ADD COLUMN `marriageGroomName` VARCHAR(191) NULL,
  ADD COLUMN `marriageBrideName` VARCHAR(191) NULL,
  ADD COLUMN `marriageDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `SacramentRecord`
  ADD COLUMN `groomName` VARCHAR(191) NULL,
  ADD COLUMN `brideName` VARCHAR(191) NULL,
  ADD COLUMN `groomAge` VARCHAR(191) NULL,
  ADD COLUMN `brideAge` VARCHAR(191) NULL,
  ADD COLUMN `groomResidence` VARCHAR(191) NULL,
  ADD COLUMN `brideResidence` VARCHAR(191) NULL,
  ADD COLUMN `groomNationality` VARCHAR(191) NULL,
  ADD COLUMN `brideNationality` VARCHAR(191) NULL,
  ADD COLUMN `groomFatherName` VARCHAR(191) NULL,
  ADD COLUMN `brideFatherName` VARCHAR(191) NULL,
  ADD COLUMN `groomMotherName` VARCHAR(191) NULL,
  ADD COLUMN `brideMotherName` VARCHAR(191) NULL;
