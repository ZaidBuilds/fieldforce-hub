import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format, startOfMonth } from 'date-fns';
import { IndianRupee, AlertTriangle, CheckCircle2, MessageCircle, Link2, FileDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { buildPaymentReminderWhatsAppUrl } from '@/lib/invoiceShare';
import { uploadInvoicePdfAndGetSignedUrl } from '@/lib/invoiceShare';
import { buildUpiLink } from '@/lib/upi';

type InvRow = {
  id: string;
  invoice_number: string;
  total_amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  pdf_url: string | null;
  customers: { name: string; phone: string } | null;
};

function bucketOf(days: number) {
  if (days <= 7) return '0-7d';
  if (days <= 15) return '8-15d';
  if (days <= 30) return '16-30d';
  return '30d+';
}

const bucketColor: Record<string, string> = {
  '0-7d': 'bg-secondary text-foreground',
  '8-15d': 'bg-warning/15 text-warning border border-warning/40',
  '16-30d': 'bg-warning text-warning-foreground',
  '30d+': 'bg-destructive text-destructive-foreground',
};

export default function Collections() {
  const qc = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['collections-invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, is_paid, paid_at, created_at, pdf_url, customers(name, phone)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as InvRow[];
    },
  });

  const { data: business } = useQuery({
    queryKey: ['biz-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('business_settings').select('business_name, upi_id').limit(1).maybeSingle();
      return data;
    },
  });

  const today = new Date();
  const unpaid = invoices.filter(i => !i.is_paid);

  const stats = useMemo(() => {
    const outstanding = unpaid.reduce((s, i) => s + Number(i.total_amount), 0);
    const overdue = unpaid
      .filter(i => differenceInDays(today, new Date(i.created_at)) > 30)
      .reduce((s, i) => s + Number(i.total_amount), 0);
    const collectedThisMonth = invoices
      .filter(i => i.is_paid && i.paid_at && new Date(i.paid_at) >= startOfMonth(today))
      .reduce((s, i) => s + Number(i.total_amount), 0);
    return { outstanding, overdue, collectedThisMonth, count: unpaid.length };
  }, [invoices, unpaid, today]);

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ is_paid: true, paid_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['collections-invoices'] }); toast.success('Marked paid'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendReminder = async (inv: InvRow) => {
    if (!inv.customers?.phone) { toast.error('Customer phone missing'); return; }
    let pdfUrl = inv.pdf_url;
    if (!pdfUrl) {
      try {
        const r = await uploadInvoicePdfAndGetSignedUrl(inv.id);
        pdfUrl = r.signedUrl;
      } catch (e) {
        // non-fatal
        console.error(e);
      }
    }
    const upiLink = business?.upi_id
      ? buildUpiLink({
          vpa: business.upi_id,
          name: business.business_name,
          amount: Number(inv.total_amount),
          note: inv.invoice_number,
        })
      : null;
    const url = buildPaymentReminderWhatsAppUrl({
      phone: inv.customers.phone,
      customerName: inv.customers.name,
      invoiceNumber: inv.invoice_number,
      total: Number(inv.total_amount),
      daysOverdue: Math.max(0, differenceInDays(today, new Date(inv.created_at))),
      upiLink,
      pdfUrl,
      businessName: business?.business_name,
    });
    window.open(url, '_blank');
  };

  const copyUpi = (inv: InvRow) => {
    if (!business?.upi_id) { toast.error('Add a UPI ID in Settings first'); return; }
    const link = buildUpiLink({
      vpa: business.upi_id,
      name: business.business_name,
      amount: Number(inv.total_amount),
      note: inv.invoice_number,
    });
    navigator.clipboard.writeText(link);
    toast.success('UPI link copied');
  };

  const regeneratePdf = async (inv: InvRow) => {
    try {
      const r = await uploadInvoicePdfAndGetSignedUrl(inv.id);
      window.open(r.signedUrl, '_blank');
      qc.invalidateQueries({ queryKey: ['collections-invoices'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const sendAll = async () => {
    if (!unpaid.length) return;
    toast.success(`Opening ${unpaid.length} WhatsApp tabs…`);
    for (const inv of unpaid) {
      await sendReminder(inv);
      await new Promise(r => setTimeout(r, 600));
    }
  };

  return (
    <DashboardLayout
      title="Smart Collections"
      subtitle="Chase unpaid invoices in one click"
      action={
        <Button onClick={sendAll} disabled={!unpaid.length} className="rounded-full gradient-primary text-primary-foreground gap-2">
          <MessageCircle className="h-4 w-4" /> Remind all ({unpaid.length})
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Outstanding', value: `₹${stats.outstanding.toLocaleString('en-IN')}`, icon: IndianRupee, tone: 'bg-primary/10 text-primary' },
            { title: 'Overdue >30d', value: `₹${stats.overdue.toLocaleString('en-IN')}`, icon: AlertTriangle, tone: 'bg-destructive/10 text-destructive' },
            { title: 'Collected this month', value: `₹${stats.collectedThisMonth.toLocaleString('en-IN')}`, icon: CheckCircle2, tone: 'bg-success/10 text-success' },
            { title: 'Open invoices', value: stats.count, icon: Wallet, tone: 'bg-warning/15 text-warning' },
          ].map(s => (
            <Card key={s.title} className="border-border/70 shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</p>
                  <p className="font-heading text-2xl font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!business?.upi_id && (
          <Card className="border-warning/40 bg-warning/5 shadow-card">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span>Add your UPI ID in <a href="/app/settings" className="font-semibold underline">Settings</a> to send instant pay links.</span>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {unpaid.length === 0 ? (
            <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
              All invoices are paid. 🎉
            </CardContent></Card>
          ) : unpaid.map(inv => {
            const days = Math.max(0, differenceInDays(today, new Date(inv.created_at)));
            const bucket = bucketOf(days);
            return (
              <Card key={inv.id} className="border-border/70 shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold">{inv.invoice_number}</p>
                      <Badge className={bucketColor[bucket]}>{bucket}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {inv.customers?.name ?? 'Customer'} · {format(new Date(inv.created_at), 'dd MMM yyyy')} · {days}d old
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="mr-2 font-heading text-lg font-bold">₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => sendReminder(inv)}>
                      <MessageCircle className="h-3.5 w-3.5" /> Remind
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" title="Copy UPI link" onClick={() => copyUpi(inv)}>
                      <Link2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8" title="Regenerate PDF" onClick={() => regeneratePdf(inv)}>
                      <FileDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" className="gradient-primary text-primary-foreground" onClick={() => markPaid.mutate(inv.id)}>
                      Mark paid
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}