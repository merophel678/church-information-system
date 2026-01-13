import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { useParish } from '../../context/ParishContext';
import { RequestStatus, RequestCategory, ServiceRequest, DeliveryMethod, SacramentRecordDetails, SacramentType } from '../../types';
import { formatDate } from '../../utils/date';
import { humanize } from '../../utils/text';
import { useDialog } from '../../context/DialogContext';

const parishPlaceDefault = 'Quasi Parish of Our Lady of the Miraculous Medal, Sabang, Borongan City';

const ManageRequests: React.FC = () => {
  const { requests, updateRequest, deleteRequest, issueCertificate, issuedCertificates, records } = useParish();
  const { confirm, alert } = useDialog();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedRequestForIssue, setSelectedRequestForIssue] = useState<ServiceRequest | null>(null);
  const [issueData, setIssueData] = useState({
    deliveryMethod: DeliveryMethod.PICKUP,
    notes: '',
    issuedBy: 'Administrator'
  });

  // Status Update Modal State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<{ req: ServiceRequest, newStatus: RequestStatus } | null>(null);
  const [statusFormData, setStatusFormData] = useState({
    confirmedSchedule: '',
    adminNotes: ''
  });

  // Completion Modal State (for sacrament completion)
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [completionTarget, setCompletionTarget] = useState<ServiceRequest | null>(null);
  const [completionFormData, setCompletionFormData] = useState<SacramentRecordDetails>({
    name: '',
    date: '',
    type: SacramentType.BAPTISM,
    officiant: '',
    details: '',
    baptismPlace: parishPlaceDefault
  });
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);

  const hasCertificate = (requestId: string) =>
    issuedCertificates.some((cert) => cert.requestId === requestId);

  const hasRecord = (requestId: string) =>
    records.some((rec) => rec.requestId === requestId && !rec.isArchived);

  const filteredRequests = requests.filter(req => {
    const matchesStatus = filterStatus === 'ALL' || req.status === filterStatus;
    const matchesCategory = filterCategory === 'ALL' || req.category === filterCategory;
    const matchesSearch = req.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.serviceType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case RequestStatus.APPROVED: return 'bg-blue-100 text-blue-800';
      case RequestStatus.SCHEDULED: return 'bg-purple-100 text-purple-800';
      case RequestStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case RequestStatus.REJECTED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirm({
      title: 'Delete service request?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      destructive: true
    });
    if (!shouldDelete) return;
    try {
      await deleteRequest(id);
    } catch (error) {
      await alert({
        title: 'Unable to delete request',
        message: 'Please try again later.'
      });
    }
  };

  // --- Status Change Logic ---
  const inferSacramentType = (serviceType: string): SacramentType => {
    const normalized = serviceType.toLowerCase();
    if (normalized.includes('baptism')) return SacramentType.BAPTISM;
    if (normalized.includes('confirmation')) return SacramentType.CONFIRMATION;
    if (normalized.includes('marriage')) return SacramentType.MARRIAGE;
    if (normalized.includes('funeral')) return SacramentType.FUNERAL;
    return SacramentType.BAPTISM;
  };

  const handleStatusChangeRequest = (req: ServiceRequest, newStatus: RequestStatus) => {
    if (newStatus === RequestStatus.COMPLETED && req.category === RequestCategory.SACRAMENT && hasRecord(req.id)) {
      alert({
        title: 'Record already exists',
        message: 'A sacrament record is already linked to this request. Please edit the record instead of completing again.'
      });
      return;
    }
    // If status requires extra info, open modal
    if (newStatus === RequestStatus.SCHEDULED || newStatus === RequestStatus.APPROVED || newStatus === RequestStatus.REJECTED) {
      setStatusUpdateTarget({ req, newStatus });
      setStatusFormData({
        confirmedSchedule: req.confirmedSchedule || req.preferredDate || '',
        adminNotes: req.adminNotes || ''
      });
      setIsStatusModalOpen(true);
    } else if (newStatus === RequestStatus.COMPLETED && req.category === RequestCategory.SACRAMENT) {
      const possibleDate = req.confirmedSchedule?.split(' ')[0] || req.preferredDate || new Date().toISOString().split('T')[0];
      setCompletionTarget(req);
      setCompletionFormData({
        name: '',
        date: possibleDate || '',
        type: inferSacramentType(req.serviceType),
        officiant: '',
        details: '',
        baptismPlace: parishPlaceDefault,
        birthDate: '',
        birthPlace: '',
        fatherName: '',
        motherName: '',
        sponsors: '',
        registerBook: '',
        registerPage: '',
        registerLine: ''
      });
      setIsCompletionModalOpen(true);
    } else {
      // Direct update for other statuses
      updateRequest(req.id, { status: newStatus });
    }
  };

  const confirmStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusUpdateTarget) return;

    const updates: Partial<ServiceRequest> = {
      status: statusUpdateTarget.newStatus,
      adminNotes: statusFormData.adminNotes
    };

    if (statusUpdateTarget.newStatus === RequestStatus.SCHEDULED) {
      updates.confirmedSchedule = statusFormData.confirmedSchedule;
    }

    try {
      await updateRequest(statusUpdateTarget.req.id, updates);
      setIsStatusModalOpen(false);
      setStatusUpdateTarget(null);
    } catch (error) {
      await alert({
        title: 'Unable to update status',
        message: 'Please try again.'
      });
    }
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionTarget) return;
    if (completionFormData.birthDate && completionFormData.date && completionFormData.birthDate > completionFormData.date) {
      await alert({
        title: 'Invalid birth date',
        message: 'Birth date cannot be later than the sacrament date.'
      });
      return;
    }
    setIsSavingCompletion(true);
    try {
      await updateRequest(completionTarget.id, {
        status: RequestStatus.COMPLETED,
        recordDetails: completionFormData
      });
      setIsCompletionModalOpen(false);
      setCompletionTarget(null);
    } catch (error) {
      await alert({
        title: 'Unable to mark as completed',
        message: 'Please check the details and try again.'
      });
    } finally {
      setIsSavingCompletion(false);
    }
  };

  // --- Issue Logic ---
  const openIssueModal = (request: ServiceRequest) => {
    setSelectedRequestForIssue(request);
    setIsIssueModalOpen(true);
    setIssueData({
      deliveryMethod: DeliveryMethod.PICKUP,
      notes: '',
      issuedBy: 'Administrator'
    });
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRequestForIssue) {
      try {
        await issueCertificate(selectedRequestForIssue.id, issueData);
        setIsIssueModalOpen(false);
        setSelectedRequestForIssue(null);
      } catch (error) {
        await alert({
          title: 'Unable to issue certificate',
          message: 'Please try again shortly.'
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/dashboard" className="text-gray-500 hover:text-parish-blue">
          <Icons.Home size={20} />
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Manage Service Requests</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or service..." 
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-parish-blue focus:border-parish-blue outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Icons.Filter size={18} className="text-gray-500" />
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                {Object.values(RequestStatus).map(status => (
                  <option key={status} value={status}>{humanize(status)}</option>
                ))}
              </select>
              
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 outline-none text-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                {Object.values(RequestCategory).map(cat => (
                  <option key={cat} value={cat}>{humanize(cat)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{req.requesterName}</div>
                    <div className="text-xs text-gray-500">{req.contactInfo}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">{req.serviceType}</div>
                    <span className={`text-xs inline-flex px-2 py-0.5 rounded-full mt-1 ${req.category === RequestCategory.SACRAMENT ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                      {humanize(req.category)}
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasRecord(req.id) && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                          <Icons.BookOpen size={12} /> Record exists
                        </span>
                      )}
                      {hasCertificate(req.id) && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 flex items-center gap-1">
                          <Icons.FileCheck size={12} /> Cert issued
                        </span>
                      )}
                    </div>
                    {req.confirmedSchedule && (
                      <div className="mt-1 flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit">
                        <Icons.Clock size={12} />
                        {req.confirmedSchedule}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate" title={req.details}>
                      {req.details}
                    </div>
                    {req.preferredDate && !req.confirmedSchedule && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                         <Icons.Calendar size={12} /> Pref: {req.preferredDate}
                      </div>
                    )}
                    {req.adminNotes && (
                       <div className="mt-1 text-xs text-gray-500 italic flex items-start gap-1" title={req.adminNotes}>
                         <Icons.FileText size={12} className="mt-0.5 text-gray-400" />
                         <span className="truncate max-w-[150px]">{req.adminNotes}</span>
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select 
                      className={`text-xs font-semibold rounded-full px-2 py-1 border-none outline-none cursor-pointer ${getStatusColor(req.status)}`}
                      value={req.status}
                      onChange={(e) => handleStatusChangeRequest(req, e.target.value as RequestStatus)}
                    >
                      {Object.values(RequestStatus).map(status => (
                        <option key={status} value={status}>{humanize(status)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(req.submissionDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      {req.category === RequestCategory.CERTIFICATE && req.status !== RequestStatus.COMPLETED && req.status !== RequestStatus.REJECTED && (
                        <>
                          {hasCertificate(req.id) ? (
                            <span className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded px-2 py-1 flex items-center gap-1" title="Certificate already issued">
                              <Icons.FileCheck size={14} /> Issued
                            </span>
                          ) : (
                            <button 
                              onClick={() => openIssueModal(req)}
                              className="text-teal-600 hover:text-teal-900 p-1 border border-teal-200 rounded bg-teal-50 text-xs px-2"
                            >
                              Issue Cert
                            </button>
                          )}
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(req.id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Delete Request"
                      >
                        <Icons.X size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No requests found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      {isIssueModalOpen && selectedRequestForIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Issue Certificate</h3>
              <button onClick={() => setIsIssueModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X size={24} />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-teal-50 rounded-lg border border-teal-100">
              <div className="flex gap-3">
                <Icons.FileCheck className="text-teal-600 mt-1" size={20} />
                <div>
                  <p className="font-medium text-teal-900">{selectedRequestForIssue.serviceType}</p>
                  <p className="text-sm text-teal-700">For: {selectedRequestForIssue.requesterName}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                  value={issueData.deliveryMethod}
                  onChange={(e) => setIssueData({...issueData, deliveryMethod: e.target.value as DeliveryMethod})}
                >
                  {Object.values(DeliveryMethod).map(method => (
                    <option key={method} value={method}>{humanize(method)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Reference No.</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                  rows={3}
                  placeholder="e.g. OR No. 12345, ID presented..."
                  value={issueData.notes}
                  onChange={(e) => setIssueData({...issueData, notes: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold hover:bg-teal-700 transition flex items-center justify-center gap-2"
                >
                  <Icons.CheckCircle size={18} /> Confirm Issuance
                </button>
                <p className="text-xs text-gray-500 text-center mt-3">
                  This will mark the request as COMPLETED and archive the issuance record.
                </p>
              </div>
            </form>
      </div>
        </div>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && statusUpdateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Update Status: {statusUpdateTarget.newStatus}</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X size={24} />
              </button>
            </div>

            <form onSubmit={confirmStatusUpdate} className="space-y-4">
              {statusUpdateTarget.newStatus === RequestStatus.SCHEDULED && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmed Date & Time</label>
                  <input 
                    type="text"
                    placeholder="e.g., Dec 25, 2023 at 10:00 AM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={statusFormData.confirmedSchedule}
                    onChange={(e) => setStatusFormData({...statusFormData, confirmedSchedule: e.target.value})}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Preferred: {statusUpdateTarget.req.preferredDate || 'None'}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                  rows={3}
                  placeholder={statusUpdateTarget.newStatus === RequestStatus.REJECTED ? "Reason for rejection..." : "Additional instructions or remarks..."}
                  value={statusFormData.adminNotes}
                  onChange={(e) => setStatusFormData({...statusFormData, adminNotes: e.target.value})}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="submit" 
                  className="flex-1 bg-parish-blue text-white py-2 rounded-lg font-bold hover:bg-blue-800 transition"
                >
                  Confirm Update
                </button>
                <button 
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Details Modal for Sacraments */}
      {isCompletionModalOpen && completionTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm text-gray-500">Mark as Completed</p>
                <h3 className="text-xl font-bold text-gray-900">{completionTarget.serviceType}</h3>
                <p className="text-sm text-gray-600">Requester: {completionTarget.requesterName}</p>
              </div>
              <button onClick={() => setIsCompletionModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <Icons.X size={24} />
              </button>
            </div>

            <form onSubmit={handleCompletionSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sacrament Type</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.type || SacramentType.BAPTISM}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, type: e.target.value as SacramentType })}
                    disabled
                  >
                    {Object.values(SacramentType).map((type) => (
                      <option key={type} value={type}>{humanize(type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.name ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Sacrament</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.date ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.birthDate ?? ''}
                    max={completionFormData.date || undefined}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, birthDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Officiant</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.officiant ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, officiant: e.target.value })}
                    placeholder="e.g., Fr. Juan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Birth Place</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.birthPlace ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, birthPlace: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Place of Baptism</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.baptismPlace ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, baptismPlace: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.fatherName ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, fatherName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.motherName ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, motherName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsors</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                  rows={2}
                  placeholder="List sponsors/godparents"
                  value={completionFormData.sponsors ?? ''}
                  onChange={(e) => setCompletionFormData({ ...completionFormData, sponsors: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Register Book</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.registerBook ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, registerBook: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Page</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.registerPage ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, registerPage: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Line</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    value={completionFormData.registerLine ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, registerLine: e.target.value })}
                  />
                </div>
              </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                    rows={3}
                    value={completionFormData.details ?? ''}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, details: e.target.value })}
                  />
                </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSavingCompletion}
                  className="flex-1 bg-parish-blue text-white py-2 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingCompletion ? <Icons.Loader2 className="animate-spin" size={18} /> : <Icons.CheckCircle size={18} />}
                  Save & Mark Completed
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompletionModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRequests;
