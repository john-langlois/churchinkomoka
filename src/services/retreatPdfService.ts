import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import {
  computeRetreatPricing,
  formatRetreatDate,
  type RetreatConfirmationRetreat,
} from '@/src/services/emailService';
import type { RetreatRegistration, RetreatRegistrant } from '@/src/lib/db/schema/retreat';

/** Short, human-friendly reference to quote when paying (e.g. in an e-Transfer message). */
export function getPaymentReference(registrationId: string): string {
  return `RET-${registrationId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function getRegistrationPageUrl(registrationId: string): string | null {
  const base = process.env.NEXT_PUBLIC_APP_URL;
  return typeof base === 'string' && base
    ? `${base.replace(/\/$/, '')}/retreat/registration/${registrationId}`
    : null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending – awaiting payment',
  confirmed: 'Confirmed – payment received',
  cancelled: 'Cancelled',
  waitlisted: 'Waitlisted',
};

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

const PAGE_WIDTH = 612; // US Letter
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const DARK = rgb(0.11, 0.1, 0.09);
const MUTED = rgb(0.47, 0.44, 0.42);
const RULE = rgb(0.9, 0.89, 0.89);

/**
 * Generate a confirmation PDF for a retreat registration.
 */
export async function generateRetreatConfirmationPdf(
  retreat: RetreatConfirmationRetreat & { paymentInstructions?: string | null },
  registration: RetreatRegistration,
  registrants: RetreatRegistrant[]
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Retreat registration – ${registration.contactName}`);
  pdf.setAuthor('Church in Komoka');

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  let page: PDFPage = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const text = (
    value: string,
    opts: { font?: PDFFont; size?: number; color?: ReturnType<typeof rgb>; x?: number; maxWidth?: number } = {}
  ) => {
    const font = opts.font ?? regular;
    const size = opts.size ?? 10.5;
    const x = opts.x ?? MARGIN;
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH - (x - MARGIN);
    const lineHeight = size * 1.4;
    for (const line of wrap(toWinAnsi(value, font), font, size, maxWidth)) {
      ensureSpace(lineHeight);
      page.drawText(line, { x, y: y - size, size, font, color: opts.color ?? DARK });
      y -= lineHeight;
    }
  };

  const heading = (value: string) => {
    y -= 8;
    ensureSpace(30);
    page.drawText(value.toUpperCase(), { x: MARGIN, y: y - 9, size: 9, font: bold, color: MUTED });
    y -= 14;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.75, color: RULE });
    y -= 8;
  };

  const field = (label: string, value: string | null | undefined) => {
    if (!value) return;
    const labelWidth = 120;
    const startY = y;
    ensureSpace(15);
    page.drawText(toWinAnsi(label, bold), { x: MARGIN, y: y - 10.5, size: 10.5, font: bold, color: MUTED });
    y = startY;
    text(value, { x: MARGIN + labelWidth });
  };

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 90, width: PAGE_WIDTH, height: 90, color: DARK });
  page.drawText('Church in Komoka', { x: MARGIN, y: PAGE_HEIGHT - 50, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText('Retreat Registration Confirmation', {
    x: MARGIN,
    y: PAGE_HEIGHT - 72,
    size: 11,
    font: regular,
    color: rgb(0.85, 0.84, 0.82),
  });
  y = PAGE_HEIGHT - 120;

  text(retreat.name, { font: bold, size: 18 });
  y -= 4;

  heading('Registration');
  field('Registration ID', registration.id);
  field('Payment reference', getPaymentReference(registration.id));
  field('Status', getStatusLabel(registration.status));
  field('Submitted', formatRetreatDate(registration.createdAt));
  field('Issued', formatRetreatDate(new Date()));

  const { lines, total } = computeRetreatPricing(retreat, registrants);
  const hasPricing = total !== null;

  if (registration.status !== 'cancelled') {
    y -= 6;
    ensureSpace(110); // keep the payment block together
    heading('How to pay');
    if (registration.status === 'confirmed') {
      text('Payment received. Thank you!');
    } else {
      if (hasPricing && total > 0) text(`Amount due: $${total}`, { font: bold });
      text(retreat.paymentInstructions || 'Payment details will be shared with you by the church. Questions? info@churchinkomoka.com');
      text(`Please include your payment reference: ${getPaymentReference(registration.id)}`, { font: bold });
    }
  }


  heading('Retreat');
  field(
    'Dates',
    `${formatRetreatDate(retreat.startDate)}${retreat.endDate ? ` – ${formatRetreatDate(retreat.endDate)}` : ''}`
  );
  field('Location', retreat.location);

  heading('Contact');
  field('Name', registration.contactName);
  field('Email', registration.contactEmail);
  field('Phone', registration.contactPhone);
  field('Church', registration.churchName);
  field(
    'Pastor',
    registration.pastorName
      ? `${registration.pastorName}${registration.pastorContact ? ` (${registration.pastorContact})` : ''}`
      : null
  );
  field('From', [registration.city, registration.country].filter(Boolean).join(', ') || null);
  field('Arrival', registration.arrivalDate ? formatRetreatDate(registration.arrivalDate) : null);
  field('Departure', registration.departureDate ? formatRetreatDate(registration.departureDate) : null);

  // Attendees table
  heading(`Attendees (${registrants.length})`);
  const cols = { name: MARGIN, age: MARGIN + 250, tier: MARGIN + 300, price: PAGE_WIDTH - MARGIN };
  ensureSpace(16);
  page.drawText('Name', { x: cols.name, y: y - 9, size: 9, font: bold, color: MUTED });
  page.drawText('Age', { x: cols.age, y: y - 9, size: 9, font: bold, color: MUTED });
  page.drawText('Category', { x: cols.tier, y: y - 9, size: 9, font: bold, color: MUTED });
  const priceHeader = 'Price';
  page.drawText(priceHeader, {
    x: cols.price - bold.widthOfTextAtSize(priceHeader, 9),
    y: y - 9,
    size: 9,
    font: bold,
    color: MUTED,
  });
  y -= 16;

  registrants.forEach((r, i) => {
    const line = lines[i];
    ensureSpace(16);
    const rowY = y;
    page.drawText(truncate(toWinAnsi(line.name, bold), bold, 10.5, 240), { x: cols.name, y: rowY - 10.5, size: 10.5, font: bold, color: DARK });
    page.drawText(r.age != null ? String(r.age) : '–', { x: cols.age, y: rowY - 10.5, size: 10.5, font: regular, color: DARK });
    page.drawText(truncate(toWinAnsi(line.tierName, regular), regular, 10.5, 150), { x: cols.tier, y: rowY - 10.5, size: 10.5, font: regular, color: DARK });
    const price = hasPricing ? (line.price === 0 ? 'Free' : `$${line.price}`) : '–';
    page.drawText(price, {
      x: cols.price - regular.widthOfTextAtSize(price, 10.5),
      y: rowY - 10.5,
      size: 10.5,
      font: regular,
      color: DARK,
    });
    y -= 15;
    if (r.dietaryRestrictions) text(`Dietary: ${r.dietaryRestrictions}`, { x: cols.name + 10, size: 9, color: MUTED });
    if (r.medicalNotes) text(`Medical: ${r.medicalNotes}`, { x: cols.name + 10, size: 9, color: MUTED });
    y -= 3;
  });

  if (hasPricing) {
    ensureSpace(24);
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 0.75, color: RULE });
    y -= 6;
    const totalText = `$${total}`;
    page.drawText('Total', { x: cols.name, y: y - 12, size: 12, font: bold, color: DARK });
    page.drawText(totalText, {
      x: cols.price - bold.widthOfTextAtSize(totalText, 12),
      y: y - 12,
      size: 12,
      font: bold,
      color: DARK,
    });
    y -= 20;
  }

  if (registration.notes) {
    heading('Notes');
    text(registration.notes);
  }

  const pageUrl = getRegistrationPageUrl(registration.id);
  if (pageUrl) {
    y -= 12;
    text('View or update your registration online:', { size: 9, color: MUTED });
    text(pageUrl, { font: mono, size: 8.5, color: MUTED });
  }

  return pdf.save();
}

/** Standard PDF fonts only cover WinAnsi; map anything else to a close ASCII form or '?'. */
function toWinAnsi(value: string, font: PDFFont): string {
  let out = '';
  for (const ch of value.normalize('NFC').replace(/\r/g, '')) {
    if (ch === '\n' || ch === '\t') {
      out += ch === '\t' ? ' ' : ch;
      continue;
    }
    if (canEncode(font, ch)) {
      out += ch;
      continue;
    }
    const stripped = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += stripped && canEncode(font, stripped) ? stripped : '?';
  }
  return out;
}

function canEncode(font: PDFFont, ch: string): boolean {
  try {
    font.encodeText(ch);
    return true;
  } catch {
    return false;
  }
}

function wrap(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of value.split('\n')) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      result.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) result.push(line);
        // Break words that are longer than a whole line (e.g. URLs)
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > maxWidth) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > maxWidth) cut--;
          result.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

function truncate(value: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;
  let cut = value.length;
  while (cut > 0 && font.widthOfTextAtSize(`${value.slice(0, cut)}…`, size) > maxWidth) cut--;
  return `${value.slice(0, cut)}…`;
}
