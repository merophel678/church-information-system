# OLMM Sabang Borongan Parish Manager

A comprehensive Information Management System designed for the **Quasi-Parish of Our Lady of Miraculous Medal** in Sabang Borongan. This application serves as both a public-facing portal for parishioners and a powerful administrative tool for parish staff.

## 🚀 Features

### Public Portal
*   **Home Page**: Welcoming landing page with parish mission, history, and quick access links.
*   **Mass Schedules**: View up-to-date mass timings, confession schedules, and liturgical events.
*   **Parish Bulletin**: Digital bulletin board for news and announcements, supporting featured images.
*   **Donations & Transparency**: Acknowledge donors and track contributions (with anonymity support).
*   **Online Services**:
    *   **Sacrament Requests**: Schedule Baptisms, Confirmations, Weddings, and Funeral Blessings.
    *   **Certificate Requests**: Request Baptismal, Confirmation, Marriage, and Death certificates online.
    *   **Validation**: Confirmation requests require a matching baptism record (name + birth date).

### Admin Dashboard (Staff Only)
*   **Secure Access**: Role-based login for parish administrators.
*   **Dashboard Overview**: Real-time statistics on pending requests, issued certificates, and records.
*   **Content Management**:
    *   **Schedules**: Add, edit, or remove mass schedules.
    *   **Bulletin**: Create announcements with image uploads and publish/draft states.
    *   **Donations**: Record and manage donor entries.
*   **Service Request Management**:
    *   **Workflow**: Track requests from 'Pending' to 'Approved', 'Scheduled', or 'Completed'.
    *   **Locking**: Completed or rejected requests cannot be edited.
    *   **Scheduling**: Set confirmed dates and times for sacraments.
    *   **Certificate Requests**: Validated against sacrament records; missing records auto-reject with an admin note.
    *   **Reissues**: Duplicate certificate requests require a reason and are tagged as reissues.
    *   **Issuance**: Issue certificates directly from requests when a matching record exists.
    *   **Automation**: Automatically generates a permanent Sacrament Record when a sacrament request is completed.
*   **Records Management**:
    *   **Sacramental Records**: Create, view (details modal), archive, and restore records for Baptism, Confirmation, Marriage, and Funeral.
    *   **Data Completeness**: Add Record form includes sacrament-specific fields that match certificate templates.
    *   **Certificate Registry**: A secure archive of issued certificates grouped by record with issue/request counts and PDF download.

## 🛠 Tech Stack

*   **Frontend Framework**: React 19 with TypeScript + Vite
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM v7
*   **Icons**: Lucide React
*   **State Management**: React Context API (`ParishContext`)
*   **Backend**: Express + Prisma + MySQL (see `server/`)
*   **Auth**: JWT-based admin login (`/api/auth/login`)

## 📂 Project Structure

```
.
├── components, pages, context, types.ts   # Frontend (Vite)
├── services/api.ts                        # REST client used by the ParishContext
├── server/                                # Express + Prisma backend
│   ├── prisma/schema.prisma               # Database schema
│   ├── prisma/seed.ts                     # Seed script (admin user + mock data)
│   └── src                                # Express app + routes
└── .env.example                           # Frontend env template
```

## ⚙️ Local Development

1. **Prerequisites**
   * Node.js ≥ 18
   * MySQL 8 (local instance or Docker)

2. **Prepare the database**
   ```bash
   cd server
   cp .env.example .env        # update DATABASE_URL / JWT_SECRET / CORS_ORIGIN
   npm install
   npx prisma migrate dev
   npm run seed                # creates admin/admin and sample data (clears existing data)
   npm run dev                 # starts the API on http://localhost:4000
   ```

3. **Configure the frontend**
   ```bash
   cd ..
   cp .env.example .env.local  # defaults to http://localhost:4000/api
   npm install
   npm run dev
   ```

4. **Login**
   * Visit `http://localhost:3000/#/login`
   * Credentials (from the seed script): `admin / admin`
   * The token is stored locally so you stay signed in across refreshes.

## 📝 Usage

### default Credentials
To access the Admin Dashboard:
*   **Username**: `admin`
*   **Password**: `admin`

### Key Workflows
1.  **Issuing a Certificate**:
    *   Go to *Manage Service Requests*.
    *   Filter for 'Certificate' requests.
    *   Click **Issue Cert**.
    *   If no matching sacrament record exists, the request is auto-rejected with an admin note.
    *   If a record exists, fill in delivery details.
    *   The request moves to 'Completed', and the certificate is logged in the *Certificate Registry*.

2.  **Scheduling a Baptism**:
    *   Go to *Manage Service Requests*.
    *   Select a 'Sacrament' request.
    *   Change status to **Scheduled**.
    *   Enter the confirmed date/time and notes.
    *   Once the event is done, change status to **Completed** to automatically add it to *Sacramental Records*.

3.  **Certificate Upload Workflow**:
    *   Use *Manage Service Requests* to issue a certificate. This creates a **Pending Upload** entry in the Certificate Registry.
    *   Open *Certificate Registry*, locate the pending entry (highlighted with “Upload Required”), and upload the signed PDF/JPG/PNG copy.
    *   Until a file is uploaded, the certificate cannot be downloaded. Once uploaded, the status switches to **Uploaded**, recording who uploaded it and when.
    *   Entries that remain pending beyond the reminder window (configurable via `UPLOAD_REMINDER_HOURS`) are flagged so staff can follow up.

4.  **Certificate Reissue Workflow**:
    *   When a duplicate certificate request is submitted, it is tagged as a reissue.
    *   A reason is required at request time.
    *   The registry groups reissues under the same record and increments the issue count.

4.  **Customize Mass & Events Highlight**:
    *   Visit *Manage Schedules* to update the hero section on the Mass & Events page (title, message, and CTA link).
    *   The preview on the right shows how the public section will render; this change publishes immediately to `/schedules`.

## 🌐 Deployment (Vercel + Railway)

1. **MySQL on Railway**
   * Create a new Railway project and add the **MySQL** plugin.
   * Copy the generated `MYSQLURL` (or host/user/pass) and use it as `DATABASE_URL`.

2. **Deploy the Express API**
   * Add the repo to Railway as a service rooted at `server/`.
   * Environment variables:
     * `DATABASE_URL` – from the MySQL plugin
     * `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, `UPLOAD_FILE_LIMIT_MB`, `UPLOAD_REMINDER_HOURS`
   * Run `railway run npx prisma migrate deploy` (and `npm run seed` if desired).
   * Note the public API URL, e.g. `https://your-api.up.railway.app`.

3. **Deploy the Vite Frontend on Vercel**
   * Import the repo into Vercel (framework = Vite, root = project root).
   * Set `VITE_API_BASE_URL=https://your-api.up.railway.app/api`.
   * Build command: `npm run build`.

4. **Update CORS**
   * If the Vercel URL changes, update `CORS_ORIGIN` on Railway so browser calls succeed.

5. **Migrations**
   * Each time the schema changes, run `railway run npx prisma migrate deploy` to apply migrations in production.

This setup keeps the frontend static on Vercel while the API + database run on Railway. Update `.env.local`/`.env` locally to mirror the production values when testing against live services.
