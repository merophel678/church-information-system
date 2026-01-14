# System Flowchart (Text-Only)

Audience: thesis documentation  
Scope: full system (public + admin) from frontend to data stores  
Format: text-only, high-level with error paths

Legend:
- `(Start/End)` = terminator
- `[Process]` = action/process
- `{Decision?}` = decision point (Yes/No branches)
- `[D#]` = data store
- `->` = flow direction

Data Stores:
- [D1 Users]
- [D2 ServiceRequests]
- [D3 SacramentRecords]
- [D4 IssuedCertificates]
- [D5 MassSchedules]
- [D6 ScheduleNote]
- [D7 Announcements]
- [D8 Donations]

## Flowchart A — Public User (Portal + Requests)

(Start)
  -> [Open Landing Page]
  -> [Fetch public data from D5/D6/D7/D8]
  -> {Decision: What does the user do?}
      |-- View public pages
      |     -> [Display schedules, bulletin, donations]
      |     -> (End)
      |
      |-- Submit a service request
            -> [Open Request Service form]
            -> {Decision: Request type?}
                |-- Sacrament request
                |     -> [Enter sacrament details]
                |     -> {Decision: Sacrament = Confirmation?}
                |           |-- Yes -> [Validate baptism record in D3 by name + birth date]
                |           |         {Decision: Match found?}
                |           |           |-- No -> [Store request in D2 as Rejected + admin note]
                |           |           |         -> (End)
                |           |           |-- Yes -> [Store request in D2 as Pending]
                |           |                     -> (End)
                |           |-- No -> [Store request in D2 as Pending]
                |                     -> (End)
                |
                |-- Certificate request
                      -> [Enter recipient details + required fields]
                      -> [Validate matching record in D3]
                      -> {Decision: Matching record found?}
                          |-- No -> [Store request in D2 as Rejected + admin note]
                          |         -> (End)
                          |-- Yes -> [Check D4 for prior issued certificate]
                                    {Decision: Prior certificate exists?}
                                      |-- Yes -> [Require reissue reason]
                                      |         {Decision: Reason provided?}
                                      |           |-- No -> [Return error; user must resubmit]
                                      |           |         -> (End)
                                      |           |-- Yes -> [Store request in D2 as Pending + reissue flag]
                                      |                     -> (End)
                                      |-- No -> [Store request in D2 as Pending]
                                                -> (End)

## Flowchart B — Admin/Staff (Authenticated Operations)

(Start)
  -> [Open /login]
  -> [Submit credentials]
  -> [Validate against D1 Users]
  -> {Decision: Credentials valid?}
      |-- No -> [Show login error] -> (End)
      |-- Yes -> [Issue JWT token] -> [Load admin dashboard]
               -> [Fetch D2/D3/D4 + D5/D6/D7/D8]
               -> {Decision: Admin task?}
                   |-- Manage public content
                   |     -> [Create/update schedules, bulletin, donations, schedule note]
                   |     -> [Write changes to D5/D6/D7/D8]
                   |     -> (End)
                   |
                   |-- Manage service requests (D2)
                   |     -> [Select request]
                   |     -> {Decision: Change status?}
                   |         |-- Completed/Rejected already?
                   |         |     -> [Status locked; block edits] -> (End)
                   |         |-- Approve/Schedule/Reject
                   |         |     -> [Update status + notes in D2] -> (End)
                   |         |-- Complete sacrament
                   |               -> [Update status in D2]
                   |               -> [Auto-create sacrament record in D3]
                   |               -> (End)
                   |
                   |-- Issue certificates (D4)
                   |     -> [Select certificate request]
                   |     -> [Verify matching record in D3]
                   |     -> {Decision: Record exists?}
                   |         |-- No -> [Block issuance / auto-reject in D2] -> (End)
                   |         |-- Yes -> [Create issued certificate in D4]
                   |                    -> [Mark request Completed in D2]
                   |                    -> (End)
                   |
                   |-- Manage sacramental records (D3)
                   |     -> [Add record with template fields]
                   |     -> [Archive/Restore record]
                   |     -> [View details modal]
                   |     -> (End)
                   |
                   |-- Certificate registry (D4)
                         -> [View grouped certificates by record]
                         -> [Generate digital certificate from D3]
                         -> [Upload signed file]
                         -> [Download issued file]
                         -> (End)

## Error/Validation Paths (High-Level)
- Invalid login -> 401 -> admin stays on login screen.
- Missing required request fields -> 400 -> user must correct and resubmit.
- Confirmation request without matching baptism record -> auto-reject with admin note.
- Certificate request without matching record -> auto-reject with admin note.
- Reissue request without a reason -> 400 -> user must resubmit with reason.
- Completed or rejected requests -> status locked (no edits).
