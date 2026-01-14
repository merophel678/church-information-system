# Data Flow Diagrams (DFD)

This document describes the Data Flow Diagram (DFD) Level 0 and Level 1 for the OLMM Sabang Borongan Parish Information Management System using the Gane-Sarson notation. Diagrams are described in text form for thesis documentation.

Scope note: This reflects the current workflow, including record validation for certificate requests, confirmation request validation against baptism records, reissue handling, locked statuses for completed/rejected requests, and certificate registry grouping by record.

## DFD Level 0 (Context Diagram)

**System (Process 0):** Parish Information Management System

**External Entities:**
- **E1 Parishioner/Public User** (public visitors, requesters)
- **E2 Admin/Staff** (parish office users)

**Data Flows:**
- **E1 -> Process 0**
  - Service request details (sacrament requests)
  - Certificate request details (recipient info, birth/death date, reissue reason)
  - Contact information
- **Process 0 -> E1**
  - Public content (mass schedules, bulletin/announcements, donations)
  - Confirmation of request submission (implicit acknowledgement)
- **E2 -> Process 0**
  - Login credentials
  - Content updates (schedules, bulletin/announcements, donations, schedule highlight)
  - Request workflow actions (approve/reject/schedule/complete)
  - Certificate issuance actions (issue/generate/upload/download)
  - Sacramental record updates (add/archive/restore/view)
- **Process 0 -> E2**
  - Auth token
  - Dashboard and administrative views
  - Request lists with status and validation results
  - Sacramental records and certificate registry entries

## DFD Level 1 (Decomposition of Process 0)

### Data Stores
- **D1 Users** (admin/staff credentials and roles)
- **D2 ServiceRequests** (sacrament/certificate requests and workflow status)
- **D3 SacramentRecords** (baptism, confirmation, marriage, funeral records)
- **D4 IssuedCertificates** (issued certificates, status, file metadata)
- **D5 MassSchedules** (mass schedule entries)
- **D6 ScheduleNote** (mass & events highlight)
- **D7 Announcements** (bulletin posts)
- **D8 Donations** (donor entries)

### Processes (Gane-Sarson)

**1.0 Authenticate Admin**
- **Inputs:** E2 login credentials
- **Outputs:** Auth token to E2
- **Data Stores:** D1 Users (validate credentials)
- **Notes:** Token is required for all admin-only actions.

**2.0 Manage Public Content**
- **Inputs:** E2 content updates (schedules, bulletin, donations, schedule highlight)
- **Outputs:** Public content to E1; admin confirmations to E2
- **Data Stores:** D5 MassSchedules, D6 ScheduleNote, D7 Announcements, D8 Donations
- **Notes:** Public portal reads these stores without authentication.

**3.0 Receive and Validate Requests**
- **Inputs:** E1 service request data (sacrament/certificate, contact info)
- **Outputs:** Request submission acknowledgement to E1
- **Data Stores:** D2 ServiceRequests, D3 SacramentRecords, D4 IssuedCertificates
- **Validation rules:**
  - Confirmation requests require matching baptism record (name + birth date).
  - Certificate requests must match sacrament records:
    - Baptism/Confirmation: recipient name + birth date
    - Marriage: groom + bride + marriage date
    - Death: recipient name + date of death
  - Missing matches auto-reject with an admin note.
  - Reissue requests require a reason if a prior certificate exists.

**4.0 Manage Request Workflow**
- **Inputs:** E2 status updates, schedule details, admin notes
- **Outputs:** Updated request status to E2; downstream triggers
- **Data Stores:** D2 ServiceRequests
- **Rules:**
  - Completed and rejected requests are locked from further edits.
  - Scheduling captures confirmed date/time and admin notes.
  - Completing a sacrament request triggers record creation (Process 5.0).

**5.0 Maintain Sacramental Records**
- **Inputs:** E2 add/archive/restore actions; auto-create trigger from Process 4.0
- **Outputs:** Record listings/details to E2; record availability to other processes
- **Data Stores:** D3 SacramentRecords
- **Notes:**
  - Records support template-specific fields (e.g., parents, sponsors, marriage/funeral details).
  - Records can be archived and restored; archived records are excluded from matching rules.

**6.0 Issue and Manage Certificates**
- **Inputs:** E2 issue/generate/upload/download actions; validated requests from D2
- **Outputs:** Certificate registry to E2; downloadable files
- **Data Stores:** D4 IssuedCertificates, D2 ServiceRequests, D3 SacramentRecords
- **Rules:**
  - Issue action creates a certificate entry and updates request to Completed.
  - Generate action uses record data to build a digital certificate (PDF/image).
  - Upload action stores signed files and metadata.
  - Registry groups by sacramental record and tracks issue/reissue counts.

**7.0 Admin Dashboard and Reporting**
- **Inputs:** E2 dashboard requests
- **Outputs:** Aggregated metrics (pending requests, issued certificates, record counts)
- **Data Stores:** D2 ServiceRequests, D3 SacramentRecords, D4 IssuedCertificates

### Level 1 Data Flows (Summary)
- **E2 -> 1.0 -> D1 -> E2**: Admin login and token.
- **E2 -> 2.0 -> D5/D6/D7/D8 -> E1/E2**: Content management and public delivery.
- **E1 -> 3.0 -> D2**: Request submission and storage.
- **3.0 <-> D3/D4**: Validation and reissue detection.
- **E2 -> 4.0 -> D2**: Workflow updates (approve/schedule/complete/reject).
- **4.0 -> 5.0 -> D3**: Auto-create sacramental record on completion.
- **E2 -> 5.0 -> D3 -> E2**: Manual record creation and view-only details.
- **E2 -> 6.0 -> D4/D3/D2 -> E2**: Certificate issuance, generation, upload, download.
- **E2 -> 7.0 -> D2/D3/D4 -> E2**: Dashboard metrics.

## Notes for Thesis Documentation
- The system enforces data integrity by validating sacrament records before issuing certificates.
- Reissue handling is a controlled flow requiring explicit reason input.
- Archiving provides retention without polluting active matching rules.
- All admin processes are authenticated and centralized through the same API.
