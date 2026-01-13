export enum SacramentType {
  BAPTISM = 'BAPTISM',
  CONFIRMATION = 'CONFIRMATION',
  MARRIAGE = 'MARRIAGE',
  FUNERAL = 'FUNERAL'
}

export interface SacramentRecord {
  id: string;
  name: string;
  date: string;
  type: SacramentType;
  officiant: string;
  details: string; // e.g., Parents, Witnesses
  fatherName?: string;
  motherName?: string;
  birthDate?: string;
  birthPlace?: string;
  baptismDate?: string;
  baptismPlace?: string;
  sponsors?: string;
  registerBook?: string;
  registerPage?: string;
  registerLine?: string;
  isArchived: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}

export type SacramentRecordInput = Omit<SacramentRecord, 'id' | 'isArchived' | 'archivedAt' | 'archivedBy' | 'archiveReason'>;
export type SacramentRecordDetails = Partial<SacramentRecordInput>;

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  isPublic: boolean;
  imageUrl?: string; // Optional image for the bulletin
}

export interface MassSchedule {
  id: string; // Added ID for management
  day: string;
  time: string;
  description: string;
  location: string;
}

export interface ScheduleNote {
  id: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionLink?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: string; // String to accommodate currency symbols or "In Kind"
  purpose: string; // e.g., "Church Construction", "Fiesta"
  date: string;
  isAnonymous: boolean;
}

export enum RequestCategory {
  SACRAMENT = 'SACRAMENT',
  CERTIFICATE = 'CERTIFICATE'
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED'
}

export interface ServiceRequest {
  id: string;
  category: RequestCategory;
  serviceType: string; // e.g., "Baptism", "Marriage Certificate"
  requesterName: string;
  contactInfo: string; // Email or Phone
  preferredDate?: string; // Relevant for sacraments
  details: string; // Purpose or additional info
  confirmationCandidateName?: string;
  confirmationCandidateBirthDate?: string;
  certificateRecipientName?: string;
  certificateRecipientBirthDate?: string;
  requesterRelationship?: string;
  status: RequestStatus;
  submissionDate: string;
  // New fields for status logic
  confirmedSchedule?: string; // For 'Scheduled' status
  adminNotes?: string; // For 'Approved', 'Rejected', or general notes
}

export enum DeliveryMethod {
  PICKUP = 'PICKUP',
  EMAIL = 'EMAIL',
  COURIER = 'COURIER'
}

export enum CertificateStatus {
  PENDING_UPLOAD = 'PENDING_UPLOAD',
  UPLOADED = 'UPLOADED'
}

export interface IssuedCertificate {
  id: string;
  requestId: string;
  type: string;
  recipientName: string;
  requesterName: string;
  dateIssued: string;
  issuedBy: string;
  deliveryMethod: DeliveryMethod;
  notes?: string;
  status: CertificateStatus;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  needsUploadReminder?: boolean;
}

export enum UserRole {
  GUEST = 'GUEST',
  ADMIN = 'ADMIN'
}

export interface User {
  username: string;
  role: UserRole;
}
