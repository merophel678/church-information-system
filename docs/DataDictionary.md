# Data Dictionary

Scope: all database tables and enums. Format is table-per-entity with full field listings.
Types are based on the Prisma schema for MySQL.

Legend:
- Nullable: Y/N
- Default: database default (or system behavior)
- Source/Origin: where the value is set (public form, admin action, system)

## User
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Must be unique | User identifier | `b9a2...` |
| username | String (VARCHAR 191) | N | None | Admin setup | Unique | Login username | `admin` |
| passwordHash | String (VARCHAR 191) | N | None | System-generated | bcrypt hash | Password hash | `$2b$10$...` |
| role | UserRole | N | `ADMIN` | Admin setup | Enum value | User role | `ADMIN` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-13T10:00:00Z` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-13T10:00:00Z` |

## ServiceRequest
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Request identifier | `d4c1...` |
| category | RequestCategory | N | None | Public form | Enum value | SACRAMENT or CERTIFICATE | `CERTIFICATE` |
| serviceType | String (VARCHAR 191) | N | None | Public form | Required | Displayed service type | `Marriage Certificate` |
| requesterName | String (VARCHAR 191) | N | None | Public form | Required | Requester full name | `Maria Santos` |
| contactInfo | String (VARCHAR 191) | N | None | Public form | Required | Phone or email | `09171234567` |
| preferredDate | String (VARCHAR 191) | Y | NULL | Public form | Required for marriage sacrament | Preferred schedule text | `2026-02-01 10:00 AM` |
| details | String (VARCHAR 191) | N | None | Public form | Required for most requests; optional for funeral/death/marriage requests | Additional details | `For local employment` |
| confirmationCandidateName | String (VARCHAR 191) | Y | NULL | Public form | Required for confirmation requests | Candidate name | `Juan Dela Cruz` |
| confirmationCandidateBirthDate | DateTime | Y | NULL | Public form | Required for confirmation requests | Candidate birth date | `2008-05-12` |
| funeralDeceasedName | String (VARCHAR 191) | Y | NULL | Public form | Required for funeral requests | Deceased name | `Pedro Reyes` |
| funeralResidence | String (VARCHAR 191) | Y | NULL | Public form | Required for funeral requests | Residence/address | `Sabang, Borongan` |
| funeralDateOfDeath | DateTime | Y | NULL | Public form | Required for funeral requests | Date of death | `2026-01-10` |
| funeralPlaceOfBurial | String (VARCHAR 191) | Y | NULL | Public form | Required for funeral requests | Place of burial | `Campesao Cemetery` |
| marriageGroomName | String (VARCHAR 191) | Y | NULL | Public form | Required for marriage requests/certificates | Groom name | `Carlos Dela Cruz` |
| marriageBrideName | String (VARCHAR 191) | Y | NULL | Public form | Required for marriage requests/certificates | Bride name | `Kristina Santos` |
| marriageDate | DateTime | Y | NULL | Public form | Required for marriage certificate requests | Marriage date | `2025-12-20` |
| certificateRecipientName | String (VARCHAR 191) | Y | NULL | Public form | Required for non-marriage certificate requests | Certificate holder | `Maria Santos` |
| certificateRecipientBirthDate | DateTime | Y | NULL | Public form | Required for baptism/confirmation certificate | Birth date | `2001-07-14` |
| certificateRecipientDeathDate | DateTime | Y | NULL | Public form | Required for death certificate | Date of death | `2026-01-10` |
| requesterRelationship | String (VARCHAR 191) | Y | NULL | Public form | Required for funeral/death certificate requests | Relationship to recipient | `Daughter` |
| recordId | String (VARCHAR 191) | Y | NULL | System-generated | FK to SacramentRecord.id | Matched record for certificate | `a3f2...` |
| isReissue | Boolean | N | `false` | System-generated | True if prior certificate exists | Reissue flag | `true` |
| reissueReason | String (VARCHAR 191) | Y | NULL | Public form | Required when isReissue is true | Reason for reissue | `Lost original copy` |
| status | RequestStatus | N | `PENDING` | Admin action | Enum value; COMPLETED/REJECTED locked | Request state | `APPROVED` |
| submissionDate | DateTime | N | `now()` | System-generated | Auto timestamp | Submission time | `2026-01-13T08:00:00Z` |
| confirmedSchedule | String (VARCHAR 191) | Y | NULL | Admin action | Required for SCHEDULED | Confirmed schedule | `2026-02-01 10:00 AM` |
| adminNotes | String (VARCHAR 191) | Y | NULL | Admin action | Required for rejection | Admin remarks | `Missing requirements` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-13T08:00:00Z` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-13T10:00:00Z` |

## SacramentRecord
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Record identifier | `f8d1...` |
| name | String (VARCHAR 191) | N | None | Admin or system | Required | Primary record name | `Maria Santos` |
| date | DateTime | N | None | Admin or system | Required | Sacrament date | `2026-01-05` |
| type | SacramentType | N | None | Admin or system | Enum value | Sacrament type | `BAPTISM` |
| officiant | String (VARCHAR 191) | N | None | Admin or system | Required | Priest/officiant | `Fr. Juan Dela Cruz` |
| details | String (VARCHAR 191) | N | None | Admin or system | Required | Additional details | `Parents: Jose and Ana` |
| fatherName | String (VARCHAR 191) | Y | NULL | Admin | Required in baptism/confirmation forms | Father name | `Jose Santos` |
| motherName | String (VARCHAR 191) | Y | NULL | Admin | Required in baptism/confirmation forms | Mother name | `Ana Santos` |
| birthDate | DateTime | Y | NULL | Admin | Required in baptism/confirmation forms | Birth date | `2001-07-14` |
| birthPlace | String (VARCHAR 191) | Y | NULL | Admin | Required in baptism/confirmation forms | Birth place | `Borongan City` |
| baptismDate | DateTime | Y | NULL | Admin | Confirmation only | Date of baptism | `2001-08-01` |
| baptismPlace | String (VARCHAR 191) | Y | NULL | Admin | Confirmation only | Place of baptism | `Sabang, Borongan` |
| sponsors | String (VARCHAR 191) | Y | NULL | Admin | Baptism/confirmation | Sponsors | `Carlos dela Pena; Angela Ramos` |
| registerBook | String (VARCHAR 191) | Y | NULL | Admin | Required in add record form | Register book | `02` |
| registerPage | String (VARCHAR 191) | Y | NULL | Admin | Required in add record form | Register page | `123` |
| registerLine | String (VARCHAR 191) | Y | NULL | Admin | Required in add record form | Register line | `7` |
| residence | String (VARCHAR 191) | Y | NULL | Admin | Funeral | Residence | `Sabang, Borongan` |
| dateOfDeath | DateTime | Y | NULL | Admin | Funeral | Date of death | `2026-01-10` |
| causeOfDeath | String (VARCHAR 191) | Y | NULL | Admin | Funeral | Cause of death | `Lung cancer` |
| placeOfBurial | String (VARCHAR 191) | Y | NULL | Admin | Funeral | Place of burial | `Campesao Cemetery` |
| groomName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom name | `Carlos Dela Cruz` |
| brideName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride name | `Kristina Santos` |
| groomAge | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom age | `27` |
| brideAge | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride age | `25` |
| groomResidence | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom residence | `Borongan City` |
| brideResidence | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride residence | `Borongan City` |
| groomNationality | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom nationality | `Filipino` |
| brideNationality | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride nationality | `Filipino` |
| groomFatherName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom father | `Boynito Basada` |
| brideFatherName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride father | `Nestor Amboy` |
| groomMotherName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Groom mother | `Rosario Caraga` |
| brideMotherName | String (VARCHAR 191) | Y | NULL | Admin | Marriage | Bride mother | `Nida Amboy` |
| isArchived | Boolean | N | `false` | Admin | Archive toggle | Archive flag | `false` |
| archivedAt | DateTime | Y | NULL | Admin | Set when archived | Archive time | `2026-01-12T09:00:00Z` |
| archivedBy | String (VARCHAR 191) | Y | NULL | Admin | Set when archived | Archived by | `Administrator` |
| archiveReason | String (VARCHAR 191) | Y | NULL | Admin | Optional | Archive reason | `Merged register` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-05T10:00:00Z` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-12T09:00:00Z` |
| requestId | String (VARCHAR 191) | Y | NULL | System-generated | FK to ServiceRequest.id | Source request | `d4c1...` |

## IssuedCertificate
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Certificate ID | `e7a9...` |
| requestId | String (VARCHAR 191) | N | None | System-generated | FK to ServiceRequest.id | Source request | `d4c1...` |
| type | String (VARCHAR 191) | N | None | System-generated | Matches request type | Certificate type | `Baptismal Certificate` |
| recipientName | String (VARCHAR 191) | N | None | System-generated | Derived from request | Certificate holder | `Maria Santos` |
| requesterName | String (VARCHAR 191) | N | None | System-generated | Derived from request | Requester | `Juan Santos` |
| dateIssued | DateTime | N | `now()` | System-generated | Auto timestamp | Issue date | `2026-01-13` |
| issuedBy | String (VARCHAR 191) | N | None | Admin action | Required | Issuing staff | `admin` |
| deliveryMethod | DeliveryMethod | N | None | Admin action | Enum value | Delivery method | `PICKUP` |
| notes | String (VARCHAR 191) | Y | NULL | Admin action | Optional | Notes | `ID presented` |
| status | CertificateStatus | N | `PENDING_UPLOAD` | System-generated | Enum value | Upload status | `UPLOADED` |
| fileData | Bytes (BLOB) | Y | NULL | Admin upload | Required when status=UPLOADED | File contents | `<binary>` |
| fileName | String (VARCHAR 191) | Y | NULL | Admin upload | Required when status=UPLOADED | File name | `certificate.pdf` |
| fileMimeType | String (VARCHAR 191) | Y | NULL | Admin upload | Required when status=UPLOADED | MIME type | `application/pdf` |
| fileSize | Int | Y | NULL | Admin upload | Required when status=UPLOADED | File size bytes | `254812` |
| uploadedAt | DateTime | Y | NULL | Admin upload | Set when file uploaded | Upload time | `2026-01-13T14:10:00Z` |
| uploadedBy | String (VARCHAR 191) | Y | NULL | Admin upload | Set when file uploaded | Uploaded by | `admin` |
| reminderSentAt | DateTime | Y | NULL | System-generated | Set when reminder triggers | Reminder time | `2026-01-15T10:00:00Z` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-13T14:00:00Z` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-13T14:10:00Z` |

## MassSchedule
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Schedule ID | `a1b2...` |
| day | String (VARCHAR 191) | N | None | Admin action | Required | Day of week | `Sunday` |
| time | String (VARCHAR 191) | N | None | Admin action | Required | Time label | `06:00 AM` |
| description | String (VARCHAR 191) | N | None | Admin action | Required | Mass description | `English Mass` |
| location | String (VARCHAR 191) | N | None | Admin action | Required | Location | `Main Church` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-01` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-01` |

## ScheduleNote
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Note ID | `c3d4...` |
| title | String (VARCHAR 191) | N | None | Admin action | Required | Highlight title | `Confession Schedule` |
| body | Text | N | None | Admin action | Required | Highlight body | `Reconciliation every Wednesday...` |
| actionLabel | String (VARCHAR 191) | Y | NULL | Admin action | Optional | CTA label | `Contact Office` |
| actionLink | String (VARCHAR 191) | Y | NULL | Admin action | Optional | CTA link | `mailto:parishoffice@example.com` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-01` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-02` |

## Announcement
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Announcement ID | `e5f6...` |
| title | String (VARCHAR 191) | N | None | Admin action | Required | Bulletin title | `Parish Fiesta` |
| content | Text | N | None | Admin action | Required | Bulletin content | `Meeting this Saturday...` |
| date | DateTime | N | None | Admin action | Required | Announcement date | `2026-01-05` |
| isPublic | Boolean | N | `true` | Admin action | Toggle visibility | Public visibility | `true` |
| imageUrl | LongText | Y | NULL | Admin upload | Optional | Image (base64 or URL) | `data:image/jpeg;base64,...` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-05` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-06` |

## Donation
| Field | Type/Size | Nullable | Default | Source/Origin | Validation/Rules | Description | Example |
| --- | --- | --- | --- | --- | --- | --- | --- |
| id | String (VARCHAR 191) | N | UUID | System-generated | Unique | Donation ID | `b7c8...` |
| donorName | String (VARCHAR 191) | N | None | Admin action | Required | Donor name | `Family of Reyes` |
| amount | String (VARCHAR 191) | N | None | Admin action | Required | Amount or in-kind | `PHP 1000` |
| purpose | String (VARCHAR 191) | N | None | Admin action | Required | Donation purpose | `Renovation Fund` |
| date | DateTime | N | None | Admin action | Required | Donation date | `2026-01-08` |
| isAnonymous | Boolean | N | `false` | Admin action | Toggle | Anonymous flag | `false` |
| createdAt | DateTime | N | `now()` | System-generated | Auto timestamp | Created time | `2026-01-08` |
| updatedAt | DateTime | N | `now()` | System-generated | Auto update | Updated time | `2026-01-08` |

## Enums (Lookup Tables)

### UserRole
| Value | Description |
| --- | --- |
| ADMIN | Full admin access |
| STAFF | Staff access |

### RequestCategory
| Value | Description |
| --- | --- |
| SACRAMENT | Sacrament request |
| CERTIFICATE | Certificate request |

### RequestStatus
| Value | Description |
| --- | --- |
| PENDING | Newly submitted |
| APPROVED | Approved by admin |
| SCHEDULED | Scheduled with confirmed date/time |
| COMPLETED | Finished; locked from edits |
| REJECTED | Rejected; locked from edits |

### SacramentType
| Value | Description |
| --- | --- |
| BAPTISM | Baptism record |
| CONFIRMATION | Confirmation record |
| MARRIAGE | Marriage record |
| FUNERAL | Funeral record |

### DeliveryMethod
| Value | Description |
| --- | --- |
| PICKUP | Pick up at parish |
| EMAIL | Delivered by email |
| COURIER | Delivered by courier |

### CertificateStatus
| Value | Description |
| --- | --- |
| PENDING_UPLOAD | Issued, awaiting file upload |
| UPLOADED | Digital copy uploaded |
