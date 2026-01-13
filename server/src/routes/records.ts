import { Router } from 'express';
import prisma from '../prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const includeArchived = req.query.includeArchived === 'true';
  const records = await prisma.sacramentRecord.findMany({
    where: includeArchived ? undefined : { isArchived: false },
    orderBy: { date: 'desc' }
  });
  res.json(records);
});

router.post('/', authenticate, async (req, res) => {
  const {
    name,
    date,
    type,
    officiant,
    details,
    fatherName,
    motherName,
    birthDate,
    birthPlace,
    baptismDate,
    baptismPlace,
    sponsors,
    registerBook,
    registerPage,
    registerLine,
    residence,
    dateOfDeath,
    causeOfDeath,
    placeOfBurial,
    groomName,
    brideName,
    groomAge,
    brideAge,
    groomResidence,
    brideResidence,
    groomNationality,
    brideNationality,
    groomFatherName,
    brideFatherName,
    groomMotherName,
    brideMotherName
  } = req.body;
  if (!name || !date || !type || !officiant || !details) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const record = await prisma.sacramentRecord.create({
    data: {
      name,
      date: new Date(date),
      type,
      officiant,
      details,
      fatherName,
      motherName,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      birthPlace,
      baptismDate: baptismDate ? new Date(baptismDate) : undefined,
      baptismPlace,
      sponsors,
      registerBook,
      registerPage,
      registerLine,
      residence,
      dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : undefined,
      causeOfDeath,
      placeOfBurial,
      groomName,
      brideName,
      groomAge,
      brideAge,
      groomResidence,
      brideResidence,
      groomNationality,
      brideNationality,
      groomFatherName,
      brideFatherName,
      groomMotherName,
      brideMotherName
    }
  });
  res.status(201).json(record);
});

router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    date,
    type,
    officiant,
    details,
    fatherName,
    motherName,
    birthDate,
    birthPlace,
    baptismDate,
    baptismPlace,
    sponsors,
    registerBook,
    registerPage,
    registerLine,
    residence,
    dateOfDeath,
    causeOfDeath,
    placeOfBurial,
    groomName,
    brideName,
    groomAge,
    brideAge,
    groomResidence,
    brideResidence,
    groomNationality,
    brideNationality,
    groomFatherName,
    brideFatherName,
    groomMotherName,
    brideMotherName
  } = req.body;

  const record = await prisma.sacramentRecord.update({
    where: { id },
    data: {
      name,
      date: date ? new Date(date) : undefined,
      type,
      officiant,
      details,
      fatherName,
      motherName,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      birthPlace,
      baptismDate: baptismDate ? new Date(baptismDate) : undefined,
      baptismPlace,
      sponsors,
      registerBook,
      registerPage,
      registerLine,
      residence,
      dateOfDeath: dateOfDeath ? new Date(dateOfDeath) : undefined,
      causeOfDeath,
      placeOfBurial,
      groomName,
      brideName,
      groomAge,
      brideAge,
      groomResidence,
      brideResidence,
      groomNationality,
      brideNationality,
      groomFatherName,
      brideFatherName,
      groomMotherName,
      brideMotherName
    }
  });
  res.json(record);
});

router.post('/:id/archive', authenticate, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body as { reason?: string };
  const record = await prisma.sacramentRecord.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedBy: req.user?.username ?? 'Staff',
      archiveReason: reason
    }
  });
  res.json(record);
});

router.post('/:id/unarchive', authenticate, async (req, res) => {
  const { id } = req.params;
  const record = await prisma.sacramentRecord.update({
    where: { id },
    data: {
      isArchived: false,
      archivedAt: null,
      archivedBy: null,
      archiveReason: null
    }
  });
  res.json(record);
});

export default router;
