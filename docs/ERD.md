# Entity–Relationship Diagram (Text / Table Format)

Scope: database tables only, with all fields listed. Enums are documented as separate lookup entities.

Legend:
- **PK** = Primary Key  
- **FK** = Foreign Key  
- **UQ** = Unique  
- **NN** = Not Null  
- **?** = Nullable

---

## Entity: User
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | System-generated |
| username | String | UQ, NN | Login username |
| passwordHash | String | NN | bcrypt hash |
| role | UserRole | NN | Enum |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: ServiceRequest
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| category | RequestCategory | NN | Enum |
| serviceType | String | NN | e.g., “Baptism”, “Marriage Certificate” |
| requesterName | String | NN | |
| contactInfo | String | NN | |
| preferredDate | String | ? | For sacrament scheduling |
| details | String | NN | General request details |
| confirmationCandidateName | String | ? | Confirmation-only |
| confirmationCandidateBirthDate | DateTime | ? | Confirmation-only |
| funeralDeceasedName | String | ? | Funeral-only |
| funeralResidence | String | ? | Funeral-only |
| funeralDateOfDeath | DateTime | ? | Funeral-only |
| funeralPlaceOfBurial | String | ? | Funeral-only |
| marriageGroomName | String | ? | Marriage-only |
| marriageBrideName | String | ? | Marriage-only |
| marriageDate | DateTime | ? | Marriage-only |
| certificateRecipientName | String | ? | Certificate-only |
| certificateRecipientBirthDate | DateTime | ? | Certificate-only |
| certificateRecipientDeathDate | DateTime | ? | Certificate-only |
| requesterRelationship | String | ? | Funeral/death certificate |
| recordId | String | FK?, ? | Links to SacramentRecord.id |
| isReissue | Boolean | NN | Default false |
| reissueReason | String | ? | Required when reissue |
| status | RequestStatus | NN | Enum |
| submissionDate | DateTime | NN | |
| confirmedSchedule | String | ? | For scheduled sacraments |
| adminNotes | String | ? | Approval/rejection notes |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: SacramentRecord
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| name | String | NN | Primary record name |
| date | DateTime | NN | Sacrament date |
| type | SacramentType | NN | Enum |
| officiant | String | NN | Priest/officiant |
| details | String | NN | General details |
| fatherName | String | ? | Baptism/confirmation |
| motherName | String | ? | Baptism/confirmation |
| birthDate | DateTime | ? | Baptism/confirmation |
| birthPlace | String | ? | Baptism/confirmation |
| baptismDate | DateTime | ? | Confirmation |
| baptismPlace | String | ? | Confirmation |
| sponsors | String | ? | Baptism/confirmation |
| registerBook | String | ? | Register info |
| registerPage | String | ? | Register info |
| registerLine | String | ? | Register info |
| residence | String | ? | Funeral |
| dateOfDeath | DateTime | ? | Funeral |
| causeOfDeath | String | ? | Funeral |
| placeOfBurial | String | ? | Funeral |
| groomName | String | ? | Marriage |
| brideName | String | ? | Marriage |
| groomAge | String | ? | Marriage |
| brideAge | String | ? | Marriage |
| groomResidence | String | ? | Marriage |
| brideResidence | String | ? | Marriage |
| groomNationality | String | ? | Marriage |
| brideNationality | String | ? | Marriage |
| groomFatherName | String | ? | Marriage |
| brideFatherName | String | ? | Marriage |
| groomMotherName | String | ? | Marriage |
| brideMotherName | String | ? | Marriage |
| isArchived | Boolean | NN | Default false |
| archivedAt | DateTime | ? | |
| archivedBy | String | ? | |
| archiveReason | String | ? | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |
| requestId | String | FK?, ? | Links to ServiceRequest.id |

## Entity: IssuedCertificate
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| requestId | String | FK, NN | Links to ServiceRequest.id |
| type | String | NN | Certificate type |
| recipientName | String | NN | |
| requesterName | String | NN | |
| dateIssued | DateTime | NN | |
| issuedBy | String | NN | |
| deliveryMethod | DeliveryMethod | NN | Enum |
| notes | String | ? | |
| status | CertificateStatus | NN | Enum |
| fileData | Bytes | ? | Stored file blob |
| fileName | String | ? | |
| fileMimeType | String | ? | |
| fileSize | Int | ? | |
| uploadedAt | DateTime | ? | |
| uploadedBy | String | ? | |
| reminderSentAt | DateTime | ? | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: MassSchedule
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| day | String | NN | |
| time | String | NN | |
| description | String | NN | |
| location | String | NN | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: ScheduleNote
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| title | String | NN | |
| body | Text | NN | |
| actionLabel | String | ? | |
| actionLink | String | ? | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: Announcement
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| title | String | NN | |
| content | Text | NN | |
| date | DateTime | NN | |
| isPublic | Boolean | NN | |
| imageUrl | Text | ? | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

## Entity: Donation
| Field | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | String (UUID) | PK, NN | |
| donorName | String | NN | |
| amount | String | NN | |
| purpose | String | NN | |
| date | DateTime | NN | |
| isAnonymous | Boolean | NN | |
| createdAt | DateTime | NN | |
| updatedAt | DateTime | NN | |

---

## Enums (Lookup Entities)

### UserRole
| Value |
| --- |
| ADMIN |
| STAFF |

### RequestCategory
| Value |
| --- |
| SACRAMENT |
| CERTIFICATE |

### RequestStatus
| Value |
| --- |
| PENDING |
| APPROVED |
| SCHEDULED |
| COMPLETED |
| REJECTED |

### SacramentType
| Value |
| --- |
| BAPTISM |
| CONFIRMATION |
| MARRIAGE |
| FUNERAL |

### DeliveryMethod
| Value |
| --- |
| PICKUP |
| EMAIL |
| COURIER |

### CertificateStatus
| Value |
| --- |
| PENDING_UPLOAD |
| UPLOADED |

---

## Relationships (Summary)
- **User** (1) —— (Many) admin actions (not stored explicitly as FK)
- **ServiceRequest** (1) —— (Many) **IssuedCertificate** via `IssuedCertificate.requestId`
- **ServiceRequest** (0..1) —— (Many) **SacramentRecord** via `SacramentRecord.requestId`
- **SacramentRecord** (1) —— (Many) **ServiceRequest** via `ServiceRequest.recordId` (certificate requests)
