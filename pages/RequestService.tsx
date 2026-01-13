import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { useParish } from '../context/ParishContext';
import { RequestCategory, RequestStatus } from '../types';

const RequestService: React.FC = () => {
  const { addRequest } = useParish();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rejectionMessage, setRejectionMessage] = useState('');
  const today = new Date().toISOString().split('T')[0];
  
  const [category, setCategory] = useState<RequestCategory>(RequestCategory.SACRAMENT);
  const [serviceType, setServiceType] = useState('Baptism');

  const initialFormState = {
    requesterName: '',
    contactInfo: '',
    preferredDate: '',
    details: '',
    funeralDeceasedName: '',
    funeralResidence: '',
    funeralDateOfDeath: '',
    funeralPlaceOfBurial: '',
    marriageGroomName: '',
    marriageBrideName: '',
    marriageDate: '',
    certificateRecipientName: '',
    certificateRecipientBirthDate: '',
    certificateRecipientDeathDate: '',
    requesterRelationship: '',
    reissueReason: '',
    confirmationCandidateName: '',
    confirmationCandidateBirthDate: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const isConfirmation = category === RequestCategory.SACRAMENT && serviceType.toLowerCase().includes('confirmation');
  const isFuneral = category === RequestCategory.SACRAMENT && serviceType.toLowerCase().includes('funeral');
  const isMarriage = category === RequestCategory.SACRAMENT && serviceType.toLowerCase().includes('marriage');
  const isDeathCertificate = category === RequestCategory.CERTIFICATE && serviceType.toLowerCase().includes('death');
  const isMarriageCertificate = category === RequestCategory.CERTIFICATE && serviceType.toLowerCase().includes('marriage');

  const handleCategoryChange = (newCategory: RequestCategory) => {
    setCategory(newCategory);
    // Reset service type based on category
    if (newCategory === RequestCategory.SACRAMENT) {
      setServiceType('Baptism');
    } else {
      setServiceType('Baptismal Certificate');
    }
    setFormData(initialFormState);
  };

  const isValidContact = (value: string) => {
    const trimmed = value.trim();
    const phone = /^(?:\+639|09)\d{9}$/; // PH mobile formats: +639XXXXXXXXX or 09XXXXXXXXX
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return phone.test(trimmed) || email.test(trimmed);
  };

  const parseApiErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      const raw = err.message || '';
      try {
        const parsed = JSON.parse(raw);
        if (parsed?.message) return String(parsed.message);
      } catch {
        return raw;
      }
      return raw;
    }
    return 'Unable to submit your request right now. Please try again later.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRejectionMessage('');
    setIsSubmitting(true);
    if (!isValidContact(formData.contactInfo)) {
      setError('Enter a valid email or PH mobile (+63 or 09 followed by 9 digits).');
      setIsSubmitting(false);
      return;
    }
    if (formData.preferredDate) {
      const preferred = new Date(formData.preferredDate);
      if (Number.isNaN(preferred.getTime())) {
        setError('Preferred date is invalid.');
        setIsSubmitting(false);
        return;
      }
      if (isFuneral || isMarriage) {
        if (preferred < new Date()) {
          setError('Preferred date/time cannot be in the past.');
          setIsSubmitting(false);
          return;
        }
      } else if (preferred.toISOString().split('T')[0] < today) {
        setError('Preferred date cannot be in the past.');
        setIsSubmitting(false);
        return;
      }
    }
    if (category === RequestCategory.CERTIFICATE && !isMarriageCertificate && !formData.certificateRecipientName.trim()) {
      setError('Please enter the certificate holder\'s full name.');
      setIsSubmitting(false);
      return;
    }
    if (isDeathCertificate) {
      if (!formData.certificateRecipientDeathDate) {
        setError('Please provide the date of death.');
        setIsSubmitting(false);
        return;
      }
      if (formData.certificateRecipientDeathDate > today) {
        setError('Date of death cannot be in the future.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.requesterRelationship.trim()) {
        setError('Please specify your relationship to the deceased.');
        setIsSubmitting(false);
        return;
      }
    }
    if (isConfirmation) {
      if (!formData.confirmationCandidateName.trim() || !formData.confirmationCandidateBirthDate) {
        setError('Confirmation candidate name and birth date are required.');
        setIsSubmitting(false);
        return;
      }
      if (formData.confirmationCandidateBirthDate > today) {
        setError('Birth date cannot be in the future.');
        setIsSubmitting(false);
        return;
      }
    }
    if (isMarriage) {
      if (!formData.marriageGroomName.trim() || !formData.marriageBrideName.trim()) {
        setError('Please enter both groom and bride names.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.preferredDate) {
        setError('Please provide a preferred date/time for the marriage.');
        setIsSubmitting(false);
        return;
      }
    }
    if (isMarriageCertificate) {
      if (!formData.marriageGroomName.trim() || !formData.marriageBrideName.trim()) {
        setError('Please enter both groom and bride names.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.marriageDate) {
        setError('Please provide the marriage date.');
        setIsSubmitting(false);
        return;
      }
      if (formData.marriageDate > today) {
        setError('Marriage date cannot be in the future.');
        setIsSubmitting(false);
        return;
      }
    }
    if (isFuneral) {
      if (!formData.funeralDeceasedName.trim()) {
        setError('Please enter the deceased\'s full name.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.funeralResidence.trim()) {
        setError('Please enter the residence/address of the deceased.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.funeralDateOfDeath) {
        setError('Please provide the date of death.');
        setIsSubmitting(false);
        return;
      }
      if (formData.funeralDateOfDeath > today) {
        setError('Date of death cannot be in the future.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.funeralPlaceOfBurial.trim()) {
        setError('Please enter the place of burial.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.requesterRelationship.trim()) {
        setError('Please specify your relationship to the deceased.');
        setIsSubmitting(false);
        return;
      }
      if (!formData.preferredDate) {
        setError('Please provide a preferred date/time for the funeral blessing.');
        setIsSubmitting(false);
        return;
      }
    }
    try {
      const created = await addRequest({
        category,
        serviceType,
        requesterName: formData.requesterName,
        contactInfo: formData.contactInfo,
        preferredDate: formData.preferredDate,
        details: formData.details,
        confirmationCandidateName: isConfirmation ? formData.confirmationCandidateName : undefined,
        confirmationCandidateBirthDate: isConfirmation ? formData.confirmationCandidateBirthDate : undefined,
        funeralDeceasedName: isFuneral ? formData.funeralDeceasedName : undefined,
        funeralResidence: isFuneral ? formData.funeralResidence : undefined,
        funeralDateOfDeath: isFuneral ? formData.funeralDateOfDeath : undefined,
        funeralPlaceOfBurial: isFuneral ? formData.funeralPlaceOfBurial : undefined,
        marriageGroomName: (isMarriage || isMarriageCertificate) ? formData.marriageGroomName : undefined,
        marriageBrideName: (isMarriage || isMarriageCertificate) ? formData.marriageBrideName : undefined,
        marriageDate: isMarriageCertificate ? formData.marriageDate : undefined,
        certificateRecipientName: category === RequestCategory.CERTIFICATE && !isMarriageCertificate ? formData.certificateRecipientName : undefined,
        certificateRecipientBirthDate:
          category === RequestCategory.CERTIFICATE && !isDeathCertificate && !isMarriageCertificate ? formData.certificateRecipientBirthDate : undefined,
        certificateRecipientDeathDate: isDeathCertificate ? formData.certificateRecipientDeathDate : undefined,
        requesterRelationship: isFuneral || (category === RequestCategory.CERTIFICATE && !isMarriageCertificate)
          ? formData.requesterRelationship
          : undefined,
        reissueReason: category === RequestCategory.CERTIFICATE ? formData.reissueReason : undefined
      });
      if (created.status === RequestStatus.REJECTED) {
        setRejectionMessage(created.adminNotes || 'Your request was received but cannot be processed at this time.');
      }
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      setError(parseApiErrorMessage(err) || 'Unable to submit your request right now. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
          <Icons.CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-4">Request Submitted</h2>
        <p className="text-gray-600 mb-8 text-lg">
          {rejectionMessage ? rejectionMessage : 'Thank you for your request. Our parish staff has been notified and will review your application.'}
          {!rejectionMessage && (
            <> We will contact you via {formData.contactInfo} regarding the next steps.</>
          )}
        </p>
        <button 
          onClick={() => {
            setSubmitted(false);
            setFormData(initialFormState);
          }}
          className="bg-parish-blue text-white px-8 py-3 rounded-full font-medium hover:bg-blue-800 transition"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-parish-blue mb-4">Online Service Requests</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Request sacraments or certificates conveniently from home. 
          Please fill out the form below and our office will get in touch with you.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        {/* Category Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-4 text-center font-medium transition ${category === RequestCategory.SACRAMENT ? 'bg-parish-blue text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handleCategoryChange(RequestCategory.SACRAMENT)}
          >
            Request a Sacrament
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium transition ${category === RequestCategory.CERTIFICATE ? 'bg-parish-pink text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
            onClick={() => handleCategoryChange(RequestCategory.CERTIFICATE)}
          >
            Request a Certificate
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-blue-50 border-l-4 border-parish-blue p-4 rounded mb-6">
            <div className="flex gap-3">
              <Icons.FileQuestion className="text-parish-blue flex-shrink-0" size={24} />
              <div>
                <h3 className="font-bold text-gray-800 text-sm mb-1">
                  {category === RequestCategory.SACRAMENT ? 'Sacrament Application' : 'Certificate Request'}
                </h3>
                <p className="text-sm text-gray-600">
                  {category === RequestCategory.SACRAMENT 
                    ? 'Schedule a Baptism, Confirmation, Wedding, or Funeral blessing.'
                    : 'Request copies of baptismal, confirmation, marriage, or death certificates for legal or personal use.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Service Type</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none bg-white"
                value={serviceType}
                onChange={(e) => {
                  const value = e.target.value;
                  setServiceType(value);
                  const normalized = value.toLowerCase();
                  const nextIsConfirmation = category === RequestCategory.SACRAMENT && normalized.includes('confirmation');
                  const nextIsFuneral = category === RequestCategory.SACRAMENT && normalized.includes('funeral');
                  const nextIsMarriage = category === RequestCategory.SACRAMENT && normalized.includes('marriage');
                  const nextIsDeathCertificate = category === RequestCategory.CERTIFICATE && normalized.includes('death');
                  const nextIsMarriageCertificate = category === RequestCategory.CERTIFICATE && normalized.includes('marriage');
                  setFormData((prev) => ({
                    ...prev,
                    confirmationCandidateName: nextIsConfirmation ? prev.confirmationCandidateName : '',
                    confirmationCandidateBirthDate: nextIsConfirmation ? prev.confirmationCandidateBirthDate : '',
                    funeralDeceasedName: nextIsFuneral ? prev.funeralDeceasedName : '',
                    funeralResidence: nextIsFuneral ? prev.funeralResidence : '',
                    funeralDateOfDeath: nextIsFuneral ? prev.funeralDateOfDeath : '',
                    funeralPlaceOfBurial: nextIsFuneral ? prev.funeralPlaceOfBurial : '',
                    marriageGroomName: nextIsMarriage || nextIsMarriageCertificate ? prev.marriageGroomName : '',
                    marriageBrideName: nextIsMarriage || nextIsMarriageCertificate ? prev.marriageBrideName : '',
                    marriageDate: nextIsMarriageCertificate ? prev.marriageDate : '',
                    certificateRecipientDeathDate: nextIsDeathCertificate ? prev.certificateRecipientDeathDate : '',
                    certificateRecipientBirthDate: nextIsDeathCertificate || nextIsMarriageCertificate ? '' : prev.certificateRecipientBirthDate,
                    requesterRelationship: nextIsMarriageCertificate ? '' : prev.requesterRelationship
                  }));
                }}
              >
                {category === RequestCategory.SACRAMENT ? (
                  <>
                    <option value="Baptism">Baptism</option>
                    <option value="Confirmation">Confirmation</option>
                    <option value="Marriage">Marriage</option>
                    <option value="Funeral">Funeral Blessing</option>
                    <option value="Anointing of the Sick">Anointing of the Sick</option>
                  </>
                ) : (
                  <>
                    <option value="Baptismal Certificate">Baptismal Certificate</option>
                    <option value="Confirmation Certificate">Confirmation Certificate</option>
                    <option value="Marriage Certificate">Marriage Certificate</option>
                    <option value="Death Certificate">Death Certificate</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requester Name</label>
              <input 
                type="text" 
                required
                placeholder="Full Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                value={formData.requesterName}
                onChange={(e) => setFormData({...formData, requesterName: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (Mobile/Email)</label>
              <input 
                type="text" 
                required
                placeholder="0917... or email@example.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                value={formData.contactInfo}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({...formData, contactInfo: value});
                  if (error && isValidContact(value)) {
                    setError('');
                  }
                }}
              />
            </div>

            {category === RequestCategory.CERTIFICATE && (
              <>
                {isMarriageCertificate ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Groom Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.marriageGroomName}
                        onChange={(e) => setFormData({ ...formData, marriageGroomName: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bride Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.marriageBrideName}
                        onChange={(e) => setFormData({ ...formData, marriageBrideName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marriage Date</label>
                      <input
                        type="date"
                        required
                        max={today}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.marriageDate}
                        onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isDeathCertificate ? 'Deceased Full Name (certificate holder)' : 'Certificate Holder (Full Name)'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Name as it should appear on the certificate"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.certificateRecipientName}
                        onChange={(e) => setFormData({ ...formData, certificateRecipientName: e.target.value })}
                      />
                    </div>
                    {isDeathCertificate ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                          <input
                            type="date"
                            required
                            max={today}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                            value={formData.certificateRecipientDeathDate}
                            onChange={(e) => setFormData({ ...formData, certificateRecipientDeathDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to the Deceased</label>
                          <input
                            type="text"
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                            placeholder="e.g., Child, Spouse"
                            value={formData.requesterRelationship}
                            onChange={(e) => setFormData({ ...formData, requesterRelationship: e.target.value })}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Holder Birth Date (optional)</label>
                          <input
                            type="date"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                            value={formData.certificateRecipientBirthDate}
                            onChange={(e) => setFormData({ ...formData, certificateRecipientBirthDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Holder (optional)</label>
                          <input
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                            placeholder="e.g., Parent, Guardian"
                            value={formData.requesterRelationship}
                            onChange={(e) => setFormData({ ...formData, requesterRelationship: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {category === RequestCategory.SACRAMENT && (
              <>
                {isConfirmation && (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Candidate (Full Name)</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Full name of the candidate"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.confirmationCandidateName}
                        onChange={(e) => setFormData({...formData, confirmationCandidateName: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Birth Date</label>
                      <input 
                        type="date" 
                        required
                        max={today}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.confirmationCandidateBirthDate}
                        onChange={(e) => setFormData({...formData, confirmationCandidateBirthDate: e.target.value})}
                      />
                    </div>
                  </>
                )}
                {isFuneral ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Deceased Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.funeralDeceasedName}
                        onChange={(e) => setFormData({ ...formData, funeralDeceasedName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Residence/Address</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.funeralResidence}
                        onChange={(e) => setFormData({ ...formData, funeralResidence: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Death</label>
                      <input
                        type="date"
                        required
                        max={today}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.funeralDateOfDeath}
                        onChange={(e) => setFormData({ ...formData, funeralDateOfDeath: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Place of Burial</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.funeralPlaceOfBurial}
                        onChange={(e) => setFormData({ ...formData, funeralPlaceOfBurial: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to the Deceased</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        placeholder="e.g., Child, Spouse"
                        value={formData.requesterRelationship}
                        onChange={(e) => setFormData({ ...formData, requesterRelationship: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Subject to availability and confirmation by the parish office.</p>
                    </div>
                  </>
                ) : isMarriage ? (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Groom Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.marriageGroomName}
                        onChange={(e) => setFormData({ ...formData, marriageGroomName: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bride Full Name</label>
                      <input
                        type="text"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.marriageBrideName}
                        onChange={(e) => setFormData({ ...formData, marriageBrideName: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date/Time</label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                        value={formData.preferredDate}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      />
                      <p className="text-xs text-gray-500 mt-1">Subject to availability and confirmation by the parish office.</p>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                      min={today}
                      value={formData.preferredDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setFormData({...formData, preferredDate: value});
                        if (error && value >= today) {
                          setError('');
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Subject to availability and confirmation by the parish office.</p>
                  </div>
                )}
              </>
            )}

            {category === RequestCategory.CERTIFICATE && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Reissue (required if requesting another copy)</label>
                <textarea
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                  placeholder="Briefly explain why you need another copy."
                  value={formData.reissueReason}
                  onChange={(e) => setFormData({ ...formData, reissueReason: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">If this is your first request, you may leave this blank.</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isFuneral || isDeathCertificate || isMarriage || isMarriageCertificate
                  ? 'Additional Notes (optional)'
                  : category === RequestCategory.SACRAMENT
                    ? 'Additional Details (Name of child/couple, special requests)'
                    : 'Purpose & Details (Name on record, approximate date of sacrament)'}
              </label>
              <textarea 
                required={!isFuneral && !isDeathCertificate && !isMarriage && !isMarriageCertificate}
                rows={4}
                placeholder={isFuneral || isDeathCertificate || isMarriage || isMarriageCertificate
                  ? 'Any additional notes for the parish office (optional)'
                  : category === RequestCategory.SACRAMENT 
                    ? "e.g., Child's name is John Doe. We prefer a morning schedule." 
                    : "e.g., For marriage license requirements. Baptized around 1995."}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-parish-blue outline-none"
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-parish-blue hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting...' : <><Icons.FileQuestion size={20} /> Submit Request</>}
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              By submitting this form, you agree to share your information with the parish office for processing purposes.
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};

export default RequestService;
