import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePdf } from './invoicePdf';
import { loadInvoicePdfData } from './invoiceData';

const BUCKET = 'invoice-pdfs';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Generate the invoice PDF, upload it to private storage,
 * and return a signed URL valid for 7 days.
 */
export async function uploadInvoicePdfAndGetSignedUrl(invoiceId: string): Promise<{
  signedUrl: string;
  path: string;
  invoiceNumber: string;
}> {
  const data = await loadInvoicePdfData(invoiceId);
  const doc = await generateInvoicePdf(data);
  const blob = doc.output('blob');

  const path = `${invoiceId}/${data.invoiceNumber}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      contentType: 'application/pdf',
      upsert: true,
      cacheControl: '3600',
    });
  if (uploadError) throw uploadError;

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signErr) throw signErr;
  if (!signed?.signedUrl) throw new Error('Could not create signed URL');

  // Store the signed URL on the invoice row for quick access
  await supabase
    .from('invoices')
    .update({ pdf_url: signed.signedUrl })
    .eq('id', invoiceId);

  return { signedUrl: signed.signedUrl, path, invoiceNumber: data.invoiceNumber };
}

/**
 * Build a WhatsApp share URL for a customer + invoice.
 */
export function buildInvoiceWhatsAppUrl(opts: {
  phone: string;
  customerName?: string | null;
  invoiceNumber: string;
  total: number;
  isPaid: boolean;
  pdfUrl?: string | null;
  businessName?: string | null;
}) {
  const cleaned = opts.phone.replace(/\D/g, '').slice(-10);
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,';
  const amount = `₹${opts.total.toLocaleString('en-IN')}`;
  const status = opts.isPaid
    ? '✅ Payment received — thank you!'
    : 'Please pay at your earliest convenience.';
  const link = opts.pdfUrl ? `\n\nInvoice PDF: ${opts.pdfUrl}` : '';
  const sig = opts.businessName ? `\n\n— ${opts.businessName}` : '';
  const msg = `${greeting}\n\nYour invoice ${opts.invoiceNumber} of ${amount} is ready.\n${status}${link}${sig}`;
  return `https://wa.me/91${cleaned}?text=${encodeURIComponent(msg)}`;
}

/**
 * Build a WhatsApp share URL for a job tracking link.
 */
export function buildTrackingWhatsAppUrl(opts: {
  phone: string;
  customerName?: string | null;
  jobTitle: string;
  trackingUrl: string;
  technicianName?: string | null;
  businessName?: string | null;
}) {
  const cleaned = opts.phone.replace(/\D/g, '').slice(-10);
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,';
  const tech = opts.technicianName ? `\nTechnician: ${opts.technicianName}` : '';
  const sig = opts.businessName ? `\n\n— ${opts.businessName}` : '';
  const msg = `${greeting}\n\nYour service request "${opts.jobTitle}" is on the way.${tech}\n\nTrack live status: ${opts.trackingUrl}${sig}`;
  return `https://wa.me/91${cleaned}?text=${encodeURIComponent(msg)}`;
}

/**
 * Build a WhatsApp share URL asking for feedback after a completed job.
 */
export function buildFeedbackWhatsAppUrl(opts: {
  phone: string;
  customerName?: string | null;
  jobTitle: string;
  feedbackUrl: string;
  businessName?: string | null;
}) {
  const cleaned = opts.phone.replace(/\D/g, '').slice(-10);
  const greeting = opts.customerName ? `Hi ${opts.customerName},` : 'Hi,';
  const sig = opts.businessName ? `\n\n— ${opts.businessName}` : '';
  const msg = `${greeting}\n\nThanks for choosing us for "${opts.jobTitle}". How was your experience? It takes just 30 seconds:\n\n${opts.feedbackUrl}${sig}`;
  return `https://wa.me/91${cleaned}?text=${encodeURIComponent(msg)}`;
}