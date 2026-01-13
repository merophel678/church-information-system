import React, { useState } from 'react';
import { useParish } from '../context/ParishContext';
import { SacramentType, SacramentRecord } from '../types';
import { Icons } from '../components/Icons';
import { formatDate } from '../utils/date';
import { humanize } from '../utils/text';
import { useDialog } from '../context/DialogContext';

const Records: React.FC = () => {
  const { records, addRecord, updateRecord, archiveRecord, unarchiveRecord } = useParish();
  const { prompt, alert, confirm } = useDialog();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SacramentRecord | null>(null);

  const parishPlaceDefault = 'Quasi Parish of Our Lady of the Miraculous Medal, Sabang, Borongan City';
  const initialFormState = {
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: SacramentType.BAPTISM,
    officiant: '',
    details: '',
    fatherName: '',
    motherName: '',
    birthDate: '',
    birthPlace: '',
    baptismDate: '',
    baptismPlace: parishPlaceDefault,
    sponsors: '',
    registerBook: '',
    registerPage: '',
    registerLine: '',
    residence: '',
    dateOfDeath: '',
    causeOfDeath: '',
    placeOfBurial: '',
    groomName: '',
    brideName: '',
    groomAge: '',
    brideAge: '',
    groomResidence: '',
    brideResidence: '',
    groomNationality: '',
    brideNationality: '',
    groomFatherName: '',
    brideFatherName: '',
    groomMotherName: '',
    brideMotherName: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || record.type === filterType;
    const matchesArchive = showArchived ? record.isArchived : !record.isArchived;
    return matchesSearch && matchesType && matchesArchive;
  });

  const getBadgeColor = (type: SacramentType) => {
    switch (type) {
      case SacramentType.BAPTISM: return 'bg-blue-100 text-blue-800';
      case SacramentType.MARRIAGE: return 'bg-pink-100 text-pink-800';
      case SacramentType.CONFIRMATION: return 'bg-purple-100 text-purple-800';
      case SacramentType.FUNERAL: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toInputDate = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString().split('T')[0];
  };

  const handleOpenModal = (record?: SacramentRecord) => {
    if (record) {
      setIsEditing(true);
      setEditId(record.id);
      setFormData({
        name: record.name ?? '',
        date: toInputDate(record.date),
        type: record.type,
        officiant: record.officiant ?? '',
        details: record.details ?? '',
        fatherName: record.fatherName ?? '',
        motherName: record.motherName ?? '',
        birthDate: toInputDate(record.birthDate),
        birthPlace: record.birthPlace ?? '',
        baptismDate: toInputDate(record.baptismDate),
        baptismPlace: record.baptismPlace ?? '',
        sponsors: record.sponsors ?? '',
        registerBook: record.registerBook ?? '',
        registerPage: record.registerPage ?? '',
        registerLine: record.registerLine ?? '',
        residence: record.residence ?? '',
        dateOfDeath: toInputDate(record.dateOfDeath),
        causeOfDeath: record.causeOfDeath ?? '',
        placeOfBurial: record.placeOfBurial ?? '',
        groomName: record.groomName ?? '',
        brideName: record.brideName ?? '',
        groomAge: record.groomAge ?? '',
        brideAge: record.brideAge ?? '',
        groomResidence: record.groomResidence ?? '',
        brideResidence: record.brideResidence ?? '',
        groomNationality: record.groomNationality ?? '',
        brideNationality: record.brideNationality ?? '',
        groomFatherName: record.groomFatherName ?? '',
        brideFatherName: record.brideFatherName ?? '',
        groomMotherName: record.groomMotherName ?? '',
        brideMotherName: record.brideMotherName ?? ''
      });
    } else {
      setIsEditing(false);
      setEditId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleOpenDetails = (record: SacramentRecord) => {
    setSelectedRecord(record);
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setIsEditing(false);
    setEditId(null);
  };

  const formatCoupleName = (groomName: string, brideName: string, fallback = '') => {
    const groom = groomName.trim();
    const bride = brideName.trim();
    if (groom && bride) {
      return `${groom} & ${bride}`;
    }
    return fallback.trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      name: formData.type === SacramentType.MARRIAGE
        ? formatCoupleName(formData.groomName, formData.brideName, formData.name)
        : formData.name
    };
    try {
      if (isEditing && editId) {
        await updateRecord({ ...payload, id: editId });
      } else {
        await addRecord(payload);
      }
      handleCloseModal();
    } catch (error) {
      await alert({
        title: 'Unable to save record',
        message: 'Please check the details and try again.'
      });
    }
  };

  const handleArchive = async (record: SacramentRecord) => {
    const reason = await prompt({
      title: 'Archive record?',
      message: `Archiving ${record.name}'s record hides it from the active list. You can provide an optional note or leave this blank.`,
      confirmText: 'Archive Record',
      cancelText: 'Cancel',
      placeholder: 'Reason for archiving (optional)',
      destructive: true
    });
    if (reason === null) return;
    try {
      await archiveRecord(record.id, reason.trim() || undefined);
    } catch (error) {
      await alert({
        title: 'Unable to archive record',
        message: 'Please try again later.'
      });
    }
  };

  const handleRestore = async (record: SacramentRecord) => {
    const shouldRestore = await confirm({
      title: 'Restore record?',
      message: `This will return ${record.name}'s record to the active registry.`,
      confirmText: 'Restore'
    });
    if (!shouldRestore) return;
    try {
      await unarchiveRecord(record.id);
    } catch (error) {
      await alert({
        title: 'Unable to restore record',
        message: 'Please try again shortly.'
      });
    }
  };

  const renderField = (label: string, value?: string | null) => {
    if (value == null || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    return (
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
        <span className="text-sm text-gray-900 sm:text-right break-words">{value}</span>
      </div>
    );
  };

  const renderSection = (title: string, fields: Array<JSX.Element | null>) => {
    const visible = fields.filter((field): field is JSX.Element => field !== null);
    if (!visible.length) return null;
    return (
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
        <div className="space-y-3">
          {visible}
        </div>
      </section>
    );
  };

  const isBaptism = formData.type === SacramentType.BAPTISM;
  const isConfirmation = formData.type === SacramentType.CONFIRMATION;
  const isMarriage = formData.type === SacramentType.MARRIAGE;
  const isFuneral = formData.type === SacramentType.FUNERAL;
  const recordDateLabel = isFuneral
    ? 'Date of Burial'
    : isMarriage
      ? 'Date of Marriage'
      : isConfirmation
        ? 'Date of Confirmation'
        : 'Date of Baptism';
  const nameLabel = isFuneral
    ? 'Deceased Name'
    : isConfirmation
      ? 'Candidate Name'
      : 'Child Name';
  const coupleName = formatCoupleName(formData.groomName, formData.brideName, formData.name);
  const inputClassName = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none';
  const labelClassName = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
           <LinkWrapper to="/admin/dashboard">
              <div className="p-2 bg-white rounded-lg border border-gray-200 hover:border-parish-blue text-gray-500 hover:text-parish-blue transition">
                <Icons.Home size={20} />
              </div>
           </LinkWrapper>
           <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900">Sacramental Records</h1>
            <p className="text-gray-500 text-sm">Manage baptism, confirmation, and marriage entries.</p>
           </div>
        </div>
        {showArchived ? (
          <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
            Viewing archived records
          </div>
        ) : (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-parish-blue text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-800 transition"
          >
            <Icons.Plus size={18} /> Add Record
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 bg-gray-50">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name..." 
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-parish-blue focus:border-parish-blue outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="border border-gray-300 rounded-lg px-4 py-2 outline-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">All Sacraments</option>
            {Object.values(SacramentType).map(type => (
              <option key={type} value={type}>{humanize(type)}</option>
            ))}
          </select>
          <label className={`flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg border ${showArchived ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200'}`}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded text-parish-blue focus:ring-parish-blue"
            />
            <Icons.Archive size={14} /> Show archived
          </label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sacrament</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Officiant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => handleOpenDetails(record)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{record.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{record.name}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">{record.details}</div>
                    {record.isArchived && (
                      <div className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <Icons.Archive size={12} /> Archived {record.archivedAt ? `on ${formatDate(record.archivedAt)}` : ''}
                      </div>
                    )}
                    {record.archiveReason && (
                      <div className="text-xs text-gray-400 italic truncate max-w-[150px]" title={record.archiveReason}>
                        Reason: {record.archiveReason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBadgeColor(record.type)}`}>
                      {humanize(record.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.officiant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {record.isArchived ? (
                      <button 
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRestore(record);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                      >
                        <Icons.CheckCircle size={14} /> Restore
                      </button>
                    ) : (
                      <button 
                        onClick={(event) => {
                          event.stopPropagation();
                          handleArchive(record);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                      >
                        <Icons.Archive size={14} /> Archive
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">Record Details</h2>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(selectedRecord.type)}`}>
                    {humanize(selectedRecord.type)}
                  </span>
                  {selectedRecord.isArchived && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">Record #{selectedRecord.id}</p>
              </div>
              <button onClick={handleCloseDetails} className="text-gray-400 hover:text-gray-600">
                <Icons.X size={24} />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {renderSection('Overview', [
                renderField('Recipient', selectedRecord.name),
                renderField('Sacrament Date', formatDate(selectedRecord.date)),
                renderField('Officiant', selectedRecord.officiant),
                renderField('Notes', selectedRecord.details)
              ])}

              {renderSection('Personal Info', [
                renderField('Birth Date', formatDate(selectedRecord.birthDate)),
                renderField('Birth Place', selectedRecord.birthPlace),
                renderField("Father's Name", selectedRecord.fatherName),
                renderField("Mother's Name", selectedRecord.motherName)
              ])}

              {(selectedRecord.type === SacramentType.BAPTISM || selectedRecord.type === SacramentType.CONFIRMATION) &&
                renderSection('Baptism Details', [
                  renderField('Baptism Date', formatDate(selectedRecord.baptismDate)),
                  renderField('Baptism Place', selectedRecord.baptismPlace),
                  renderField('Sponsors', selectedRecord.sponsors)
                ])}

              {renderSection('Marriage Details', [
                renderField('Groom Name', selectedRecord.groomName),
                renderField('Bride Name', selectedRecord.brideName),
                renderField('Groom Age', selectedRecord.groomAge),
                renderField('Bride Age', selectedRecord.brideAge),
                renderField('Groom Residence', selectedRecord.groomResidence),
                renderField('Bride Residence', selectedRecord.brideResidence),
                renderField('Groom Nationality', selectedRecord.groomNationality),
                renderField('Bride Nationality', selectedRecord.brideNationality),
                renderField("Groom's Father", selectedRecord.groomFatherName),
                renderField("Groom's Mother", selectedRecord.groomMotherName),
                renderField("Bride's Father", selectedRecord.brideFatherName),
                renderField("Bride's Mother", selectedRecord.brideMotherName),
                renderField('Witnesses', selectedRecord.type === SacramentType.MARRIAGE ? selectedRecord.sponsors : undefined)
              ])}

              {renderSection('Funeral Details', [
                renderField('Residence', selectedRecord.residence),
                renderField('Date of Death', formatDate(selectedRecord.dateOfDeath)),
                renderField('Cause of Death', selectedRecord.causeOfDeath),
                renderField('Place of Burial', selectedRecord.placeOfBurial)
              ])}

              {renderSection('Register Info', [
                renderField('Book No.', selectedRecord.registerBook),
                renderField('Page No.', selectedRecord.registerPage),
                renderField('Line No.', selectedRecord.registerLine)
              ])}

              {selectedRecord.isArchived && renderSection('Archive Info', [
                renderField('Archived At', formatDate(selectedRecord.archivedAt)),
                renderField('Archived By', selectedRecord.archivedBy),
                renderField('Reason', selectedRecord.archiveReason)
              ])}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800">
                 {isEditing ? 'Edit Record' : 'New Sacramental Record'}
               </h2>
               <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                 <Icons.X size={24} />
               </button>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-4">
                 <div>
                   <label className={labelClassName}>Sacrament Type</label>
                  <select
                    className={inputClassName}
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as SacramentType})}
                  >
                    {Object.values(SacramentType).map(type => (
                      <option key={type} value={type}>{humanize(type)}</option>
                    ))}
                  </select>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {isMarriage ? (
                     <div className="md:col-span-2">
                       <label className={labelClassName}>Couple Name</label>
                       <input
                         type="text"
                         className={`${inputClassName} bg-gray-50`}
                         value={coupleName}
                         readOnly
                         required
                       />
                       <p className="text-xs text-gray-500 mt-1">Auto-formatted from groom and bride names.</p>
                     </div>
                   ) : (
                     <div className="md:col-span-2">
                       <label className={labelClassName}>{nameLabel}</label>
                       <input 
                          type="text"
                          className={inputClassName}
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                          placeholder="Full Name"
                       />
                     </div>
                   )}
                   <div>
                     <label className={labelClassName}>{recordDateLabel}</label>
                     <input 
                        type="date"
                        className={inputClassName}
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        required
                     />
                   </div>
                   <div>
                     <label className={labelClassName}>Officiant</label>
                     <input 
                        type="text"
                        className={inputClassName}
                        value={formData.officiant}
                        onChange={(e) => setFormData({...formData, officiant: e.target.value})}
                        required
                        placeholder="e.g. Fr. Juan"
                     />
                   </div>
                 </div>
               </div>

               {isBaptism && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Baptism Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className={labelClassName}>Birth Date</label>
                       <input
                         type="date"
                         className={inputClassName}
                         value={formData.birthDate}
                         onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Birth Place</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.birthPlace}
                         onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Father's Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.fatherName}
                         onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Mother's Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.motherName}
                         onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                         required
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className={labelClassName}>Place of Baptism</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.baptismPlace}
                         onChange={(e) => setFormData({...formData, baptismPlace: e.target.value})}
                         required
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className={labelClassName}>Sponsors / Godparents</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.sponsors}
                         onChange={(e) => setFormData({...formData, sponsors: e.target.value})}
                         required
                         placeholder="e.g. Carlos Dela Peña, Angela Ramos"
                       />
                     </div>
                   </div>
                 </div>
               )}

               {isConfirmation && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Confirmation Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className={labelClassName}>Birth Date</label>
                       <input
                         type="date"
                         className={inputClassName}
                         value={formData.birthDate}
                         onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Birth Place</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.birthPlace}
                         onChange={(e) => setFormData({...formData, birthPlace: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Father's Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.fatherName}
                         onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Mother's Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.motherName}
                         onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Date of Baptism</label>
                       <input
                         type="date"
                         className={inputClassName}
                         value={formData.baptismDate}
                         onChange={(e) => setFormData({...formData, baptismDate: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Place of Baptism</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.baptismPlace}
                         onChange={(e) => setFormData({...formData, baptismPlace: e.target.value})}
                         required
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className={labelClassName}>Sponsors (comma-separated)</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.sponsors}
                         onChange={(e) => setFormData({...formData, sponsors: e.target.value})}
                         required
                         placeholder="e.g. Carlos Dela Peña, Angela Ramos"
                       />
                     </div>
                   </div>
                 </div>
               )}

               {isMarriage && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Marriage Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className={labelClassName}>Groom Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomName}
                         onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride Name</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideName}
                         onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Groom Age</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomAge}
                         onChange={(e) => setFormData({...formData, groomAge: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride Age</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideAge}
                         onChange={(e) => setFormData({...formData, brideAge: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Groom Residence</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomResidence}
                         onChange={(e) => setFormData({...formData, groomResidence: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride Residence</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideResidence}
                         onChange={(e) => setFormData({...formData, brideResidence: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Groom Nationality</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomNationality}
                         onChange={(e) => setFormData({...formData, groomNationality: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride Nationality</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideNationality}
                         onChange={(e) => setFormData({...formData, brideNationality: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Groom's Father</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomFatherName}
                         onChange={(e) => setFormData({...formData, groomFatherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Groom's Mother</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.groomMotherName}
                         onChange={(e) => setFormData({...formData, groomMotherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride's Father</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideFatherName}
                         onChange={(e) => setFormData({...formData, brideFatherName: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Bride's Mother</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.brideMotherName}
                         onChange={(e) => setFormData({...formData, brideMotherName: e.target.value})}
                         required
                       />
                     </div>
                     <div className="md:col-span-2">
                       <label className={labelClassName}>Witnesses</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.sponsors}
                         onChange={(e) => setFormData({...formData, sponsors: e.target.value})}
                         required
                         placeholder="e.g. Ana Irene, Nelson Lisaca"
                       />
                     </div>
                   </div>
                 </div>
               )}

               {isFuneral && (
                 <div className="space-y-4">
                   <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Funeral Details</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className={labelClassName}>Residence</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.residence}
                         onChange={(e) => setFormData({...formData, residence: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Date of Death</label>
                       <input
                         type="date"
                         className={inputClassName}
                         value={formData.dateOfDeath}
                         onChange={(e) => setFormData({...formData, dateOfDeath: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Cause of Death</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.causeOfDeath}
                         onChange={(e) => setFormData({...formData, causeOfDeath: e.target.value})}
                         required
                       />
                     </div>
                     <div>
                       <label className={labelClassName}>Place of Burial</label>
                       <input
                         type="text"
                         className={inputClassName}
                         value={formData.placeOfBurial}
                         onChange={(e) => setFormData({...formData, placeOfBurial: e.target.value})}
                         required
                       />
                     </div>
                   </div>
                 </div>
               )}

               <div className="space-y-3">
                 <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Register Information</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <label className={labelClassName}>Book No.</label>
                     <input
                       type="text"
                       className={inputClassName}
                       value={formData.registerBook}
                       onChange={(e) => setFormData({...formData, registerBook: e.target.value})}
                       required
                     />
                   </div>
                   <div>
                     <label className={labelClassName}>Page No.</label>
                     <input
                       type="text"
                       className={inputClassName}
                       value={formData.registerPage}
                       onChange={(e) => setFormData({...formData, registerPage: e.target.value})}
                       required
                     />
                   </div>
                   <div>
                     <label className={labelClassName}>Line No.</label>
                     <input
                       type="text"
                       className={inputClassName}
                       value={formData.registerLine}
                       onChange={(e) => setFormData({...formData, registerLine: e.target.value})}
                       required
                     />
                   </div>
                 </div>
               </div>

               <div>
                 <label className={labelClassName}>Notes / Additional Details</label>
                 <textarea 
                    rows={3}
                    className={inputClassName}
                    value={formData.details}
                    onChange={(e) => setFormData({...formData, details: e.target.value})}
                    placeholder="Additional information..."
                    required
                 />
               </div>

               <div className="pt-4 flex gap-3">
                 <button 
                   type="submit" 
                   className="flex-1 bg-parish-blue text-white py-2.5 rounded-lg font-bold hover:bg-blue-800 transition"
                 >
                   {isEditing ? 'Save Changes' : 'Create Record'}
                 </button>
                 <button 
                   type="button"
                   onClick={handleCloseModal} 
                   className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition"
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

// Helper for conditional Link usage if needed, but standard Link is fine
import { Link } from 'react-router-dom';
const LinkWrapper: React.FC<{to: string, children: React.ReactNode}> = ({to, children}) => <Link to={to}>{children}</Link>;

export default Records;
