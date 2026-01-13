import { Router } from 'express';
import multer from 'multer';
import prisma from '../prisma.js';
import { authenticate } from '../middleware/auth.js';
import config from '../config.js';
import { CertificateStatus } from '@prisma/client';
import {
  generateBaptismCertificate,
  generateBurialCertificate,
  generateConfirmationCertificate
} from '../services/certificateGenerator.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.uploadFileLimitMb * 1024 * 1024 }
});

const reminderThresholdMs = config.uploadReminderHours * 60 * 60 * 1000;

const sanitizeCertificate = (certificate: any, needsUploadReminder = false) => {
  const { fileData, ...rest } = certificate;
  return { ...rest, needsUploadReminder };
};

router.get('/', authenticate, async (_req, res) => {
  const certificates = await prisma.issuedCertificate.findMany({
    orderBy: { dateIssued: 'desc' }
  });

  const now = Date.now();
  const response = certificates.map((cert) => {
    const needsUploadReminder =
      cert.status === CertificateStatus.PENDING_UPLOAD &&
      now - cert.dateIssued.getTime() >= reminderThresholdMs;
    return sanitizeCertificate(cert, needsUploadReminder);
  });

  res.json(response);
});

router.post('/:id/generate', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const certificate = await prisma.issuedCertificate.findUnique({ where: { id } });
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const normalizedType = certificate.type.toLowerCase();
    let updated;
    if (normalizedType.includes('baptism')) {
      updated = await generateBaptismCertificate(id, req.user?.username ?? 'Staff');
    } else if (normalizedType.includes('confirmation')) {
      updated = await generateConfirmationCertificate(id, req.user?.username ?? 'Staff');
    } else if (normalizedType.includes('funeral') || normalizedType.includes('burial') || normalizedType.includes('death')) {
      updated = await generateBurialCertificate(id, req.user?.username ?? 'Staff');
    } else {
      return res.status(400).json({ message: 'No generator available for this certificate type' });
    }

    res.json(sanitizeCertificate(updated));
  } catch (err: any) {
    const message = err?.message ?? 'Unable to generate certificate';
    if (
      message.includes('not found') ||
      message.includes('No baptism record') ||
      message.includes('No confirmation record') ||
      message.includes('No funeral record')
    ) {
      return res.status(400).json({ message });
    }
    console.error(err);
    res.status(500).json({ message: 'Unable to generate certificate' });
  }
});

router.post('/:id/upload', authenticate, upload.single('file'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: 'Certificate file is required' });
  }

  const certificate = await prisma.issuedCertificate.findUnique({ where: { id } });
  if (!certificate) {
    return res.status(404).json({ message: 'Certificate not found' });
  }

  const updated = await prisma.issuedCertificate.update({
    where: { id },
    data: {
      status: CertificateStatus.UPLOADED,
      fileData: req.file.buffer,
      fileName: req.file.originalname,
      fileMimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: req.user?.username ?? 'Staff'
    }
  });

  res.json(sanitizeCertificate(updated));
});

router.get('/:id/file', authenticate, async (req, res) => {
  const { id } = req.params;

  const certificate = await prisma.issuedCertificate.findUnique({ where: { id } });
  if (!certificate || certificate.status !== CertificateStatus.UPLOADED || !certificate.fileData) {
    return res.status(404).json({ message: 'Certificate file not available' });
  }

  res.setHeader('Content-Type', certificate.fileMimeType ?? 'application/octet-stream');
  const filename = certificate.fileName ?? 'certificate';
  res.setHeader('Content-Disposition', `inline; filename=\"${filename}\"`);
  res.send(Buffer.from(certificate.fileData));
});

export default router;
