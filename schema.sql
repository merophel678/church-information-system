/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.7.2-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: church_is
-- ------------------------------------------------------
-- Server version	11.7.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcement`
--

DROP TABLE IF EXISTS `announcement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `date` datetime(3) NOT NULL,
  `isPublic` tinyint(1) NOT NULL DEFAULT 1,
  `imageUrl` longtext DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `donation`
--

DROP TABLE IF EXISTS `donation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `donation` (
  `id` varchar(191) NOT NULL,
  `donorName` varchar(191) NOT NULL,
  `amount` varchar(191) NOT NULL,
  `purpose` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL,
  `isAnonymous` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `issuedcertificate`
--

DROP TABLE IF EXISTS `issuedcertificate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `issuedcertificate` (
  `id` varchar(191) NOT NULL,
  `requestId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `recipientName` varchar(191) NOT NULL,
  `requesterName` varchar(191) NOT NULL,
  `dateIssued` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `issuedBy` varchar(191) NOT NULL,
  `deliveryMethod` enum('PICKUP','EMAIL','COURIER') NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `fileData` longblob DEFAULT NULL,
  `fileMimeType` varchar(191) DEFAULT NULL,
  `fileName` varchar(191) DEFAULT NULL,
  `fileSize` int(11) DEFAULT NULL,
  `reminderSentAt` datetime(3) DEFAULT NULL,
  `status` enum('PENDING_UPLOAD','UPLOADED') NOT NULL DEFAULT 'PENDING_UPLOAD',
  `uploadedAt` datetime(3) DEFAULT NULL,
  `uploadedBy` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IssuedCertificate_requestId_fkey` (`requestId`),
  CONSTRAINT `IssuedCertificate_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `servicerequest` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `massschedule`
--

DROP TABLE IF EXISTS `massschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `massschedule` (
  `id` varchar(191) NOT NULL,
  `day` varchar(191) NOT NULL,
  `time` varchar(191) NOT NULL,
  `description` varchar(191) NOT NULL,
  `location` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sacramentrecord`
--

DROP TABLE IF EXISTS `sacramentrecord`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sacramentrecord` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL,
  `type` enum('BAPTISM','CONFIRMATION','MARRIAGE','FUNERAL') NOT NULL,
  `officiant` varchar(191) NOT NULL,
  `details` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `requestId` varchar(191) DEFAULT NULL,
  `archiveReason` varchar(191) DEFAULT NULL,
  `archivedAt` datetime(3) DEFAULT NULL,
  `archivedBy` varchar(191) DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `SacramentRecord_requestId_fkey` (`requestId`),
  CONSTRAINT `SacramentRecord_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `servicerequest` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schedulenote`
--

DROP TABLE IF EXISTS `schedulenote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedulenote` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `body` text NOT NULL,
  `actionLabel` varchar(191) DEFAULT NULL,
  `actionLink` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `servicerequest`
--

DROP TABLE IF EXISTS `servicerequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicerequest` (
  `id` varchar(191) NOT NULL,
  `category` enum('SACRAMENT','CERTIFICATE') NOT NULL,
  `serviceType` varchar(191) NOT NULL,
  `requesterName` varchar(191) NOT NULL,
  `contactInfo` varchar(191) NOT NULL,
  `preferredDate` varchar(191) DEFAULT NULL,
  `details` varchar(191) NOT NULL,
  `status` enum('PENDING','APPROVED','SCHEDULED','COMPLETED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `submissionDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `confirmedSchedule` varchar(191) DEFAULT NULL,
  `adminNotes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `passwordHash` varchar(191) NOT NULL,
  `role` enum('ADMIN','STAFF') NOT NULL DEFAULT 'ADMIN',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_username_key` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2025-11-27  2:12:10
