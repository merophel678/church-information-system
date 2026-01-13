-- Ensure ServiceRequest certificate tracking columns exist (idempotent).
SET @ecord_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND COLUMN_NAME = 'ecordId'
);
SET @record_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND COLUMN_NAME = 'recordId'
);
SET @record_sql = IF(
  @record_exists = 0 AND @ecord_exists = 1,
  'ALTER TABLE `ServiceRequest` CHANGE COLUMN `ecordId` `recordId` VARCHAR(191) NULL',
  IF(
    @record_exists = 0,
    'ALTER TABLE `ServiceRequest` ADD COLUMN `recordId` VARCHAR(191) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @record_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @eissue_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND COLUMN_NAME = 'eissueReason'
);
SET @reissue_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND COLUMN_NAME = 'reissueReason'
);
SET @reissue_sql = IF(
  @reissue_exists = 0 AND @eissue_exists = 1,
  'ALTER TABLE `ServiceRequest` CHANGE COLUMN `eissueReason` `reissueReason` VARCHAR(191) NULL',
  IF(
    @reissue_exists = 0,
    'ALTER TABLE `ServiceRequest` ADD COLUMN `reissueReason` VARCHAR(191) NULL',
    'SELECT 1'
  )
);
PREPARE stmt FROM @reissue_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @is_reissue_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND COLUMN_NAME = 'isReissue'
);
SET @is_reissue_sql = IF(
  @is_reissue_exists = 0,
  'ALTER TABLE `ServiceRequest` ADD COLUMN `isReissue` BOOLEAN NOT NULL DEFAULT false',
  'SELECT 1'
);
PREPARE stmt FROM @is_reissue_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'ServiceRequest'
    AND CONSTRAINT_NAME = 'ServiceRequest_recordId_fkey'
);
SET @fk_sql = IF(
  @fk_exists = 0,
  'ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_recordId_fkey` FOREIGN KEY (`recordId`) REFERENCES `SacramentRecord`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
