import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import prisma from '../prisma.js';
import { CertificateStatus, SacramentType } from '@prisma/client';

type BaptismTemplateData = {
  childName: string;
  fatherName: string;
  motherName: string;
  birthDate: Date | null;
  birthPlace: string;
  baptismDate: Date | null;
  baptismPlace: string;
  sponsors: string;
  registerBook: string;
  registerPage: string;
  registerLine: string;
  priestName: string;
  priestTitle: string;
  issueDate: Date;
  parishName: string;
  parishLocation: string;
  diocese: string;
  logoDataUri?: string;
};

const parishDefaults = {
  diocese: 'Diocese of Borongan',
  parishName: 'Quasi Parish of Our Lady of the Miraculous Medal',
  parishLocation: 'Sabang, Borongan City'
};

const loadLogoDataUri = (): string | undefined => {
  try {
    const logoPath = path.join(process.cwd(), 'assets', 'church-logo.png');
    const file = fs.readFileSync(logoPath);
    const base64 = file.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
};

const ordinal = (date: Date | null): string => {
  if (!date) return '';
  const d = date.getDate();
  const suffix = d % 10 === 1 && d !== 11 ? 'ST' : d % 10 === 2 && d !== 12 ? 'ND' : d % 10 === 3 && d !== 13 ? 'RD' : 'TH';
  return `${d}${suffix}`;
};

const monthYearUpper = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
};

const fullDateUpper = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
};

const renderBaptismTemplate = (data: BaptismTemplateData): string => {
  const {
    childName,
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
    priestName,
    priestTitle,
    issueDate,
    parishName,
    parishLocation,
    diocese,
    logoDataUri
  } = data;

  const baptismDay = ordinal(baptismDate);
  const baptismMonthYear = monthYearUpper(baptismDate);
  const issueDay = ordinal(issueDate);
  const issueMonthYear = monthYearUpper(issueDate);
  const birthDateText = fullDateUpper(birthDate);
  const baptismPlaceText = (baptismPlace || `${parishName}, ${parishLocation}`).toUpperCase();

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Logo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;" />`
    : 'LOGO';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Baptism</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&display=swap');
    body {
      background-color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      font-family: "Times New Roman", Times, serif;
    }
    .certificate-container {
      background-color: white;
      width: 8.5in;
      height: 11in;
      padding: 40px 60px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      position: relative;
    }
    .border-frame {
      border: 3px solid #000;
      height: 100%;
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
    }
    .header {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin-bottom: 30px;
    }
    .header-top {
      display: flex;
      align-items: center;
      gap: 30px;
    }
    .header-text {
      flex: 1;
      text-align: center;
    }
    .logo-placeholder {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      overflow: hidden;
    }
    .diocese {
      font-size: 14pt;
      margin: 5px 0;
    }
    .parish-name {
      font-weight: bold;
      font-size: 12pt;
      margin: 5px 0;
      text-transform: uppercase;
    }
    .location {
      font-size: 12pt;
      margin: 5px 0 20px 0;
    }
    .main-title {
      font-family: 'UnifrakturMaguntia', cursive;
      font-size: 32pt;
      margin-top: 20px;
      margin-bottom: 30px;
    }
    .data-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      row-gap: 15px;
      margin-bottom: 30px;
      font-size: 12pt;
      padding-left: 20px;
    }
    .label { font-family: "Times New Roman", Times, serif; align-self: baseline; }
    .value { font-family: "Bookman Old Style", "Bookman", Georgia, serif; font-weight: 900; text-transform: uppercase; }
    .body-text { text-align: center; font-size: 12pt; line-height: 1.6; margin-bottom: 20px; }
    .gothic-text { text-align: center; font-family: 'UnifrakturMaguntia', cursive; font-size: 14pt; }
    .highlight { font-family: "Bookman Old Style", "Bookman", Georgia, serif; font-weight: 900; }
    .footer { margin-top: 80px; text-align: center; }
    .priest-name { font-family: "Bookman Old Style", "Bookman", Georgia, serif; font-weight: 900; font-size: 14pt; text-transform: uppercase; margin-bottom: 5px; }
    .priest-title { font-family: "Times New Roman", Times, serif; font-size: 12pt; }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="border-frame">
      <div class="header">
        <div class="header-top">
          <div class="logo-placeholder">${logoHtml}</div>
          <div class="header-text">
            <div class="diocese">${diocese}</div>
            <div class="parish-name">${parishName}</div>
            <div class="location">${parishLocation}</div>
          </div>
        </div>
        <div class="main-title">Certificate of Baptism</div>
      </div>

      <div class="data-grid">
        <div class="label">CHILD:</div>
        <div class="value">${childName}</div>

        <div class="label">FATHER:</div>
        <div class="value">${fatherName}</div>

        <div class="label">MOTHER:</div>
        <div class="value">${motherName}</div>

        <div class="label">DATE OF BIRTH:</div>
        <div class="value">${birthDateText}</div>

        <div class="label">PLACE OF BIRTH:</div>
        <div class="value">${birthPlace}</div>
      </div>

      <div class="gothic-text">was solemnly baptized according to the Rites of the Roman Catholic Church</div>

      <div class="body-text">
        on the <span class="highlight">${baptismDay}</span> day of <span class="highlight">${baptismMonthYear}</span> at the <span class="highlight">${baptismPlaceText}</span>, by the <span class="highlight">${priestName.toUpperCase()}</span>, the sponsors <span class="highlight">${sponsors}</span> as it appears in the Baptismal Register Book No. ${registerBook || '___'}, page ${registerPage || '___'}, line no. ${registerLine || '___'}
      </div>

      <div class="body-text">
        Given this <span class="highlight">${issueDay}</span> day of <span class="highlight">${issueMonthYear}</span> at the Quasi-Parish Office of ${parishName}, ${parishLocation}.
      </div>

      <div class="footer">
        <div class="priest-name">${priestName}</div>
        <div class="priest-title">${priestTitle}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const renderPdfFromHtml = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' }
  });
  await browser.close();
  return Buffer.from(pdf);
};

export const generateBaptismCertificate = async (certificateId: string, uploadedBy: string) => {
  const certificate = await prisma.issuedCertificate.findUnique({
    where: { id: certificateId },
    include: {
      request: {
        include: {
          sacramentRecords: true
        }
      }
    }
  });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  let record = certificate.request?.sacramentRecords.find(
    (r) => r.type === SacramentType.BAPTISM && !r.isArchived
  );
  if (!record) {
    const recipientName =
      certificate.request?.certificateRecipientName ||
      certificate.recipientName ||
      certificate.request?.requesterName;

    const birthDateFilter = certificate.request?.certificateRecipientBirthDate
      ? new Date(certificate.request.certificateRecipientBirthDate)
      : undefined;

    const fallback = await prisma.sacramentRecord.findFirst({
      where: {
        type: SacramentType.BAPTISM,
        isArchived: false,
        name: recipientName,
        ...(birthDateFilter ? { birthDate: birthDateFilter } : {})
      },
      orderBy: { date: 'desc' }
    });

    if (fallback) {
      // Link it for future calls if possible
      if (!fallback.requestId) {
        await prisma.sacramentRecord.update({
          where: { id: fallback.id },
          data: { requestId: certificate.requestId }
        });
      }
      record = fallback;
    } else {
      throw new Error('No baptism record linked to this certificate');
    }
  }

  const logoDataUri = loadLogoDataUri();

  const data: BaptismTemplateData = {
    childName: (record.name ?? '').toUpperCase(),
    fatherName: (record.fatherName ?? '').toUpperCase(),
    motherName: (record.motherName ?? '').toUpperCase(),
    birthDate: record.birthDate ?? null,
    birthPlace: (record.birthPlace ?? '').toUpperCase(),
    baptismDate: record.date ?? null,
    baptismPlace: (record.baptismPlace ?? '').toUpperCase(),
    sponsors: (record.sponsors ?? '').toUpperCase(),
    registerBook: record.registerBook ?? '',
    registerPage: record.registerPage ?? '',
    registerLine: record.registerLine ?? '',
    priestName: record.officiant || certificate.issuedBy || 'Parish Priest',
    priestTitle: 'Parish Priest',
    issueDate: certificate.dateIssued,
    parishName: parishDefaults.parishName,
    parishLocation: parishDefaults.parishLocation,
    diocese: parishDefaults.diocese,
    logoDataUri
  };

  const html = renderBaptismTemplate(data);
  const pdfBuffer = await renderPdfFromHtml(html);

  const fileName = `baptism-certificate-${record.name?.replace(/\s+/g, '-').toLowerCase() || 'certificate'}.pdf`;

  const updated = await prisma.issuedCertificate.update({
    where: { id: certificateId },
    data: {
      status: CertificateStatus.UPLOADED,
      fileData: pdfBuffer,
      fileName,
      fileMimeType: 'application/pdf',
      fileSize: pdfBuffer.length,
      uploadedAt: new Date(),
      uploadedBy
    }
  });

  return updated;
};
