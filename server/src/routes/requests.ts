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
  if (normalized.includes('funeral')) return SacramentType.FUNERAL;
  return null;
};

router.get('/', authenticate, async (_req, res) => {
  const requests = await prisma.serviceRequest.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json(requests);
});

router.post('/', async (req, res) => {
  const { category, serviceType, requesterName, contactInfo, preferredDate, details } = req.body;

  if (!category || !serviceType || !requesterName || !contactInfo || !details) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const request = await prisma.serviceRequest.create({
    data: {
      category,
      serviceType,
      requesterName,
      contactInfo,
      preferredDate,
      details
    }
  });

  res.status(201).json(request);
});

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const updates = req.body as Partial<{
    category: RequestCategory;
    serviceType: string;
    requesterName: string;
    contactInfo: string;
    preferredDate: string | null;
    details: string;
    status: RequestStatus;
    confirmedSchedule: string | null;
    adminNotes: string | null;
  }>;

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: 'Request not found' });
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data: updates
  });

  if (
    updates.status === RequestStatus.COMPLETED &&
    existing.status !== RequestStatus.COMPLETED &&
    updated.category === RequestCategory.SACRAMENT
  ) {
    const sacramentType = mapServiceToSacramentType(updated.serviceType);
    if (sacramentType) {
      const possibleDate =
        updates.confirmedSchedule?.split(' ')[0] ||
        updates.preferredDate ||
        existing.confirmedSchedule?.split(' ')[0] ||
        existing.preferredDate;

      const date = possibleDate && !Number.isNaN(Date.parse(possibleDate))
        ? new Date(possibleDate)
        : new Date();

      await prisma.sacramentRecord.create({
        data: {
          name: updated.requesterName,
          date,
          type: sacramentType,
          officiant: 'Parish Priest',
          details: `Generated from Request #${updated.id}. Details: ${updated.details}`,
          requestId: updated.id
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

  const certificate = await prisma.$transaction(async (tx) => {
    const created = await tx.issuedCertificate.create({
      data: {
        requestId: request.id,
        type: request.serviceType,
        recipientName: request.details.slice(0, 50),
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
