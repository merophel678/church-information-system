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

type ConfirmationTemplateData = {
  candidateName: string;
  fatherName: string;
  motherName: string;
  birthDate: Date | null;
  birthPlace: string;
  baptismDate: Date | null;
  baptismPlace: string;
  sponsorsPrimary: string;
  sponsorsSecondary: string;
  registerBook: string;
  registerPage: string;
  registerLine: string;
  confirmationDate: Date | null;
  priestName: string;
  priestTitle: string;
  issueDate: Date;
  parishName: string;
  parishLocation: string;
  parishOfficeLocation: string;
  diocese: string;
  logoDataUri?: string;
};

type BurialTemplateData = {
  name: string;
  residence: string;
  dateOfDeath: Date | null;
  causeOfDeath: string;
  dateOfBurial: Date | null;
  placeOfBurial: string;
  ministerName: string;
  registerBook: string;
  registerPage: string;
  registerLine: string;
  priestName: string;
  priestTitle: string;
  issueDate: Date;
  parishName: string;
  parishLocation: string;
  parishOfficeLocation: string;
  diocese: string;
  logoDataUri?: string;
};

type MarriageTemplateData = {
  groomName: string;
  brideName: string;
  groomAge: string;
  brideAge: string;
  groomResidence: string;
  brideResidence: string;
  groomNationality: string;
  brideNationality: string;
  groomFatherName: string;
  brideFatherName: string;
  groomMotherName: string;
  brideMotherName: string;
  witnesses: string;
  registerBook: string;
  registerPage: string;
  registerLine: string;
  marriageDate: Date | null;
  officiant: string;
  priestName: string;
  priestTitle: string;
  issueDate: Date;
  diocese: string;
  parishName: string;
  parishLocationLine1: string;
  parishLocationLine2: string;
  logoDataUri?: string;
  weddingLogoDataUri?: string;
};

const parishDefaults = {
  diocese: 'Diocese of Borongan',
  parishName: 'Quasi Parish of Our Lady of the Miraculous Medal',
  parishLocation: 'Sabang, Borongan City'
};

const confirmationDefaults = {
  diocese: 'Diocese of Borongan',
  parishName: 'Quasi-Parish of Our Lady of the Miraculous Medal',
  parishLocation: 'Sabang South, Borongan City, Eastern Samar',
  parishOfficeLocation: 'Parish Office, Sabang South, Borongan City, Eastern Samar'
};

const burialDefaults = {
  diocese: 'Diocese of Borongan',
  parishName: 'Quasi-Parish of Our Lady of the Miraculous Medal',
  parishLocation: 'Sabang, Borongan City',
  parishOfficeLocation: 'Quasi-Parish office of Our Lady of the Miraculous Medal, Sabang, Borongan City'
};

const marriageDefaults = {
  diocese: 'Diocese of Borongan',
  parishName: 'QUASI-PARISH OF OUR LADY OF THE MIRACULOUS MEDAL',
  parishLocationLine1: 'Brgy Sabang South, Borongan City',
  parishLocationLine2: 'Philippines'
};

const loadAssetDataUri = (fileName: string): string | undefined => {
  try {
    const filePath = path.join(process.cwd(), 'assets', fileName);
    const file = fs.readFileSync(filePath);
    const base64 = file.toString('base64');
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
};

const loadLogoDataUri = (): string | undefined => loadAssetDataUri('church-logo.png');

const loadWeddingLogoDataUri = (): string | undefined => loadAssetDataUri('wedding-logo.png');

const ordinal = (date: Date | null): string => {
  if (!date) return '';
  const d = date.getDate();
  const suffix = d % 10 === 1 && d !== 11 ? 'ST' : d % 10 === 2 && d !== 12 ? 'ND' : d % 10 === 3 && d !== 13 ? 'RD' : 'TH';
  return `${d}${suffix}`;
};

const ordinalLower = (date: Date | null): string => {
  if (!date) return '';
  const d = date.getDate();
  const suffix = d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th';
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

const monthUpper = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleString('en-US', { month: 'long' }).toUpperCase();
};

const monthTitle = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleString('en-US', { month: 'long' });
};

const yearTwoDigits = (date: Date | null): string => {
  if (!date) return '';
  return String(date.getFullYear()).slice(-2);
};

const dayNumber = (date: Date | null): string => {
  if (!date) return '';
  return String(date.getDate());
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
      text-align: center;
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

const renderConfirmationTemplate = (data: ConfirmationTemplateData): string => {
  const {
    candidateName,
    fatherName,
    motherName,
    birthDate,
    birthPlace,
    baptismDate,
    baptismPlace,
    sponsorsPrimary,
    sponsorsSecondary,
    registerBook,
    registerPage,
    registerLine,
    confirmationDate,
    priestName,
    priestTitle,
    issueDate,
    parishName,
    parishLocation,
    parishOfficeLocation,
    diocese,
    logoDataUri
  } = data;

  const confirmationDay = dayNumber(confirmationDate);
  const confirmationMonth = monthUpper(confirmationDate);
  const confirmationYear = yearTwoDigits(confirmationDate);
  const issueDay = dayNumber(issueDate);
  const issueMonth = monthUpper(issueDate);
  const issueYear = yearTwoDigits(issueDate);
  const birthDateText = fullDateUpper(birthDate);
  const baptismDateText = fullDateUpper(baptismDate);

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Logo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;" />`
    : 'LOGO';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Confirmation</title>
  <style>
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
      padding: 50px 60px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
      text-align: center;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      flex-shrink: 0;
      overflow: hidden;
    }
    .header-text {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .diocese {
      font-weight: bold;
      font-size: 11pt;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .parish-name {
      font-weight: bold;
      font-style: italic;
      font-size: 10pt;
      text-transform: uppercase;
      margin-bottom: 3px;
    }
    .location {
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
    }
    .title-section {
      text-align: center;
      margin-top: 30px;
      margin-bottom: 40px;
    }
    .main-title {
      font-family: Calibri, "Segoe UI", Arial, sans-serif;
      font-size: 28pt;
      font-weight: normal;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      font-weight: bold;
      font-size: 11pt;
    }
    .info-section {
      margin-left: 20px;
      margin-bottom: 30px;
      font-size: 12pt;
      line-height: 1.5;
    }
    .info-row {
      display: flex;
      margin-bottom: 5px;
    }
    .label {
      font-weight: bold;
      width: 140px;
    }
    .field-value {
      flex-grow: 1;
    }
    .body-text {
      text-align: justify;
      font-size: 12pt;
      line-height: 1.8;
      margin-bottom: 20px;
    }
    .inline-value {
      font-weight: bold;
      text-transform: uppercase;
    }
    .italic-bold {
      font-style: italic;
      font-weight: bold;
    }
    .footer {
      margin-top: 100px;
      display: flex;
      justify-content: flex-end;
      padding-right: 20px;
    }
    .signature-block {
      text-align: center;
      width: 250px;
    }
    .priest-name {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11pt;
      border-bottom: 1px solid black;
      padding-bottom: 2px;
      margin-bottom: 5px;
    }
    .priest-title {
      font-style: italic;
      font-weight: bold;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="header">
      <div class="logo-placeholder">${logoHtml}</div>
      <div class="header-text">
        <div class="diocese">${diocese}</div>
        <div class="parish-name">${parishName}</div>
        <div class="location">${parishLocation}</div>
      </div>
    </div>

    <div class="title-section">
      <div class="main-title">Certificate of Confirmation</div>
      <div class="subtitle">This is to certify that</div>
    </div>

    <div class="info-section">
      <div class="info-row"><div class="label">NAME:</div><div class="field-value">${candidateName}</div></div>
      <div class="info-row"><div class="label">FATHER:</div><div class="field-value">${fatherName}</div></div>
      <div class="info-row"><div class="label">MOTHER:</div><div class="field-value">${motherName}</div></div>
      <div class="info-row"><div class="label">Born on:</div><div class="field-value">${birthDateText}</div></div>
      <div class="info-row"><div class="label">Place of Birth:</div><div class="field-value">${birthPlace}</div></div>
      <div class="info-row"><div class="label">Date of Baptism:</div><div class="field-value">${baptismDateText}</div></div>
      <div class="info-row"><div class="label">Place of Baptism:</div><div class="field-value">${baptismPlace}</div></div>
    </div>

    <div class="body-text">
      <div style="text-align: center; margin-bottom: 20px;">
        was solemnly CONFIRMED according to the Rites of the Roman Catholic Church
      </div>
      on the <span class="inline-value">${confirmationDay}</span> day of <span class="inline-value">${confirmationMonth}</span> <span class="inline-value">20${confirmationYear}</span>, at the <span class="italic-bold">${parishName}</span>, ${parishLocation}, by the <span class="italic-bold">${priestName}</span>. The sponsors being: <span class="inline-value">${sponsorsPrimary}</span> <span class="inline-value">${sponsorsSecondary}</span>, as it appears in the CONFIRMATION REGISTER, Book No: <span class="inline-value">${registerBook}</span>, Page No: <span class="inline-value">${registerPage}</span>, Line No. <span class="inline-value">${registerLine}</span>.
    </div>

    <div class="body-text">
      Given this <span class="inline-value">${issueDay}</span> day of <span class="inline-value">${issueMonth}</span> <span class="inline-value">20${issueYear}</span>, at the ${parishOfficeLocation}.
    </div>

    <div class="footer">
      <div class="signature-block">
        <div class="priest-name">${priestName}</div>
        <div class="priest-title">${priestTitle}</div>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const renderBurialTemplate = (data: BurialTemplateData): string => {
  const {
    name,
    residence,
    dateOfDeath,
    causeOfDeath,
    dateOfBurial,
    placeOfBurial,
    ministerName,
    registerBook,
    registerPage,
    registerLine,
    priestName,
    priestTitle,
    issueDate,
    parishName,
    parishLocation,
    parishOfficeLocation,
    diocese,
    logoDataUri
  } = data;

  const dateOfDeathText = fullDateUpper(dateOfDeath);
  const dateOfBurialText = fullDateUpper(dateOfBurial);
  const issueDay = ordinal(issueDate);
  const issueMonthYear = monthYearUpper(issueDate);

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Logo" style="width:80px;height:80px;border-radius:50%;object-fit:contain;" />`
    : 'LOGO';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Burial</title>
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
      padding: 40px 50px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
    }
    .border-frame {
      border: 3px solid #000;
      height: 100%;
      width: 100%;
      padding: 30px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 30px;
      width: 100%;
    }
    .logo-placeholder {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 1px dashed #999;
      background-color: #f9f9f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #666;
      flex-shrink: 0;
      overflow: hidden;
    }
    .header-text {
      text-align: center;
    }
    .diocese {
      font-size: 13pt;
      margin-bottom: 5px;
    }
    .parish-name {
      font-weight: bold;
      font-size: 11pt;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .location {
      font-size: 12pt;
    }
    .main-title {
      font-family: 'UnifrakturMaguntia', cursive;
      font-size: 36pt;
      text-align: center;
      margin-bottom: 50px;
      letter-spacing: 1px;
    }
    .data-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      row-gap: 20px;
      margin-bottom: 40px;
      font-size: 12pt;
      padding-left: 10px;
    }
    .label {
      font-family: "Times New Roman", Times, serif;
      align-self: center;
      text-transform: uppercase;
    }
    .value {
      font-family: "Bookman Old Style", "Bookman", Georgia, serif;
      font-weight: 900;
      text-transform: uppercase;
      font-size: 12pt;
      color: #222;
    }
    .body-text {
      text-align: justify;
      font-size: 12pt;
      line-height: 1.6;
      margin-bottom: 60px;
      padding: 0 10px;
    }
    .highlight-date {
      font-family: "Bookman Old Style", "Bookman", Georgia, serif;
      font-weight: 900;
    }
    .signature-section {
      text-align: center;
      margin-bottom: 50px;
    }
    .priest-name {
      font-family: "Bookman Old Style", "Bookman", Georgia, serif;
      font-weight: 900;
      font-size: 14pt;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .priest-title {
      font-family: "Times New Roman", Times, serif;
      font-weight: bold;
      font-size: 12pt;
    }
    .record-info {
      position: absolute;
      bottom: 30px;
      left: 30px;
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.4;
    }
    .record-value {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="border-frame">
      <div class="header">
        <div class="logo-placeholder">${logoHtml}</div>
        <div class="header-text">
          <div class="diocese">${diocese}</div>
          <div class="parish-name">${parishName}</div>
          <div class="location">${parishLocation}</div>
        </div>
      </div>

      <div class="main-title">Certificate of Burial</div>

      <div class="data-grid">
        <div class="label">Name:</div>
        <div class="value">${name}</div>

        <div class="label">Residence:</div>
        <div class="value">${residence}</div>

        <div class="label">Date of Death:</div>
        <div class="value">${dateOfDeathText}</div>

        <div class="label">Cause of Death:</div>
        <div class="value">${causeOfDeath}</div>

        <div class="label">Date of Burial:</div>
        <div class="value">${dateOfBurialText}</div>

        <div class="label">Place of Burial:</div>
        <div class="value">${placeOfBurial}</div>

        <div class="label">Name of Minister:</div>
        <div class="value">${ministerName}</div>
      </div>

      <div class="body-text">
        Given this <span class="highlight-date">${issueDay}</span> day of <span class="highlight-date">${issueMonthYear}</span> at the ${parishOfficeLocation}.
      </div>

      <div class="signature-section">
        <div class="priest-name">${priestName}</div>
        <div class="priest-title">${priestTitle}</div>
      </div>

      <div class="record-info">
        Book no.: <span class="record-value">${registerBook || '___'}</span><br />
        Page no. <span class="record-value">${registerPage || '___'}</span><br />
        Line no. <span class="record-value">${registerLine || '___'}</span>
      </div>
    </div>
  </div>
</body>
</html>
`;
};

const renderMarriageTemplate = (data: MarriageTemplateData): string => {
  const {
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
    brideMotherName,
    witnesses,
    registerBook,
    registerPage,
    registerLine,
    marriageDate,
    officiant,
    priestName,
    priestTitle,
    diocese,
    parishName,
    parishLocationLine1,
    parishLocationLine2,
    logoDataUri,
    weddingLogoDataUri
  } = data;

  const dayText = ordinalLower(marriageDate);
  const monthText = monthTitle(marriageDate);
  const yearText = marriageDate ? String(marriageDate.getFullYear()) : '';

  const logoHtml = logoDataUri
    ? `<img src="${logoDataUri}" alt="Logo" style="width:70px;height:70px;border-radius:50%;object-fit:contain;" />`
    : 'LOGO';
  const weddingLogoHtml = weddingLogoDataUri
    ? `<img src="${weddingLogoDataUri}" alt="Wedding Logo" style="width:120px;height:auto;object-fit:contain;" />`
    : 'LOGO';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Certificate of Marriage</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
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
      padding: 40px 50px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      box-shadow: 0 0 15px rgba(0,0,0,0.1);
    }
    .border-frame {
      border: 3px solid #333;
      height: 100%;
      width: 100%;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .header-section {
      display: flex;
      align-items: flex-end;
      margin-bottom: 20px;
      position: relative;
    }
    .header-left-image {
      width: 120px;
      height: auto;
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-center {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-right: 120px;
    }
    .diocese-logo {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      border: 1px dashed #999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      margin-bottom: 10px;
      overflow: hidden;
    }
    .header-text {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      font-weight: bold;
      line-height: 1.3;
    }
    .main-title {
      text-align: center;
      font-family: "Bookman Old Style", "Bookman", Georgia, serif;
      font-weight: 900;
      font-size: 24pt;
      text-transform: uppercase;
      margin-top: 10px;
      margin-bottom: 10px;
      color: #222;
    }
    .script-subtitle {
      text-align: center;
      font-family: 'Great Vibes', 'Brush Script MT', cursive;
      font-size: 22pt;
      margin-bottom: 20px;
      color: #333;
    }
    .data-grid {
      display: grid;
      grid-template-columns: 90px 1fr 40px 1fr;
      column-gap: 10px;
      row-gap: 8px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      margin-bottom: 30px;
    }
    .label {
      font-weight: bold;
      color: #000;
    }
    .value {
      color: #222;
    }
    .center-word {
      text-align: center;
      font-style: italic;
      font-family: "Times New Roman", serif;
    }
    .ceremony-section {
      text-align: center;
      margin-bottom: 30px;
    }
    .script-large {
      font-family: 'Great Vibes', 'Brush Script MT', cursive;
      font-size: 32pt;
      margin: 10px 0;
      font-weight: normal;
    }
    .rites-text {
      font-family: "Times New Roman", serif;
      font-style: italic;
      font-weight: bold;
      font-size: 14pt;
      margin-bottom: 20px;
    }
    .paragraph-text {
      text-align: justify;
      font-family: "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.6;
    }
    .fill-bold {
      font-family: Arial, Helvetica, sans-serif;
      font-weight: bold;
      font-style: italic;
    }
    .footer {
      margin-top: 60px;
      display: flex;
      justify-content: flex-end;
      padding-right: 30px;
    }
    .signature-block {
      text-align: center;
    }
    .priest-name {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11pt;
      font-family: Arial, Helvetica, sans-serif;
    }
    .priest-title {
      font-style: italic;
      font-size: 10pt;
      font-family: "Times New Roman", serif;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <div class="border-frame">
      <div class="header-section">
        <div class="header-left-image">${weddingLogoHtml}</div>
        <div class="header-center">
          <div class="diocese-logo">${logoHtml}</div>
          <div class="header-text">
            ${diocese}<br />
            ${parishName}<br />
            ${parishLocationLine1}<br />
            ${parishLocationLine2}
          </div>
        </div>
      </div>

      <div class="main-title">Certificate of Marriage</div>
      <div class="script-subtitle">This Certifies that</div>

      <div class="data-grid">
        <div class="label">Name:</div>
        <div class="value" style="font-weight: bold;">${groomName}</div>
        <div class="center-word">and</div>
        <div class="value" style="font-weight: bold;">${brideName}</div>

        <div class="label">Age:</div>
        <div class="value">${groomAge}</div>
        <div></div>
        <div class="value">${brideAge}</div>

        <div class="label">Residence:</div>
        <div class="value">${groomResidence}</div>
        <div></div>
        <div class="value">${brideResidence}</div>

        <div class="label">Nationality:</div>
        <div class="value">${groomNationality}</div>
        <div></div>
        <div class="value">${brideNationality}</div>

        <div class="label">Father:</div>
        <div class="value">${groomFatherName}</div>
        <div></div>
        <div class="value">${brideFatherName}</div>

        <div class="label">Mother:</div>
        <div class="value">${groomMotherName}</div>
        <div></div>
        <div class="value">${brideMotherName}</div>
      </div>

      <div class="ceremony-section">
        <div class="script-subtitle">were united in</div>
        <div class="script-large">Holy Matrimony</div>
        <div class="rites-text">According to the Rites of the Holy Roman Catholic Church</div>
      </div>

      <div class="paragraph-text">
        on the <span class="fill-bold">${dayText}</span> day of <span class="fill-bold">${monthText}</span> year <span class="fill-bold">${yearText}</span>. The Marriage was solemnized by <span class="fill-bold">${officiant}</span>, in the presence of <span class="fill-bold">${witnesses}</span> as witnesses as appears from the Marriage Records of this Church<br />
        Book No. <span class="fill-bold">${registerBook || '___'}</span>, Page No. <span class="fill-bold">${registerPage || '___'}</span>, Line No. <span class="fill-bold">${registerLine || '___'}</span>
      </div>

      <div class="footer">
        <div class="signature-block">
          <br /><br />
          <div class="priest-name">${priestName}</div>
          <div class="priest-title">${priestTitle}</div>
        </div>
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

    const deathDateFilter = certificate.request?.certificateRecipientDeathDate
      ? new Date(certificate.request.certificateRecipientDeathDate)
      : undefined;

    const fallback = await prisma.sacramentRecord.findFirst({
      where: {
        type: SacramentType.BAPTISM,
        isArchived: false,
        name: recipientName,
        ...(deathDateFilter ? { dateOfDeath: deathDateFilter } : {})
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

export const generateConfirmationCertificate = async (certificateId: string, uploadedBy: string) => {
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
    (r) => r.type === SacramentType.CONFIRMATION && !r.isArchived
  );

  if (!record) {
    const candidateName =
      certificate.request?.confirmationCandidateName ||
      certificate.recipientName ||
      certificate.request?.requesterName;

    const birthDateFilter = certificate.request?.confirmationCandidateBirthDate
      ? new Date(certificate.request.confirmationCandidateBirthDate)
      : undefined;

    const fallback = await prisma.sacramentRecord.findFirst({
      where: {
        type: SacramentType.CONFIRMATION,
        isArchived: false,
        name: candidateName,
        ...(birthDateFilter ? { birthDate: birthDateFilter } : {})
      },
      orderBy: { date: 'desc' }
    });

    if (fallback) {
      if (!fallback.requestId) {
        await prisma.sacramentRecord.update({
          where: { id: fallback.id },
          data: { requestId: certificate.requestId }
        });
      }
      record = fallback;
    } else {
      throw new Error('No confirmation record linked to this certificate');
    }
  }

  const sponsors = (record.sponsors ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const sponsorsPrimary = sponsors[0] ?? '';
  const sponsorsSecondary = sponsors[1] ?? '';

  const logoDataUri = loadLogoDataUri();

  const data: ConfirmationTemplateData = {
    candidateName: (record.name ?? '').toUpperCase(),
    fatherName: (record.fatherName ?? '').toUpperCase(),
    motherName: (record.motherName ?? '').toUpperCase(),
    birthDate: record.birthDate ?? null,
    birthPlace: (record.birthPlace ?? '').toUpperCase(),
    baptismDate: record.baptismDate ?? null,
    baptismPlace: (record.baptismPlace ?? '').toUpperCase(),
    sponsorsPrimary: sponsorsPrimary.toUpperCase(),
    sponsorsSecondary: sponsorsSecondary.toUpperCase(),
    registerBook: record.registerBook ?? '',
    registerPage: record.registerPage ?? '',
    registerLine: record.registerLine ?? '',
    confirmationDate: record.date ?? null,
    priestName: (record.officiant || certificate.issuedBy || 'Parish Priest').toUpperCase(),
    priestTitle: 'Parish Priest',
    issueDate: certificate.dateIssued,
    parishName: confirmationDefaults.parishName,
    parishLocation: confirmationDefaults.parishLocation,
    parishOfficeLocation: confirmationDefaults.parishOfficeLocation,
    diocese: confirmationDefaults.diocese,
    logoDataUri
  };

  const html = renderConfirmationTemplate(data);
  const pdfBuffer = await renderPdfFromHtml(html);

  const fileName = `confirmation-certificate-${record.name?.replace(/\s+/g, '-').toLowerCase() || 'certificate'}.pdf`;

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

export const generateMarriageCertificate = async (certificateId: string, uploadedBy: string) => {
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
    (r) => r.type === SacramentType.MARRIAGE && !r.isArchived
  );

  if (!record) {
    const groomName = certificate.request?.marriageGroomName;
    const brideName = certificate.request?.marriageBrideName;
    const marriageDate = certificate.request?.marriageDate ? new Date(certificate.request.marriageDate) : undefined;

    const fallback = await prisma.sacramentRecord.findFirst({
      where: {
        type: SacramentType.MARRIAGE,
        isArchived: false,
        ...(groomName ? { groomName } : {}),
        ...(brideName ? { brideName } : {}),
        ...(marriageDate ? { date: marriageDate } : {})
      },
      orderBy: { date: 'desc' }
    });

    if (fallback) {
      if (!fallback.requestId) {
        await prisma.sacramentRecord.update({
          where: { id: fallback.id },
          data: { requestId: certificate.requestId }
        });
      }
      record = fallback;
    } else {
      throw new Error('No marriage record linked to this certificate');
    }
  }

  const logoDataUri = loadLogoDataUri();
  const weddingLogoDataUri = loadWeddingLogoDataUri();
  const priestName = record.officiant || certificate.issuedBy || 'Parish Priest';

  const data: MarriageTemplateData = {
    groomName: (record.groomName ?? '').toUpperCase(),
    brideName: (record.brideName ?? '').toUpperCase(),
    groomAge: record.groomAge ?? '',
    brideAge: record.brideAge ?? '',
    groomResidence: (record.groomResidence ?? '').toUpperCase(),
    brideResidence: (record.brideResidence ?? '').toUpperCase(),
    groomNationality: (record.groomNationality ?? '').toUpperCase(),
    brideNationality: (record.brideNationality ?? '').toUpperCase(),
    groomFatherName: (record.groomFatherName ?? '').toUpperCase(),
    brideFatherName: (record.brideFatherName ?? '').toUpperCase(),
    groomMotherName: (record.groomMotherName ?? '').toUpperCase(),
    brideMotherName: (record.brideMotherName ?? '').toUpperCase(),
    witnesses: (record.sponsors ?? '').toUpperCase(),
    registerBook: record.registerBook ?? '',
    registerPage: record.registerPage ?? '',
    registerLine: record.registerLine ?? '',
    marriageDate: record.date ?? null,
    officiant: priestName.toUpperCase(),
    priestName: priestName.toUpperCase(),
    priestTitle: 'Parish Priest',
    issueDate: certificate.dateIssued,
    diocese: marriageDefaults.diocese,
    parishName: marriageDefaults.parishName,
    parishLocationLine1: marriageDefaults.parishLocationLine1,
    parishLocationLine2: marriageDefaults.parishLocationLine2,
    logoDataUri,
    weddingLogoDataUri
  };

  const html = renderMarriageTemplate(data);
  const pdfBuffer = await renderPdfFromHtml(html);

  const fileName = `marriage-certificate-${record.groomName?.replace(/\s+/g, '-').toLowerCase() || 'groom'}-${record.brideName?.replace(/\s+/g, '-').toLowerCase() || 'bride'}.pdf`;

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

export const generateBurialCertificate = async (certificateId: string, uploadedBy: string) => {
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
    (r) => r.type === SacramentType.FUNERAL && !r.isArchived
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
        type: SacramentType.FUNERAL,
        isArchived: false,
        name: recipientName,
        ...(birthDateFilter ? { birthDate: birthDateFilter } : {})
      },
      orderBy: { date: 'desc' }
    });

    if (fallback) {
      if (!fallback.requestId) {
        await prisma.sacramentRecord.update({
          where: { id: fallback.id },
          data: { requestId: certificate.requestId }
        });
      }
      record = fallback;
    } else {
      throw new Error('No funeral record linked to this certificate');
    }
  }

  const logoDataUri = loadLogoDataUri();
  const minister = record.officiant || certificate.issuedBy || 'Parish Priest';

  const data: BurialTemplateData = {
    name: (record.name ?? '').toUpperCase(),
    residence: (record.residence ?? '').toUpperCase(),
    dateOfDeath: record.dateOfDeath ?? null,
    causeOfDeath: (record.causeOfDeath ?? '').toUpperCase(),
    dateOfBurial: record.date ?? null,
    placeOfBurial: (record.placeOfBurial ?? '').toUpperCase(),
    ministerName: minister.toUpperCase(),
    registerBook: record.registerBook ?? '',
    registerPage: record.registerPage ?? '',
    registerLine: record.registerLine ?? '',
    priestName: minister.toUpperCase(),
    priestTitle: 'Parish Priest',
    issueDate: certificate.dateIssued,
    parishName: burialDefaults.parishName,
    parishLocation: burialDefaults.parishLocation,
    parishOfficeLocation: burialDefaults.parishOfficeLocation,
    diocese: burialDefaults.diocese,
    logoDataUri
  };

  const html = renderBurialTemplate(data);
  const pdfBuffer = await renderPdfFromHtml(html);

  const fileName = `burial-certificate-${record.name?.replace(/\s+/g, '-').toLowerCase() || 'certificate'}.pdf`;

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
