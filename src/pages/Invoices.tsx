import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  FileText, Download, Eye, CheckCircle2, Search, MessageCircle, IndianRupee,
  Copy, Clock, TrendingUp, Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadInvoicePdf, openInvoicePdf } from '@/lib/invoicePdf';
import { loadInvoicePdfData } from '@/lib/invoiceData';
import { Skeleton } from '@/components/ui/skeleton';

type InvoiceRow = {
  id: string;
  invoice_number: string;
  total_amount: number;
  gst_amount: number;
  gst_rate: number;
  subtotal: number;
  is_paid: boolean;
  created_at: string;
  job_id: string;
  razorpay_payment_id: string | null;
  razorpay_payment_link_url: string | null;
  payment_link_status: string;
  customers?: { name: string; phone: string } | null;
};

export default function Invoices() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [payDialog, setPayDialog] = useState<InvoiceRow | null>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, gst_amount, gst_rate, subtotal, is_paid, created_at, job_id, razorpay_payment_id, razorpay_payment_link_url, payment_link_status, customers(name, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as InvoiceRow[];
    },
  });

  const markPaid = useMutation({
    mutationFn: async ({ id, ref }: { id: string; ref: string }) => {
      const { error } = await supabase
        .from('invoices')
        .update({
          is_paid: true,
          paid_at: new Date().toISOString(),
          razorpay_payment_id: ref || null,
          payment_link_status: 'paid',
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Invoice marked as paid');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setPayDialog(null);
      setPaymentRef('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePdf = async (inv: InvoiceRow, mode: 'download' | 'view') => {
    setBusyId(inv.id);
    try {
      const data = await loadInvoicePdfData(inv.id);
      if (mode === 'download') await downloadInvoicePdf(data);
      else await openInvoicePdf(data);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = (inv: InvoiceRow) => {
    if (!inv.razorpay_payment_link_url) {
      toast.info('No payment link yet — share the PDF instead.');
      return;
    }
    navigator.clipboard.writeText(inv.razorpay_payment_link_url);
    toast.success('Payment link copied');
  };

  const handleWhatsApp = (inv: InvoiceRow) => {
    const phone = inv.customers?.phone?.replace(/\D/g, '') ?? '';
    if (!phone) return toast.error('No customer phone');
    const msg = encodeURIComponent(
      `Hi ${inv.customers?.name ?? 'customer'},\n\nYour invoice ${inv.invoice_number} of ₹${inv.total_amount.toLocaleString('en-IN')} is ready.\n${inv.is_paid ? 'Payment received — thank you!' : 'Please pay at your earliest convenience.'}\n\nThank you for choosing us!`,
    );
    window.open(`https://wa.me/91${phone.slice(-10)}?text=${msg}`, '_blank');
  };

  const filtered = invoices.filter(inv => {
    if (filter === 'paid' && !inv.is_paid) return false;
    if (filter === 'unpaid' && inv.is_paid) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(s) ||
        inv.customers?.name?.toLowerCase().includes(s) ||
        inv.customers?.phone?.includes(s)
      );
    }
    return true;
  });

  const totalCollected = invoices.filter(i => i.is_paid).reduce((s, i) => s + Number(i.total_amount), 0);
  const totalPending = invoices.filter(i => !i.is_paid).reduce((s, i) => s + Number(i.total_amount), 0);
  const monthCollected = invoices
    .filter(i => i.is_paid && new Date(i.created_at).getMonth() === new Date().getMonth() && new Date(i.created_at).getFullYear() === new Date().getFullYear())
    .reduce((s, i) => s + Number(i.total_amount), 0);

  // Group filtered invoices by month label
  const grouped = filtered.reduce<Record<string, InvoiceRow[]>>((acc, inv) => {
    const key = format(new Date(inv.created_at), 'MMMM yyyy');
    (acc[key] ??= []).push(inv);
    return acc;
  }, {});

  const ageDays = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

  return (
    <DashboardLayout title="Invoices" subtitle="GST-ready branded invoices · one-click PDFs">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="This month"
            value={`₹${monthCollected.toLocaleString('en-IN')}`}
            sub={format(new Date(), 'MMMM yyyy')}
            tone="primary"
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatTile
            label="Collected (all time)"
            value={`₹${totalCollected.toLocaleString('en-IN')}`}
            sub={`${invoices.filter(i => i.is_paid).length} paid`}
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatTile
            label="Pending"
            value={`₹${totalPending.toLocaleString('en-IN')}`}
            sub={`${invoices.filter(i => !i.is_paid).length} unpaid`}
            tone="warning"
            icon={<Clock className="h-4 w-4" />}
          />
          <StatTile
            label="Total invoices"
            value={String(invoices.length)}
            sub="All time"
            tone="accent"
            icon={<Receipt className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by invoice no, customer name or phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 rounded-full bg-secondary p-1">
            {(['all', 'unpaid', 'paid'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                  filter === f ? 'bg-background shadow-card text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <Card key={i} className="shadow-card">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>{invoices.length === 0 ? 'No invoices yet. Generate one from a completed job.' : 'No invoices match your filters.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([month, list]) => {
              const monthTotal = list.reduce((s, i) => s + Number(i.total_amount), 0);
              return (
                <section key={month} className="space-y-2">
                  <div className="flex items-baseline justify-between px-1">
                    <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      {month}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {list.length} invoice{list.length === 1 ? '' : 's'} · ₹{monthTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {list.map(inv => {
                      const age = ageDays(inv.created_at);
                      const overdue = !inv.is_paid && age > 7;
                      return (
                        <Card
                          key={inv.id}
                          className={`group shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 animate-fade-in ${
                            overdue ? 'border-destructive/40' : ''
                          }`}
                        >
                          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                                  inv.is_paid
                                    ? 'bg-success/10 text-success'
                                    : overdue
                                    ? 'bg-destructive/10 text-destructive'
                                    : 'bg-warning/10 text-warning'
                                }`}
                              >
                                {inv.is_paid ? '✓' : overdue ? '!' : '·'}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-heading font-bold truncate">{inv.invoice_number}</p>
                                  <Badge
                                    variant={inv.is_paid ? 'default' : 'outline'}
                                    className={
                                      inv.is_paid
                                        ? 'bg-success text-success-foreground'
                                        : overdue
                                        ? 'border-destructive text-destructive'
                                        : 'border-warning text-warning'
                                    }
                                  >
                                    {inv.is_paid ? 'Paid' : overdue ? `Overdue · ${age}d` : 'Unpaid'}
                                  </Badge>
                                  {inv.razorpay_payment_id && (
                                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                                      {inv.razorpay_payment_id.slice(0, 14)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                  {inv.customers?.name ?? 'Unknown'} · {format(new Date(inv.created_at), 'dd MMM yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-heading text-xl font-extrabold">₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                                <p className="text-[11px] text-muted-foreground">GST ₹{Number(inv.gst_amount).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <ActionBtn label="View PDF" onClick={() => handlePdf(inv, 'view')} loading={busyId === inv.id}>
                                  <Eye className="h-3.5 w-3.5" />
                                </ActionBtn>
                                <ActionBtn label="Download" onClick={() => handlePdf(inv, 'download')} loading={busyId === inv.id}>
                                  <Download className="h-3.5 w-3.5" />
                                </ActionBtn>
                                <ActionBtn label="Send on WhatsApp" tone="success" onClick={() => handleWhatsApp(inv)}>
                                  <MessageCircle className="h-3.5 w-3.5" />
                                </ActionBtn>
                                <ActionBtn label="Copy payment link" onClick={() => handleCopy(inv)}>
                                  <Copy className="h-3.5 w-3.5" />
                                </ActionBtn>
                                {!inv.is_paid && (
                                  <Button
                                    size="sm"
                                    onClick={() => setPayDialog(inv)}
                                    className="h-8 gap-1 bg-success px-3 text-success-foreground hover:bg-success/90"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark paid
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Mark paid dialog */}
      <Dialog open={!!payDialog} onOpenChange={(o) => { if (!o) { setPayDialog(null); setPaymentRef(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading">
              <IndianRupee className="h-4 w-4 text-success" /> Mark invoice as paid
            </DialogTitle>
            <DialogDescription>
              {payDialog && `Confirm payment for ${payDialog.invoice_number} (₹${Number(payDialog.total_amount).toLocaleString('en-IN')}).`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Razorpay payment ID / UPI reference (optional)</Label>
            <Input
              value={paymentRef}
              onChange={e => setPaymentRef(e.target.value)}
              placeholder="pay_NaB2c... or UTR / txn id"
            />
            <p className="text-[11px] text-muted-foreground">
              Stored on the invoice for your records. Live Razorpay sync can be enabled later.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayDialog(null); setPaymentRef(''); }}>Cancel</Button>
            <Button
              onClick={() => payDialog && markPaid.mutate({ id: payDialog.id, ref: paymentRef.trim() })}
              disabled={markPaid.isPending}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {markPaid.isPending ? 'Saving…' : 'Confirm payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function StatTile({
  label, value, sub, tone, icon,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'primary' | 'success' | 'warning' | 'accent';
  icon: React.ReactNode;
}) {
  const toneMap: Record<typeof tone, string> = {
    primary: 'border-primary/30 from-primary/10 text-primary',
    success: 'border-success/30 from-success/10 text-success',
    warning: 'border-warning/30 from-warning/10 text-warning',
    accent: 'border-accent/30 from-accent/10 text-accent',
  };
  return (
    <Card className={`relative overflow-hidden border bg-gradient-to-br to-transparent shadow-card ${toneMap[tone]}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg bg-background/60 ${toneMap[tone].split(' ').pop()}`}>
            {icon}
          </span>
        </div>
        <p className="mt-2 font-heading text-2xl font-extrabold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function ActionBtn({
  children, label, onClick, loading, tone,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  loading?: boolean;
  tone?: 'success';
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={loading}
      title={label}
      aria-label={label}
      className={`h-8 px-2 ${tone === 'success' ? 'text-success hover:text-success' : ''}`}
    >
      {loading ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : children}
    </Button>
  );
}
