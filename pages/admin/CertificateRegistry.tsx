import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { useParish } from '../../context/ParishContext';
import { CertificateStatus, IssuedCertificate } from '../../types';
import { formatDate } from '../../utils/date';

const CertificateRegistry: React.FC = () => {
  const { issuedCertificates, downloadCertificateFile, generateCertificate } = useParish();
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [generateError, setGenerateError] = useState('');
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const filteredCertificates = issuedCertificates.filter((cert) =>
    [cert.recipientName, cert.requesterName, cert.type]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const pendingUploads = issuedCertificates.filter((cert) => cert.status === CertificateStatus.PENDING_UPLOAD).length;
  const completedUploads = issuedCertificates.filter((cert) => cert.status === CertificateStatus.UPLOADED).length;
  const totalCertificates = issuedCertificates.length;

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
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center">
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
              {filteredCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">#{cert.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{cert.type}</div>
                    <div className="text-xs text-gray-500">Requested by {cert.requesterName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{cert.recipientName}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div>Issued: {formatDate(cert.dateIssued)}</div>
                    {cert.uploadedAt && (
                      <div className="text-xs text-gray-500">
                        Uploaded: {formatDate(cert.uploadedAt)} {cert.uploadedBy && `by ${cert.uploadedBy}`}
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
                    {cert.status === CertificateStatus.PENDING_UPLOAD ? (
                      <button
                        onClick={() => handleGenerate(cert)}
                        disabled={
                          generatingId === cert.id ||
                          !/baptism|confirmation/.test(cert.type.toLowerCase())
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!/baptism|confirmation/.test(cert.type.toLowerCase()) ? 'Generation template not available yet for this type' : ''}
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
                    ) : (
                      <button
                        onClick={() => handleDownload(cert)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-parish-blue text-white hover:bg-blue-800 transition text-xs"
                      >
                        <Icons.Download size={14} /> Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCertificates.length === 0 && (
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
