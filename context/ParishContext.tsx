import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { MassSchedule, Announcement, Donation, ServiceRequest, IssuedCertificate, DeliveryMethod, SacramentRecord, RequestCategory, RequestStatus, ScheduleNote, SacramentRecordDetails } from '../types';
import { api } from '../services/api';

interface ParishContextType {
  schedules: MassSchedule[];
  scheduleNote: ScheduleNote | null;
  announcements: Announcement[];
  donations: Donation[];
  requests: ServiceRequest[];
  issuedCertificates: IssuedCertificate[];
  records: SacramentRecord[];
  isPublicLoading: boolean;
  isAdminLoading: boolean;
  refreshPublicData: () => Promise<void>;
  refreshAdminData: () => Promise<void>;
  addSchedule: (schedule: Omit<MassSchedule, 'id'>) => Promise<void>;
  updateSchedule: (schedule: MassSchedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  saveScheduleNote: (data: { title: string; body: string; actionLabel?: string; actionLink?: string }) => Promise<void>;
  addAnnouncement: (announcement: Omit<Announcement, 'id'>) => Promise<void>;
  updateAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  addDonation: (donation: Omit<Donation, 'id'>) => Promise<void>;
  updateDonation: (donation: Donation) => Promise<void>;
  deleteDonation: (id: string) => Promise<void>;
  addRequest: (request: Omit<ServiceRequest, 'id' | 'status' | 'submissionDate'>) => Promise<void>;
  updateRequest: (id: string, updates: Partial<ServiceRequest> & { recordDetails?: SacramentRecordDetails }) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  issueCertificate: (requestId: string, details: { deliveryMethod: DeliveryMethod; notes: string; issuedBy: string }) => Promise<void>;
  uploadCertificateFile: (certificateId: string, file: File) => Promise<void>;
  downloadCertificateFile: (certificateId: string) => Promise<{ blob: Blob; filename: string }>;
  addRecord: (record: Omit<SacramentRecord, 'id'>) => Promise<void>;
  updateRecord: (record: SacramentRecord) => Promise<void>;
  archiveRecord: (id: string, reason?: string) => Promise<void>;
  unarchiveRecord: (id: string) => Promise<void>;
}

interface ParishProviderProps {
  children: ReactNode;
  authToken?: string | null;
}

const ParishContext = createContext<ParishContextType | undefined>(undefined);

export const ParishProvider: React.FC<ParishProviderProps> = ({ children, authToken }) => {
  const [schedules, setSchedules] = useState<MassSchedule[]>([]);
  const [scheduleNote, setScheduleNote] = useState<ScheduleNote | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [isPublicLoading, setIsPublicLoading] = useState(true);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const fetchPublicData = useCallback(async () => {
    try {
      setIsPublicLoading(true);
      const [scheduleData, noteData, announcementData, donationData] = await Promise.all([
        api.getSchedules(),
        api.getScheduleNote(),
        api.getAnnouncements(),
        api.getDonations()
      ]);
      setSchedules(scheduleData);
      setScheduleNote(noteData);
      setAnnouncements(announcementData);
      setDonations(donationData);
    } catch (error) {
      console.error('Failed to load public data', error);
    } finally {
      setIsPublicLoading(false);
    }
  }, []);

  const fetchAdminData = useCallback(async () => {
    if (!authToken) {
      setRequests([]);
      setIssuedCertificates([]);
      setRecords([]);
      return;
    }

    try {
      setIsAdminLoading(true);
      const [requestData, certificateData, recordData] = await Promise.all([
        api.getRequests(authToken),
        api.getCertificates(authToken),
        api.getRecords(authToken, true)
      ]);
      setRequests(requestData);
      setIssuedCertificates(certificateData);
      setRecords(recordData);
    } catch (error) {
      console.error('Failed to load admin data', error);
    } finally {
      setIsAdminLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchPublicData();
  }, [fetchPublicData]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const requireAuth = () => {
    if (!authToken) {
      throw new Error('Authentication required');
    }
    return authToken;
  };

  const addSchedule = async (schedule: Omit<MassSchedule, 'id'>) => {
    const token = requireAuth();
    const created = await api.createSchedule(schedule, token);
    setSchedules((prev) => [...prev, created]);
  };

  const saveScheduleNote = async (data: { title: string; body: string; actionLabel?: string; actionLink?: string }) => {
    const token = requireAuth();
    const updated = await api.updateScheduleNote(data, token);
    setScheduleNote(updated);
  };

  const updateSchedule = async (schedule: MassSchedule) => {
    const token = requireAuth();
    const updated = await api.updateSchedule(schedule.id, schedule, token);
    setSchedules((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteSchedule = async (id: string) => {
    const token = requireAuth();
    await api.deleteSchedule(id, token);
    setSchedules((prev) => prev.filter((item) => item.id !== id));
  };

  const addAnnouncement = async (announcement: Omit<Announcement, 'id'>) => {
    const token = requireAuth();
    const created = await api.createAnnouncement(announcement, token);
    setAnnouncements((prev) => [created, ...prev]);
  };

  const updateAnnouncement = async (announcement: Announcement) => {
    const token = requireAuth();
    const updated = await api.updateAnnouncement(announcement.id, announcement, token);
    setAnnouncements((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteAnnouncement = async (id: string) => {
    const token = requireAuth();
    await api.deleteAnnouncement(id, token);
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));
  };

  const addDonation = async (donation: Omit<Donation, 'id'>) => {
    const token = requireAuth();
    const created = await api.createDonation(donation, token);
    setDonations((prev) => [created, ...prev]);
  };

  const updateDonation = async (donation: Donation) => {
    const token = requireAuth();
    const updated = await api.updateDonation(donation.id, donation, token);
    setDonations((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const deleteDonation = async (id: string) => {
    const token = requireAuth();
    await api.deleteDonation(id, token);
    setDonations((prev) => prev.filter((item) => item.id !== id));
  };

  const addRecord = async (record: Omit<SacramentRecord, 'id'>) => {
    const token = requireAuth();
    const created = await api.createRecord(record, token);
    setRecords((prev) => [created, ...prev]);
  };

  const updateRecord = async (record: SacramentRecord) => {
    const token = requireAuth();
    const updated = await api.updateRecord(record.id, record, token);
    setRecords((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const archiveRecord = async (id: string, reason?: string) => {
    const token = requireAuth();
    const updated = await api.archiveRecord(id, reason, token);
    setRecords((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const unarchiveRecord = async (id: string) => {
    const token = requireAuth();
    const updated = await api.unarchiveRecord(id, token);
    setRecords((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const addRequest = async (request: Omit<ServiceRequest, 'id' | 'status' | 'submissionDate'>) => {
    const created = await api.createRequest(request);
    if (authToken) {
      setRequests((prev) => [created, ...prev]);
    }
  };

  const updateRequest = async (id: string, updates: Partial<ServiceRequest> & { recordDetails?: SacramentRecordDetails }) => {
    const token = requireAuth();
    const updated = await api.updateRequest(id, updates, token);
    setRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    if (updates.status === RequestStatus.COMPLETED && updated.category === RequestCategory.SACRAMENT) {
      await fetchAdminData();
    }
  };

  const deleteRequest = async (id: string) => {
    const token = requireAuth();
    await api.deleteRequest(id, token);
    setRequests((prev) => prev.filter((item) => item.id !== id));
  };

  const issueCertificate = async (
    requestId: string,
    details: { deliveryMethod: DeliveryMethod; notes: string; issuedBy: string }
  ) => {
    const token = requireAuth();
    const certificate = await api.issueCertificate(requestId, details, token);
    setIssuedCertificates((prev) => [certificate, ...prev]);
    setRequests((prev) =>
      prev.map((item) =>
        item.id === requestId ? { ...item, status: RequestStatus.COMPLETED } : item
      )
    );
  };

  const uploadCertificateFile = async (certificateId: string, file: File) => {
    const token = requireAuth();
    const updated = await api.uploadCertificateFile(certificateId, file, token);
    setIssuedCertificates((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  const downloadCertificateFile = async (certificateId: string) => {
    const token = requireAuth();
    return api.downloadCertificateFile(certificateId, token);
  };

  return (
    <ParishContext.Provider
      value={{
        schedules,
        scheduleNote,
        announcements,
        donations,
        requests,
        issuedCertificates,
        records,
        isPublicLoading,
        isAdminLoading,
        refreshPublicData: fetchPublicData,
        refreshAdminData: fetchAdminData,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        saveScheduleNote,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addDonation,
        updateDonation,
        deleteDonation,
        addRequest,
        updateRequest,
        deleteRequest,
        issueCertificate,
        uploadCertificateFile,
        downloadCertificateFile,
        addRecord,
        updateRecord,
        archiveRecord,
        unarchiveRecord
      }}
    >
      {children}
    </ParishContext.Provider>
  );
};

export const useParish = () => {
  const context = useContext(ParishContext);
  if (context === undefined) {
    throw new Error('useParish must be used within a ParishProvider');
  }
  return context;
};
