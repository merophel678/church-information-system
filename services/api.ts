import { Announcement, DeliveryMethod, Donation, IssuedCertificate, MassSchedule, RequestCategory, SacramentRecord, SacramentRecordDetails, ScheduleNote, ServiceRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

type Token = string | null | undefined;

async function apiRequest<T>(path: string, options: RequestInit = {}, token?: Token): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const api = {
  login: (payload: { username: string; password: string }) =>
    apiRequest<{ token: string; user: { id: string; username: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Schedules
  getSchedules: () => apiRequest<MassSchedule[]>('/schedules'),
  createSchedule: (data: Omit<MassSchedule, 'id'>, token?: Token) =>
    apiRequest<MassSchedule>('/schedules', { method: 'POST', body: JSON.stringify(data) }, token),
  updateSchedule: (id: string, data: Omit<MassSchedule, 'id'>, token?: Token) =>
    apiRequest<MassSchedule>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteSchedule: (id: string, token?: Token) =>
    apiRequest<null>(`/schedules/${id}`, { method: 'DELETE' }, token),

  // Announcements
  getAnnouncements: () => apiRequest<Announcement[]>('/announcements'),
  createAnnouncement: (data: Omit<Announcement, 'id'>, token?: Token) =>
    apiRequest<Announcement>('/announcements', { method: 'POST', body: JSON.stringify(data) }, token),
  updateAnnouncement: (id: string, data: Partial<Announcement>, token?: Token) =>
    apiRequest<Announcement>(`/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteAnnouncement: (id: string, token?: Token) =>
    apiRequest<null>(`/announcements/${id}`, { method: 'DELETE' }, token),

  // Donations
  getDonations: () => apiRequest<Donation[]>('/donations'),
  createDonation: (data: Omit<Donation, 'id'>, token?: Token) =>
    apiRequest<Donation>('/donations', { method: 'POST', body: JSON.stringify(data) }, token),
  updateDonation: (id: string, data: Partial<Donation>, token?: Token) =>
    apiRequest<Donation>(`/donations/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteDonation: (id: string, token?: Token) =>
    apiRequest<null>(`/donations/${id}`, { method: 'DELETE' }, token),

  getScheduleNote: () => apiRequest<ScheduleNote | null>('/schedules/note'),
  updateScheduleNote: (data: { title: string; body: string; actionLabel?: string; actionLink?: string }, token?: Token) =>
    apiRequest<ScheduleNote>('/schedules/note', { method: 'PUT', body: JSON.stringify(data) }, token),

  // Requests
  getRequests: (token?: Token) =>
    apiRequest<ServiceRequest[]>('/requests', { method: 'GET' }, token),
  createRequest: (data: {
    category: RequestCategory;
    serviceType: string;
    requesterName: string;
    contactInfo: string;
    preferredDate?: string;
    details: string;
    confirmationCandidateName?: string;
    confirmationCandidateBirthDate?: string;
    funeralDeceasedName?: string;
    funeralResidence?: string;
    funeralDateOfDeath?: string;
    funeralPlaceOfBurial?: string;
    certificateRecipientName?: string;
    certificateRecipientBirthDate?: string;
    certificateRecipientDeathDate?: string;
    requesterRelationship?: string;
  }) => apiRequest<ServiceRequest>('/requests', { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (
    id: string,
    updates: Partial<ServiceRequest> & { recordDetails?: SacramentRecordDetails },
    token?: Token
  ) =>
    apiRequest<ServiceRequest>(`/requests/${id}`, { method: 'PUT', body: JSON.stringify(updates) }, token),
  deleteRequest: (id: string, token?: Token) =>
    apiRequest<null>(`/requests/${id}`, { method: 'DELETE' }, token),
  issueCertificate: (
    id: string,
    data: { deliveryMethod: DeliveryMethod; notes?: string; issuedBy: string },
    token?: Token
  ) =>
    apiRequest<IssuedCertificate>(`/requests/${id}/issue`, { method: 'POST', body: JSON.stringify(data) }, token),
  generateCertificate: (id: string, token?: Token) =>
    apiRequest<IssuedCertificate>(`/certificates/${id}/generate`, { method: 'POST' }, token),

  // Records and certificates
  getRecords: (token?: Token, includeArchived = true) =>
    apiRequest<SacramentRecord[]>(`/records${includeArchived ? '?includeArchived=true' : ''}`, { method: 'GET' }, token),
  createRecord: (data: Omit<SacramentRecord, 'id'>, token?: Token) =>
    apiRequest<SacramentRecord>('/records', { method: 'POST', body: JSON.stringify(data) }, token),
  updateRecord: (id: string, data: Partial<SacramentRecord>, token?: Token) =>
    apiRequest<SacramentRecord>(`/records/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  archiveRecord: (id: string, reason: string | undefined, token?: Token) =>
    apiRequest<SacramentRecord>(`/records/${id}/archive`, { method: 'POST', body: JSON.stringify({ reason }) }, token),
  unarchiveRecord: (id: string, token?: Token) =>
    apiRequest<SacramentRecord>(`/records/${id}/unarchive`, { method: 'POST' }, token),
  getCertificates: (token?: Token) =>
    apiRequest<IssuedCertificate[]>('/certificates', { method: 'GET' }, token),
  uploadCertificateFile: (id: string, file: File, token?: Token) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<IssuedCertificate>(`/certificates/${id}/upload`, { method: 'POST', body: formData }, token);
  },
  downloadCertificateFile: async (id: string, token?: Token) => {
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const response = await fetch(`${API_BASE_URL}/certificates/${id}/file`, { headers });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Unable to download certificate');
    }
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
    const filename = match ? match[1] : 'certificate';
    return { blob, filename };
  }
};
