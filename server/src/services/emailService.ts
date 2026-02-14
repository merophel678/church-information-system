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

  const statusText = params.status.toUpperCase();
  const statusTheme = getStatusTheme(statusText);
  const updatedAt = formatEmailTimestamp(new Date());

  const requirementCards: Array<{ title: string; body: string }> = [];
  if (isConfirmationApproved && confirmationRequirements) {
    requirementCards.push({ title: 'Confirmation Requirements', body: confirmationRequirements });
  }
  if (isBaptismApproved && baptismRequirements) {
    requirementCards.push({ title: 'Baptism Requirements', body: baptismRequirements });
  }
  if (isMarriageApproved && marriageRequirements) {
    requirementCards.push({ title: 'Marriage Requirements', body: marriageRequirements });
  }
  if (isFuneralApproved && funeralRequirements) {
    requirementCards.push({ title: 'Funeral Requirements', body: funeralRequirements });
  }

  const requirementSections = requirementCards
    .map(
      (entry) => `
        <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-top:14px;background:#ffffff;">
          <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">${escapeHtml(entry.title)}</div>
          <div style="font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-wrap;">${escapeHtml(entry.body)}</div>
        </div>
      `.trim()
    )
    .join('');

  const nextSteps = getNextSteps({
    status: statusText,
    hasSchedule: Boolean(schedule),
    hasNotes: Boolean(safeNotes)
  })
    .map((line) => `<li style="margin:0 0 6px 0;">${escapeHtml(line)}</li>`)
    .join('');

  const subject = `${parishName}: ${params.serviceType} request is now ${statusText}`;
  const html = `
    <div style="margin:0;padding:24px 12px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        <div style="padding:16px 20px;background:#0f172a;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85;">Service Request Update</div>
          <div style="font-size:20px;font-weight:700;line-height:1.3;margin-top:4px;">${escapeHtml(parishName)}</div>
        </div>

        <div style="padding:20px;">
          <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;">Good day ${escapeHtml(params.requesterName)},</p>
          <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;">
            Your request for <strong>${escapeHtml(params.serviceType)}</strong> has been updated.
          </p>

          <div style="display:inline-block;padding:7px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:${statusTheme.bg};color:${statusTheme.text};border:1px solid ${statusTheme.border};">
            ${escapeHtml(statusText)}
          </div>

          <div style="margin-top:16px;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;background:#fafafa;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;line-height:1.6;color:#1f2937;">
              <tr>
                <td style="width:150px;font-weight:700;padding:0 0 6px 0;">Reference ID</td>
                <td style="padding:0 0 6px 0;font-family:Consolas,Monaco,'Courier New',monospace;">${escapeHtml(params.requestId)}</td>
              </tr>
              <tr>
                <td style="font-weight:700;padding:0 0 6px 0;">Service Type</td>
                <td style="padding:0 0 6px 0;">${escapeHtml(params.serviceType)}</td>
              </tr>
              <tr>
                <td style="font-weight:700;padding:0;">Updated</td>
                <td style="padding:0;">${escapeHtml(updatedAt)}</td>
              </tr>
              ${
                schedule
                  ? `
              <tr>
                <td style="font-weight:700;padding:6px 0 0 0;">Schedule</td>
                <td style="padding:6px 0 0 0;">${escapeHtml(schedule)}</td>
              </tr>
              `
                  : ''
              }
            </table>
          </div>

          ${
            safeNotes
              ? `
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-top:14px;background:#ffffff;">
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">Parish Office Note</div>
            <div style="font-size:14px;line-height:1.6;color:#1f2937;white-space:pre-wrap;">${escapeHtml(safeNotes)}</div>
          </div>
          `
              : ''
          }

          ${requirementSections}

          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-top:14px;background:#ffffff;">
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:8px;">Next Steps</div>
            <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.6;color:#1f2937;">
              ${nextSteps}
            </ul>
          </div>

          <div style="margin-top:18px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.6;color:#6b7280;">
            This is an automated message from ${escapeHtml(parishName)}. Please contact the parish office for clarifications.
          </div>
        </div>
      </div>
    </div>
  `.trim();

  return { from, replyTo, subject, html };
}

function formatEmailTimestamp(date: Date) {
  try {
    return new Intl.DateTimeFormat('en-PH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function getStatusTheme(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === 'APPROVED') {
    return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
  }
  if (normalized === 'SCHEDULED') {
    return { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' };
  }
  if (normalized === 'COMPLETED') {
    return { bg: '#e0e7ff', text: '#4338ca', border: '#a5b4fc' };
  }
  if (normalized === 'REJECTED') {
    return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
  }
  return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
}

function getNextSteps(input: { status: string; hasSchedule: boolean; hasNotes: boolean }) {
  const status = input.status.toUpperCase();
  if (status === 'APPROVED') {
    return [
      'Prepare the listed requirements and keep your reference ID for follow-ups.',
      input.hasSchedule
        ? 'Please arrive on your confirmed schedule and bring a valid ID.'
        : 'Wait for schedule confirmation if no schedule is shown yet.'
    ];
  }
  if (status === 'SCHEDULED') {
    return [
      'Arrive at least 15 minutes before your confirmed schedule.',
      'Bring your reference ID and all required documents.'
    ];
  }
  if (status === 'REJECTED') {
    return [
      input.hasNotes
        ? 'Review the parish office note above, correct the issue, and submit a new request when ready.'
        : 'Contact the parish office for the reason and requirements before re-submitting.',
      'Keep this email for your records.'
    ];
  }
  if (status === 'COMPLETED') {
    return [
      'Your request has been completed. Keep your reference ID for future reissue requests.',
      'Contact the parish office if you need another certified copy.'
    ];
  }
  return ['Monitor your request status through the parish system and keep your reference ID for support.'];
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
