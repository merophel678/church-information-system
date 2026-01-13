-- AlterTable
ALTER TABLE `ServiceRequest`
  ADD COLUMN `funeralDeceasedName` VARCHAR(191) NULL,
  ADD COLUMN `funeralResidence` VARCHAR(191) NULL,
  ADD COLUMN `funeralDateOfDeath` DATETIME(3) NULL,
  ADD COLUMN `funeralPlaceOfBurial` VARCHAR(191) NULL,
  ADD COLUMN `certificateRecipientDeathDate` DATETIME(3) NULL;
