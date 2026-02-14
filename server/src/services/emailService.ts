type ResendEmailPayload = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  reply_to?: string;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const getEnv = (key: string) => (process.env[key] ?? '').trim();

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function sendEmail(input: ResendEmailPayload) {
  const apiKey = getEnv('RESEND_API_KEY');
  if (!apiKey) {
    // Email is intentionally "optional" at runtime so deployments without keys still work.
    return { skipped: true as const, reason: 'missing_api_key' as const };
  }

  const from = input.from.trim();
  const toList = Array.isArray(input.to) ? input.to : [input.to];
  const to = toList.map((value) => value.trim()).filter(Boolean);

  if (!from || to.length === 0) {
    throw new Error('Missing from/to email fields');
  }
  if (!to.every(isEmail)) {
    throw new Error('Invalid recipient email address');
  }

  const payload: ResendEmailPayload = {
    from,
    to,
    subject: input.subject,
    html: input.html
  };
  if (input.reply_to) payload.reply_to = input.reply_to;

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Resend request failed');
  }

  return res.json();
}

export function resolveRequestEmail(request: { requesterEmail?: string | null; contactInfo?: string | null }) {
  const direct = (request.requesterEmail ?? '').trim();
  if (direct && isEmail(direct)) return direct;

  // Backward-compatible fallback for older rows where contactInfo stored email.
  const fallback = (request.contactInfo ?? '').trim();
  if (fallback && isEmail(fallback)) return fallback;

  return null;
}

export function buildStatusEmail(params: {
  requesterName: string;
  serviceType: string;
  requestId: string;
  status: string;
  category?: string | null;
  confirmedSchedule?: string | null;
  adminNotes?: string | null;
}) {
  const parishName = getEnv('PARISH_NAME') || 'OLMM Parish Office';
  const from = getEnv('EMAIL_FROM') || 'onboarding@resend.dev';
  const replyTo = getEnv('EMAIL_REPLY_TO') || undefined;

  const safeNotes = (params.adminNotes ?? '').trim();
  const schedule = (params.confirmedSchedule ?? '').trim();
  const isApproved = params.status.toLowerCase() === 'approved';
  const isSacrament = (params.category ?? '').toLowerCase() === 'sacrament';
  const normalizedService = params.serviceType.toLowerCase();

  const confirmationRequirements = getEnv('CONFIRMATION_REQUIREMENTS');
  const baptismRequirements = getEnv('BAPTISM_REQUIREMENTS');
  const marriageRequirements = getEnv('MARRIAGE_REQUIREMENTS');
  const funeralRequirements = getEnv('FUNERAL_REQUIREMENTS');

  const isConfirmationApproved =
    isApproved &&
    isSacrament &&
    normalizedService.includes('confirmation') &&
    confirmationRequirements;
  const isBaptismApproved =
    isApproved &&
    isSacrament &&
    normalizedService.includes('baptism') &&
    baptismRequirements;
  const isMarriageApproved =
    isApproved &&
    isSacrament &&
    normalizedService.includes('marriage') &&
    marriageRequirements;
  const isFuneralApproved =
    isApproved &&
    isSacrament &&
    (normalizedService.includes('funeral') || normalizedService.includes('burial')) &&
    funeralRequirements;

  const subject = `${parishName}: ${params.serviceType} request is now ${params.status}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
      <p>Good day ${escapeHtml(params.requesterName)},</p>
      <p>Your request for <strong>${escapeHtml(params.serviceType)}</strong> has been updated to:</p>
      <p style="font-size: 16px;"><strong>${escapeHtml(params.status)}</strong></p>
      <p><strong>Reference ID:</strong> ${escapeHtml(params.requestId)}</p>
      ${schedule ? `<p><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>` : ''}
      ${safeNotes ? `<p><strong>Notes from parish office:</strong><br/>${escapeHtml(safeNotes)}</p>` : ''}
      ${
        isConfirmationApproved
          ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
             <p><strong>Confirmation Requirements:</strong></p>
             <div style="white-space: pre-wrap;">${escapeHtml(confirmationRequirements)}</div>`
          : ''
      }
      ${
        isBaptismApproved
          ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
             <p><strong>Baptism Requirements:</strong></p>
             <div style="white-space: pre-wrap;">${escapeHtml(baptismRequirements)}</div>`
          : ''
      }
      ${
        isMarriageApproved
          ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
             <p><strong>Marriage Requirements:</strong></p>
             <div style="white-space: pre-wrap;">${escapeHtml(marriageRequirements)}</div>`
          : ''
      }
      ${
        isFuneralApproved
          ? `<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
             <p><strong>Funeral Requirements:</strong></p>
             <div style="white-space: pre-wrap;">${escapeHtml(funeralRequirements)}</div>`
          : ''
      }
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      <p style="color:#6b7280; font-size: 12px;">This is an automated message. Please contact the parish office if you have questions.</p>
    </div>
  `.trim();

  return { from, replyTo, subject, html };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
