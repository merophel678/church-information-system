import { Router } from 'express';
import prisma from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import { DeliveryMethod, RequestCategory, RequestStatus, SacramentType } from '@prisma/client';

const router = Router();

const mapServiceToSacramentType = (service: string): SacramentType | null => {
  const normalized = service.toLowerCase();
  if (normalized.includes('baptism')) return SacramentType.BAPTISM;
  if (normalized.includes('confirmation')) return SacramentType.CONFIRMATION;
  if (normalized.includes('marriage')) return SacramentType.MARRIAGE;
  if (normalized.includes('funeral') || normalized.includes('burial') || normalized.includes('death')) return SacramentType.FUNERAL;
  return null;
};

const buildCertificateRecordCriteria = (input: {
  sacramentType: SacramentType;
  certificateRecipientName?: string;
  certificateRecipientBirthDate?: string;
  certificateRecipientDeathDate?: string;
  marriageGroomName?: string;
  marriageBrideName?: string;
  marriageDate?: string;
}) => {
  const where: any = { type: input.sacramentType, isArchived: false };
  if (input.sacramentType === SacramentType.MARRIAGE) {
    if (input.marriageGroomName) where.groomName = input.marriageGroomName;
    if (input.marriageBrideName) where.brideName = input.marriageBrideName;
    if (input.marriageDate) where.date = new Date(input.marriageDate);
  } else {
    if (input.certificateRecipientName) where.name = input.certificateRecipientName;
    if (input.sacramentType === SacramentType.FUNERAL && input.certificateRecipientDeathDate) {
      where.dateOfDeath = new Date(input.certificateRecipientDeathDate);
    }
    if (input.sacramentType !== SacramentType.FUNERAL && input.certificateRecipientBirthDate) {
      where.birthDate = new Date(input.certificateRecipientBirthDate);
    }
  }
  return where;
};

const buildCertificateAutoRejectNote = (input: {
  sacramentType: SacramentType;
  certificateRecipientName?: string;
  certificateRecipientBirthDate?: string;
  certificateRecipientDeathDate?: string;
  marriageGroomName?: string;
  marriageBrideName?: string;
  marriageDate?: string;
}) => {
  if (input.sacramentType === SacramentType.MARRIAGE) {
    const dateText = input.marriageDate ? new Date(input.marriageDate).toLocaleDateString() : 'unknown date';
    return `No matching marriage record found for ${input.marriageGroomName || 'unknown groom'} and ${input.marriageBrideName || 'unknown bride'} (${dateText}).`;
  }
  if (input.sacramentType === SacramentType.FUNERAL) {
    const dateText = input.certificateRecipientDeathDate
      ? new Date(input.certificateRecipientDeathDate).toLocaleDateString()
      : 'unknown date';
    return `No matching funeral record found for ${input.certificateRecipientName || 'unknown name'} (date of death: ${dateText}).`;
  }
  const birthText = input.certificateRecipientBirthDate
    ? new Date(input.certificateRecipientBirthDate).toLocaleDateString()
    : 'birth date not provided';
  return `No matching ${input.sacramentType.toLowerCase()} record found for ${input.certificateRecipientName || 'unknown name'} (${birthText}).`;
};

const findIssuedCertificateForRecord = async (input: {
  sacramentType: SacramentType;
  record: { id: string; name: string; birthDate: Date | null; dateOfDeath: Date | null; date: Date; groomName?: string | null; brideName?: string | null };
}) => {
  if (input.sacramentType === SacramentType.MARRIAGE) {
    return prisma.issuedCertificate.findFirst({
      where: {
        request: {
          category: RequestCategory.CERTIFICATE,
          marriageGroomName: input.record.groomName ?? undefined,
          marriageBrideName: input.record.brideName ?? undefined,
          marriageDate: input.record.date
        }
      }
    });
  }
  if (input.sacramentType === SacramentType.FUNERAL) {
    return prisma.issuedCertificate.findFirst({
      where: {
        request: {
          category: RequestCategory.CERTIFICATE,
          certificateRecipientName: input.record.name,
          certificateRecipientDeathDate: input.record.dateOfDeath ?? undefined
        }
      }
    });
  }
  return prisma.issuedCertificate.findFirst({
    where: {
      request: {
        category: RequestCategory.CERTIFICATE,
        certificateRecipientName: input.record.name,
        ...(input.record.birthDate ? { certificateRecipientBirthDate: input.record.birthDate } : {})
      }
    }
  });
};

router.get('/', authenticate, async (_req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(requests);
});

router.post('/', async (req, res) => {
  const {
    category,
    serviceType,
    requesterName,
    contactInfo,
    preferredDate,
    details,
    confirmationCandidateName,
    confirmationCandidateBirthDate,
    funeralDeceasedName,
    funeralResidence,
    funeralDateOfDeath,
    funeralPlaceOfBurial,
    marriageGroomName,
    marriageBrideName,
    marriageDate,
    certificateRecipientName,
    certificateRecipientBirthDate,
    certificateRecipientDeathDate,
    requesterRelationship,
    reissueReason
  } = req.body;

  if (!category || !serviceType || !requesterName || !contactInfo) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const normalizedService = String(serviceType || '').toLowerCase();
  const isConfirmationRequest =
    category === RequestCategory.SACRAMENT && normalizedService.includes('confirmation');
  const isFuneralRequest =
    category === RequestCategory.SACRAMENT && normalizedService.includes('funeral');
  const isDeathCertificate =
    category === RequestCategory.CERTIFICATE && normalizedService.includes('death');
  const isMarriageRequest =
    category === RequestCategory.SACRAMENT && normalizedService.includes('marriage');
  const isMarriageCertificate =
    category === RequestCategory.CERTIFICATE && normalizedService.includes('marriage');

  if (!details && !isFuneralRequest && !isDeathCertificate && !isMarriageRequest && !isMarriageCertificate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (isConfirmationRequest && (!confirmationCandidateName || !confirmationCandidateBirthDate)) {
    return res.status(400).json({ message: 'Confirmation candidate name and birth date are required' });
  }

  if (category === RequestCategory.CERTIFICATE && !isMarriageCertificate && !certificateRecipientName) {
    return res.status(400).json({ message: 'Certificate recipient name is required for certificate requests' });
  }

  if (isDeathCertificate && !certificateRecipientDeathDate) {
    return res.status(400).json({ message: 'Date of death is required for death certificate requests' });
  }

  if (isDeathCertificate && !requesterRelationship) {
    return res.status(400).json({ message: 'Relationship to the deceased is required for death certificate requests' });
  }

  if (isFuneralRequest) {
    if (!funeralDeceasedName || !funeralResidence || !funeralDateOfDeath || !funeralPlaceOfBurial) {
      return res.status(400).json({ message: 'Funeral requests require deceased name, residence, date of death, and place of burial' });
    }
    if (!requesterRelationship) {
      return res.status(400).json({ message: 'Relationship to the deceased is required for funeral requests' });
    }
  }

  if (isMarriageRequest) {
    if (!marriageGroomName || !marriageBrideName) {
      return res.status(400).json({ message: 'Marriage requests require both groom and bride names' });
    }
    if (!preferredDate) {
      return res.status(400).json({ message: 'Preferred date/time is required for marriage requests' });
    }
  }

  if (isMarriageCertificate) {
    if (!marriageGroomName || !marriageBrideName || !marriageDate) {
      return res.status(400).json({ message: 'Marriage certificate requests require groom name, bride name, and marriage date' });
    }
  }

  let certificateStatus: RequestStatus | undefined;
  let certificateNote: string | undefined;
  let recordId: string | undefined;
  let isReissue = false;

  if (category === RequestCategory.CERTIFICATE) {
    const sacramentType = mapServiceToSacramentType(serviceType);
    if (sacramentType) {
      const recordCriteria = buildCertificateRecordCriteria({
        sacramentType,
        certificateRecipientName,
        certificateRecipientBirthDate,
        certificateRecipientDeathDate,
        marriageGroomName,
        marriageBrideName,
        marriageDate
      });
      const record = await prisma.sacramentRecord.findFirst({
        where: recordCriteria,
        orderBy: { date: 'desc' }
      });

      if (!record) {
        certificateStatus = RequestStatus.REJECTED;
        certificateNote = buildCertificateAutoRejectNote({
          sacramentType,
          certificateRecipientName,
          certificateRecipientBirthDate,
          certificateRecipientDeathDate,
          marriageGroomName,
          marriageBrideName,
          marriageDate
        });
      } else {
        recordId = record.id;
        const existingIssued = await findIssuedCertificateForRecord({
          sacramentType,
          record
        });
        if (existingIssued) {
          isReissue = true;
          if (!reissueReason || !reissueReason.trim()) {
            return res.status(400).json({ message: 'A reason is required when requesting another copy of this certificate.' });
          }
        }
      }
    }
  }

  let confirmationStatus: RequestStatus | undefined;
  let confirmationNote: string | undefined;
  if (isConfirmationRequest) {
    const match = await prisma.sacramentRecord.findFirst({
      where: {
        type: SacramentType.BAPTISM,
        isArchived: false,
        name: confirmationCandidateName,
        birthDate: new Date(confirmationCandidateBirthDate)
      }
    });
    if (!match) {
      confirmationStatus = RequestStatus.REJECTED;
      confirmationNote = `No matching baptism record found for ${confirmationCandidateName} (${confirmationCandidateBirthDate}).`;
    }
  }

  const request = await prisma.serviceRequest.create({
    data: {
      category,
      serviceType,
      requesterName,
      contactInfo,
      preferredDate,
      details: details ?? '',
      confirmationCandidateName,
      confirmationCandidateBirthDate: confirmationCandidateBirthDate ? new Date(confirmationCandidateBirthDate) : undefined,
      funeralDeceasedName,
      funeralResidence,
      funeralDateOfDeath: funeralDateOfDeath ? new Date(funeralDateOfDeath) : undefined,
      funeralPlaceOfBurial,
      marriageGroomName,
      marriageBrideName,
      marriageDate: marriageDate ? new Date(marriageDate) : undefined,
      certificateRecipientName,
      certificateRecipientBirthDate: certificateRecipientBirthDate ? new Date(certificateRecipientBirthDate) : undefined,
      certificateRecipientDeathDate: certificateRecipientDeathDate ? new Date(certificateRecipientDeathDate) : undefined,
      requesterRelationship,
      recordId,
      isReissue,
      reissueReason: isReissue ? reissueReason?.trim() || undefined : undefined,
      status: certificateStatus ?? confirmationStatus ?? RequestStatus.PENDING,
      adminNotes: certificateNote ?? confirmationNote
    }
  });

  res.status(201).json(request);
});

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { recordDetails, ...updates } = req.body as Partial<{
    category: RequestCategory;
    serviceType: string;
    requesterName: string;
    contactInfo: string;
    preferredDate: string | null;
    details: string;
    status: RequestStatus;
    confirmedSchedule: string | null;
    adminNotes: string | null;
    certificateRecipientName?: string;
    certificateRecipientBirthDate?: string;
    certificateRecipientDeathDate?: string;
    requesterRelationship?: string;
    confirmationCandidateName?: string;
    confirmationCandidateBirthDate?: string;
    funeralDeceasedName?: string;
    funeralResidence?: string;
    funeralDateOfDeath?: string;
    funeralPlaceOfBurial?: string;
    marriageGroomName?: string;
    marriageBrideName?: string;
    marriageDate?: string;
    recordId?: string;
    isReissue?: boolean;
    reissueReason?: string;
  }> & {
    recordDetails?: {
      name?: string;
      date?: string;
      type?: SacramentType;
      officiant?: string;
      details?: string;
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
      residence?: string;
      dateOfDeath?: string;
      causeOfDeath?: string;
      placeOfBurial?: string;
      groomName?: string;
      brideName?: string;
      groomAge?: string;
      brideAge?: string;
      groomResidence?: string;
      brideResidence?: string;
      groomNationality?: string;
      brideNationality?: string;
      groomFatherName?: string;
      brideFatherName?: string;
      groomMotherName?: string;
      brideMotherName?: string;
    };
  };

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (
    existing.status === RequestStatus.COMPLETED &&
    updates.status &&
    updates.status !== RequestStatus.COMPLETED
  ) {
    return res.status(400).json({ message: 'Completed requests cannot be reopened.' });
  }
  if (
    existing.status === RequestStatus.REJECTED &&
    updates.status &&
    updates.status !== RequestStatus.REJECTED
  ) {
    return res.status(400).json({ message: 'Rejected requests cannot be reopened.' });
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: {
      ...updates,
      confirmationCandidateBirthDate: updates.confirmationCandidateBirthDate
        ? new Date(updates.confirmationCandidateBirthDate)
        : undefined,
      certificateRecipientBirthDate: updates.certificateRecipientBirthDate
        ? new Date(updates.certificateRecipientBirthDate)
        : undefined,
      certificateRecipientDeathDate: updates.certificateRecipientDeathDate
        ? new Date(updates.certificateRecipientDeathDate)
        : undefined,
      funeralDateOfDeath: updates.funeralDateOfDeath
        ? new Date(updates.funeralDateOfDeath)
        : undefined,
      marriageDate: updates.marriageDate ? new Date(updates.marriageDate) : undefined
    }
  });

  if (
    updates.status === RequestStatus.COMPLETED &&
    existing.status !== RequestStatus.COMPLETED &&
    updated.category === RequestCategory.SACRAMENT
  ) {
    const sacramentType = mapServiceToSacramentType(updated.serviceType);
    if (sacramentType) {
      const possibleDate =
        recordDetails?.date ||
        updates.confirmedSchedule?.split(' ')[0] ||
        updates.preferredDate ||
        existing.confirmedSchedule?.split(' ')[0] ||
        existing.preferredDate;

      const date = possibleDate && !Number.isNaN(Date.parse(possibleDate))
        ? new Date(possibleDate)
        : new Date();

      await prisma.sacramentRecord.create({
        data: {
          name: recordDetails?.name ?? updated.requesterName,
          date,
          type: recordDetails?.type ?? sacramentType,
          officiant: recordDetails?.officiant ?? 'Parish Priest',
          details:
            recordDetails?.details ??
            `Generated from Request #${updated.id}. Details: ${updated.details}`,
          requestId: updated.id,
          fatherName: recordDetails?.fatherName,
          motherName: recordDetails?.motherName,
          birthDate: recordDetails?.birthDate ? new Date(recordDetails.birthDate) : undefined,
          birthPlace: recordDetails?.birthPlace,
          baptismDate: recordDetails?.baptismDate ? new Date(recordDetails.baptismDate) : undefined,
          baptismPlace: recordDetails?.baptismPlace,
          sponsors: recordDetails?.sponsors,
          registerBook: recordDetails?.registerBook,
          registerPage: recordDetails?.registerPage,
          registerLine: recordDetails?.registerLine,
          residence: recordDetails?.residence,
          dateOfDeath: recordDetails?.dateOfDeath ? new Date(recordDetails.dateOfDeath) : undefined,
          causeOfDeath: recordDetails?.causeOfDeath,
          placeOfBurial: recordDetails?.placeOfBurial,
          groomName: recordDetails?.groomName,
          brideName: recordDetails?.brideName,
          groomAge: recordDetails?.groomAge,
          brideAge: recordDetails?.brideAge,
          groomResidence: recordDetails?.groomResidence,
          brideResidence: recordDetails?.brideResidence,
          groomNationality: recordDetails?.groomNationality,
          brideNationality: recordDetails?.brideNationality,
          groomFatherName: recordDetails?.groomFatherName,
          brideFatherName: recordDetails?.brideFatherName,
          groomMotherName: recordDetails?.groomMotherName,
          brideMotherName: recordDetails?.brideMotherName
        }
      });
    }
  }

  res.json(updated);
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Request not found' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.issuedCertificate.deleteMany({ where: { requestId: id } });
      await tx.sacramentRecord.updateMany({
        where: { requestId: id },
        data: { requestId: null }
      });
      await tx.serviceRequest.delete({ where: { id } });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Failed to delete request', error);
    res.status(500).json({ message: 'Unable to delete request' });
  }
});

router.post('/:id/issue', authenticate, async (req, res) => {
  const { id } = req.params;
  const { deliveryMethod, notes, issuedBy } = req.body as {
    deliveryMethod: DeliveryMethod;
    notes?: string;
    issuedBy: string;
  };

  if (!deliveryMethod || !issuedBy) {
    return res.status(400).json({ message: 'Delivery method and issuer are required' });
  }

  const request = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!request) {
    return res.status(404).json({ message: 'Request not found' });
  }

  if (request.category === RequestCategory.CERTIFICATE) {
    const sacramentType = mapServiceToSacramentType(request.serviceType);
    if (sacramentType) {
      const where: any = { type: sacramentType, isArchived: false };
      if (sacramentType === SacramentType.MARRIAGE) {
        if (request.marriageGroomName) {
          where.groomName = request.marriageGroomName;
        }
        if (request.marriageBrideName) {
          where.brideName = request.marriageBrideName;
        }
        if (request.marriageDate) {
          where.date = request.marriageDate;
        }
      } else {
        if (request.certificateRecipientName) {
          where.name = request.certificateRecipientName;
        }
        if (sacramentType === SacramentType.FUNERAL && request.certificateRecipientDeathDate) {
          where.dateOfDeath = request.certificateRecipientDeathDate;
        }
        if (sacramentType !== SacramentType.FUNERAL && request.certificateRecipientBirthDate) {
          where.birthDate = request.certificateRecipientBirthDate;
        }
      }

      const record = await prisma.sacramentRecord.findFirst({ where });
      if (!record) {
        return res.status(400).json({ message: 'No sacrament record found for this certificate request' });
      }
    }
  }

  const existingCert = await prisma.issuedCertificate.findFirst({
    where: { requestId: request.id }
  });
  if (existingCert) {
    return res.status(400).json({ message: 'Certificate already issued for this request' });
  }

  const normalizedType = request.serviceType.toLowerCase();
  const marriageRecipient =
    request.marriageGroomName && request.marriageBrideName
      ? `${request.marriageGroomName} & ${request.marriageBrideName}`
      : undefined;
  const recipientName = normalizedType.includes('marriage')
    ? (marriageRecipient || request.certificateRecipientName || request.requesterName)
    : (request.certificateRecipientName || request.details.slice(0, 50));

  const certificate = await prisma.$transaction(async (tx) => {
    const created = await tx.issuedCertificate.create({
      data: {
        requestId: request.id,
        type: request.serviceType,
        recipientName,
        requesterName: request.requesterName,
        issuedBy,
        deliveryMethod,
        notes
      }
    });

    await tx.serviceRequest.update({
      where: { id: request.id },
      data: { status: RequestStatus.COMPLETED }
    });

    return created;
  });

  res.status(201).json(certificate);
});

export default router;
