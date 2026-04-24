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
import { FileText, Download, Eye, CheckCircle2, Search, MessageCircle, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { downloadInvoicePdf, openInvoicePdf } from '@/lib/invoicePdf';
import { loadInvoicePdfData } from '@/lib/invoiceData';

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

  const { data: invoices = [] } = useQuery({
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
    try {
      const data = await loadInvoicePdfData(inv.id);
      if (mode === 'download') downloadInvoicePdf(data);
      else openInvoicePdf(data);
    } catch (e) {
      toast.error((e as Error).message);
    }
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

  return (
    <DashboardLayout title="Invoices" subtitle="GST-ready branded invoices · one-click PDFs">
      <div className="space-y-5">
        {/* Stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-success/30 bg-gradient-to-br from-success/5 to-transparent shadow-card">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Collected</p>
              <p className="font-heading text-2xl font-extrabold text-success">₹{totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => i.is_paid).length} paid invoices</p>
            </CardContent>
          </Card>
          <Card className="border-warning/30 bg-gradient-to-br from-warning/5 to-transparent shadow-card">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
              <p className="font-heading text-2xl font-extrabold text-warning">₹{totalPending.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">{invoices.filter(i => !i.is_paid).length} unpaid invoices</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-card">
            <CardContent className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total invoices</p>
              <p className="font-heading text-2xl font-extrabold text-primary">{invoices.length}</p>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
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
        {filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p>{invoices.length === 0 ? 'No invoices yet. Generate one from a completed job.' : 'No invoices match your filters.'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(inv => (
              <Card key={inv.id} className="shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading font-bold">{inv.invoice_number}</p>
                      <Badge
                        variant={inv.is_paid ? 'default' : 'outline'}
                        className={inv.is_paid ? 'bg-success text-success-foreground' : 'border-warning text-warning'}
                      >
                        {inv.is_paid ? 'Paid' : 'Unpaid'}
                      </Badge>
                      {inv.razorpay_payment_id && (
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
                          ref: {inv.razorpay_payment_id}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {inv.customers?.name ?? 'Unknown'} · {format(new Date(inv.created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-heading text-xl font-extrabold">₹{Number(inv.total_amount).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-muted-foreground">incl. GST ₹{Number(inv.gst_amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => handlePdf(inv, 'view')} className="h-8 px-2">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePdf(inv, 'download')} className="h-8 px-2">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleWhatsApp(inv)} className="h-8 px-2 text-success hover:text-success">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
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
            ))}
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
