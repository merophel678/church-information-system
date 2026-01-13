import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { useParish } from '../../context/ParishContext';
import { CertificateStatus, IssuedCertificate, RequestStatus, ServiceRequest } from '../../types';
import { formatDate } from '../../utils/date';

const CertificateRegistry: React.FC = () => {
  const { issuedCertificates, requests, downloadCertificateFile, generateCertificate } = useParish();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const searchLower = searchTerm.toLowerCase();
  const requestById = new Map(requests.map((req) => [req.id, req]));
  const normalizeText = (value?: string) => (value ? value.toLowerCase().replace(/\s+/g, ' ').trim() : '');
  const normalizeDateKey = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  };
  const normalizeTypeKey = (value: string) => {
    const normalized = value.toLowerCase();
    if (normalized.includes('baptism')) return 'baptism';
    if (normalized.includes('confirmation')) return 'confirmation';
    if (normalized.includes('marriage')) return 'marriage';
    if (normalized.includes('funeral') || normalized.includes('burial') || normalized.includes('death')) return 'funeral';
    return normalized;
  };

  const buildFallbackKey = (request?: ServiceRequest, cert?: IssuedCertificate) => {
    const typeSource = request?.serviceType ?? cert?.type ?? '';
    const typeKey = normalizeTypeKey(typeSource);
    if (!typeKey) return null;

    const certName = normalizeText(cert?.recipientName);
    if (typeKey === 'marriage') {
      const groom = normalizeText(request?.marriageGroomName);
      const bride = normalizeText(request?.marriageBrideName);
      const dateKey = normalizeDateKey(request?.marriageDate);
      const names = groom || bride ? `${groom}::${bride}` : certName;
      return `marriage::${names}::${dateKey}`;
    }

    if (typeKey === 'funeral') {
      const name = normalizeText(
        request?.certificateRecipientName ?? request?.funeralDeceasedName
      ) || certName;
      const dateKey = normalizeDateKey(request?.certificateRecipientDeathDate ?? request?.funeralDateOfDeath);
      return `funeral::${name}::${dateKey}`;
    }

    const name =
      normalizeText(request?.certificateRecipientName ?? request?.confirmationCandidateName) || certName;
    const birthKey = normalizeDateKey(request?.certificateRecipientBirthDate ?? request?.confirmationCandidateBirthDate);
    return `${typeKey}::${name}::${birthKey}`;
  };

  const fallbackKeyToRecordId = new Map<string, string>();
  requests.forEach((req) => {
    if (!req.recordId) return;
    const key = buildFallbackKey(req);
    if (key) {
      fallbackKeyToRecordId.set(key, req.recordId);
    }
  });

  const parseDateInput = (value: string, endOfDay = false) => {
    if (!value) return null;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00';
    const date = new Date(`${value}${suffix}`);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const matchesType = (type: string) => {
    if (typeFilter === 'ALL') return true;
    const normalized = type.toLowerCase();
    if (typeFilter === 'BAPTISM') return normalized.includes('baptism');
    if (typeFilter === 'CONFIRMATION') return normalized.includes('confirmation');
    if (typeFilter === 'MARRIAGE') return normalized.includes('marriage');
    if (typeFilter === 'DEATH') {
      return normalized.includes('death') || normalized.includes('funeral') || normalized.includes('burial');
    }
    return true;
  };

  const matchesStatus = (status: CertificateStatus) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return status === CertificateStatus.PENDING_UPLOAD;
    if (statusFilter === 'GENERATED') return status === CertificateStatus.UPLOADED;
    return true;
  };

  const matchesDate = (value: string) => {
    if (dateFilter === 'ALL') return true;
    const issued = new Date(value);
    if (Number.isNaN(issued.getTime())) return true;
    const now = new Date();
    if (dateFilter === 'LAST_7_DAYS') {
      const start = new Date(now);
      start.setDate(now.getDate() - 7);
      return issued >= start && issued <= now;
    }
    if (dateFilter === 'LAST_30_DAYS') {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      return issued >= start && issued <= now;
    }
    if (dateFilter === 'CUSTOM') {
      const start = parseDateInput(customStart);
      const end = parseDateInput(customEnd, true);
      if (start && end && start > end) {
        return false;
      }
      if (start && issued < start) return false;
      if (end && issued > end) return false;
      return true;
    }
    return true;
  };

  const groupedCertificates = issuedCertificates.reduce((acc, cert) => {
    const request = requestById.get(cert.requestId);
    const fallbackKey = buildFallbackKey(request, cert);
    const resolvedRecordId = request?.recordId ?? (fallbackKey ? fallbackKeyToRecordId.get(fallbackKey) : undefined);
    const recordKey =
      resolvedRecordId ??
      fallbackKey ??
      `${normalizeTypeKey(cert.type)}::${normalizeText(cert.recipientName)}`;
    if (!acc.has(recordKey)) {
      acc.set(recordKey, {
        key: recordKey,
        recordId: resolvedRecordId,
        certificates: [],
        requests: []
      });
    }
    acc.get(recordKey)?.certificates.push(cert);
    if (request) {
      acc.get(recordKey)?.requests.push(request);
    }
    return acc;
  }, new Map<string, { key: string; recordId?: string; certificates: IssuedCertificate[]; requests: ServiceRequest[] }>());

  const certificateGroups = Array.from(groupedCertificates.values()).map((group) => {
    const sorted = [...group.certificates].sort(
      (a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()
    );
    const latest = sorted[0];
    const latestUploaded = sorted
      .filter((cert) => cert.status === CertificateStatus.UPLOADED)
      .sort((a, b) => {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : new Date(a.dateIssued).getTime();
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : new Date(b.dateIssued).getTime();
        return bTime - aTime;
      })[0];
    const requestCandidates = new Map<string, ServiceRequest>();
    const recordRequests = group.recordId
      ? requests.filter((req) => req.recordId === group.recordId)
      : [];
    recordRequests.forEach((req) => requestCandidates.set(req.id, req));
    group.requests.forEach((req) => requestCandidates.set(req.id, req));
    const requestCount = Array.from(requestCandidates.values()).filter(
      (req) => req.status === RequestStatus.APPROVED || req.status === RequestStatus.COMPLETED
    ).length;

    return {
      ...group,
      latest,
      latestUploaded,
      issueCount: group.certificates.length,
      requestCount
    };
  });

  const filteredGroups = certificateGroups.filter((group) => {
    const cert = group.latest;
    const matchesSearch = [cert.recipientName, cert.requesterName, cert.type]
      .join(' ')
      .toLowerCase()
      .includes(searchLower);
    return (
      matchesSearch &&
      matchesType(cert.type) &&
      matchesStatus(cert.status) &&
      matchesDate(cert.dateIssued)
    );
  });
  const hasActiveFilters =
    searchTerm.trim() ||
    typeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    dateFilter !== 'ALL' ||
    customStart ||
    customEnd;

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setDateFilter('ALL');
    setCustomStart('');
    setCustomEnd('');
  };

  const statusChips = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending PDFs', value: 'PENDING' },
    { label: 'Generated', value: 'GENERATED' }
  ];

  const pendingUploads = certificateGroups.filter((group) => group.latest.status === CertificateStatus.PENDING_UPLOAD).length;
  const completedUploads = certificateGroups.filter((group) => group.latest.status === CertificateStatus.UPLOADED).length;
  const totalCertificates = certificateGroups.length;

  const handleGenerate = async (cert: IssuedCertificate) => {
    setGenerateError('');
    setGeneratingId(cert.id);
    try {
      await generateCertificate(cert.id);
    } catch (err: any) {
      const raw = err?.message || '';
      const friendly = raw.includes('No baptism record linked')
        ? 'Cannot generate: no baptism record is linked to this certificate. Please link/create the baptism record for this person and retry.'
        : raw.includes('No confirmation record linked')
          ? 'Cannot generate: no confirmation record is linked to this certificate. Please complete the confirmation record and retry.'
        : raw.includes('No marriage record linked')
          ? 'Cannot generate: no marriage record is linked to this certificate. Please complete the marriage record and retry.'
        : raw.includes('No funeral record linked')
          ? 'Cannot generate: no funeral/burial record is linked to this certificate. Please complete the funeral record and retry.'
        : 'Unable to generate certificate right now. Please verify the linked sacrament record and try again.';
      setGenerateError(friendly);
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownload = async (certificate: IssuedCertificate) => {
    setDownloadError('');
    try {
      const { blob, filename } = await downloadCertificateFile(certificate.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('Unable to download certificate. Please try again later.');
    }
  };

  const statusBadge = (cert: IssuedCertificate) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1';
    if (cert.status === CertificateStatus.UPLOADED) {
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          <Icons.CheckCircle size={14} /> Generated
        </span>
      );
    }
    return (
      <span className={`${base} bg-amber-100 text-amber-800`}>
        <Icons.Printer size={14} /> Pending PDF
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-parish-blue">
          <Icons.Home size={20} />
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Certificate Registry</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <Icons.UploadCloud size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Pending PDFs</p>
            <p className="text-2xl font-bold">{pendingUploads}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Icons.FileCheck size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Generated PDFs</p>
            <p className="text-2xl font-bold">{completedUploads}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-full">
            <Icons.AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Certificates</p>
            <p className="text-2xl font-bold">{totalCertificates}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by recipient, requester, or type..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-parish-blue focus:border-parish-blue outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {(downloadError || generateError) && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <Icons.AlertTriangle size={16} /> {downloadError || generateError}
              </div>
            )}
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <select
              className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="BAPTISM">Baptism</option>
              <option value="CONFIRMATION">Confirmation</option>
              <option value="MARRIAGE">Marriage</option>
              <option value="DEATH">Death</option>
            </select>

            <select
              className="w-full md:w-48 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending PDF</option>
              <option value="GENERATED">Generated</option>
            </select>

            <select
              className="w-full md:w-56 border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm bg-white"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="ALL">All Dates</option>
              <option value="LAST_7_DAYS">Last 7 days</option>
              <option value="LAST_30_DAYS">Last 30 days</option>
              <option value="CUSTOM">Custom range</option>
            </select>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear filters
            </button>
          </div>
          {dateFilter === 'CUSTOM' && (
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Start date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">End date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-gray-100">
          <div className="text-xs text-gray-500">
            Showing {filteredGroups.length} of {totalCertificates} certificates
          </div>
          <div className="flex flex-wrap gap-2">
            {statusChips.map((chip) => {
              const isActive = statusFilter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setStatusFilter(chip.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${isActive ? 'bg-parish-blue text-white border-parish-blue' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'}`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Certificate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Recipient</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Issuance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PDF Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGroups.map((group) => {
                const cert = group.latest;
                const downloadTarget = group.latestUploaded ?? cert;
                return (
                <tr key={group.key} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{cert.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{cert.type}</div>
                    <div className="text-xs text-gray-500">Requested by {cert.requesterName}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">Issues: {group.issueCount}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">Requests: {group.requestCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{cert.recipientName}</div>
                    {group.issueCount > 1 && (
                      <div className="text-xs text-amber-700 mt-1">Reissued {group.issueCount - 1}x</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>Issued: {formatDate(cert.dateIssued)}</div>
                    {downloadTarget.status === CertificateStatus.UPLOADED && downloadTarget.uploadedAt && (
                      <div className="text-xs text-gray-500">
                        Last uploaded: {formatDate(downloadTarget.uploadedAt)} {downloadTarget.uploadedBy && `by ${downloadTarget.uploadedBy}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 space-y-2">
                    {statusBadge(cert)}
                    {cert.notes && (
                      <div className="text-xs text-gray-500 italic truncate max-w-[160px]" title={cert.notes}>
                        {cert.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-y-2">
                    {cert.status === CertificateStatus.PENDING_UPLOAD && (
                      <button
                        onClick={() => handleGenerate(cert)}
                        disabled={
                          generatingId === cert.id ||
                          !/baptism|confirmation|marriage|funeral|burial|death/.test(cert.type.toLowerCase())
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!/baptism|confirmation|marriage|funeral|burial|death/.test(cert.type.toLowerCase()) ? 'Generation template not available yet for this type' : ''}
                      >
                        {generatingId === cert.id ? (
                          <>
                            <Icons.Loader2 className="animate-spin" size={14} /> Generating...
                          </>
                        ) : (
                          <>
                            <Icons.Printer size={14} /> Generate PDF
                          </>
                        )}
                      </button>
                    )}
                    {downloadTarget.status === CertificateStatus.UPLOADED && (
                      <button
                        onClick={() => handleDownload(downloadTarget)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-parish-blue text-white hover:bg-blue-800 transition text-xs"
                      >
                        <Icons.Download size={14} /> Download
                      </button>
                    )}
                  </td>
                </tr>
              )})}
              {filteredGroups.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No certificates found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CertificateRegistry;
