import { supabase } from '@/integrations/supabase/client';
import type { InvoicePdfData } from './invoicePdf';

const DEFAULT_OWNER = '00000000-0000-0000-0000-000000000000';

export async function loadInvoicePdfData(invoiceId: string): Promise<InvoicePdfData> {
  const { data: inv, error } = await supabase
    .from('invoices')
    .select('*, customers(name, phone, address, city, gst_number)')
    .eq('id', invoiceId)
    .maybeSingle();
  if (error) throw error;
  if (!inv) throw new Error('Invoice not found');

  const [{ data: job }, { data: parts }, { data: business }] = await Promise.all([
    supabase
      .from('jobs')
      .select('title, service_type, payment_amount, notes')
      .eq('id', inv.job_id)
      .maybeSingle(),
    supabase.from('job_parts').select('name, quantity, unit_price, total').eq('job_id', inv.job_id),
    supabase.from('business_settings').select('*').eq('owner_id', DEFAULT_OWNER).maybeSingle(),
  ]);

  const customer = (inv as { customers?: InvoicePdfData['customer'] }).customers ?? {};
  const serviceCharge = Number(job?.payment_amount ?? 0);

  return {
    invoiceNumber: inv.invoice_number,
    createdAt: inv.created_at,
    jobTitle: job?.title ?? null,
    serviceType: job?.service_type ?? null,
    business: business ?? {},
    customer,
    serviceCharge,
    parts: (parts ?? []).map(p => ({
      name: p.name,
      quantity: Number(p.quantity),
      unit_price: Number(p.unit_price),
      total: Number(p.total),
    })),
    subtotal: Number(inv.subtotal),
    gstRate: Number(inv.gst_rate),
    gstAmount: Number(inv.gst_amount),
    total: Number(inv.total_amount),
    isPaid: inv.is_paid,
    paymentLinkUrl: inv.razorpay_payment_link_url,
    notes: job?.notes ?? null,
  };
}