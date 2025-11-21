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

### Admin Dashboard (Staff Only)
*   **Secure Access**: Role-based login for parish administrators.
*   **Dashboard Overview**: Real-time statistics on pending requests, issued certificates, and records.
*   **Content Management**:
    *   **Schedules**: Add, edit, or remove mass schedules.
    *   **Bulletin**: Create announcements with image uploads and publish/draft states.
    *   **Donations**: Record and manage donor entries.
*   **Service Request Management**:
    *   **Workflow**: Track requests from 'Pending' to 'Approved', 'Scheduled', or 'Completed'.
    *   **Scheduling**: Set confirmed dates and times for sacraments.
    *   **Issuance**: Issue certificates directly from requests, automatically archiving them in the registry.
    *   **Automation**: Automatically generates a permanent Sacrament Record when a sacrament request is completed.
*   **Records Management**:
    *   **Sacramental Records**: Full CRUD (Create, Read, Update, Delete) capabilities for Baptism, Confirmation, Marriage, and Funeral records.
    *   **Certificate Registry**: A secure archive of all issued certificates with a "Digital Copy" viewer for printing and verification.

## 🛠 Tech Stack

*   **Frontend Framework**: React 19 with TypeScript
*   **Styling**: Tailwind CSS
*   **Routing**: React Router DOM v7
*   **Icons**: Lucide React
*   **State Management**: React Context API (`ParishContext`)
*   **Data Persistence**: In-memory mock data (Simulated backend behavior)

## 📂 Project Structure

*   `src/components`: Reusable UI components (Navbar, Icons).
*   `src/context`: Global state management logic (`ParishContext.tsx`).
*   `src/pages`: Application views (Public and Admin).
    *   `src/pages/admin`: Administrative modules (Manage Requests, Registry, etc.).
*   `src/types.ts`: TypeScript definitions for data models (Sacraments, Requests, Users).
*   `src/constants.ts`: Initial mock data configuration.

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
    *   Fill in delivery details.
    *   The request moves to 'Completed', and the certificate is logged in the *Certificate Registry*.

2.  **Scheduling a Baptism**:
    *   Go to *Manage Service Requests*.
    *   Select a 'Sacrament' request.
    *   Change status to **Scheduled**.
    *   Enter the confirmed date/time and notes.
    *   Once the event is done, change status to **Completed** to automatically add it to *Sacramental Records*.
