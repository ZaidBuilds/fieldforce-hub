import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import JobStatusBadge from '@/components/JobStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft, MapPin, Calendar, Phone, Play, CheckCircle2, IndianRupee,
  MessageCircle, FileText, User, Clock, Navigation, Plus, Trash2, Share2, Star, Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { Enums } from '@/integrations/supabase/types';
import { downloadInvoicePdf } from '@/lib/invoicePdf';
import { loadInvoicePdfData } from '@/lib/invoiceData';
import {
  uploadInvoicePdfAndGetSignedUrl,
  buildTrackingWhatsAppUrl,
  buildFeedbackWhatsAppUrl,
  buildInvoiceWhatsAppUrl,
} from '@/lib/invoiceShare';

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [partName, setPartName] = useState('');
  const [partPrice, setPartPrice] = useState('');
  const [partQty, setPartQty] = useState('1');
  const [sharingInvoice, setSharingInvoice] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*, customers(name, phone, address, city, gst_number)').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: parts = [] } = useQuery({
    queryKey: ['job_parts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('job_parts').select('*').eq('job_id', id!).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const updateJob = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const { error } = await supabase.from('jobs').update(patch as never).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addPart = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(partQty) || 1;
      const price = parseFloat(partPrice) || 0;
      const { error } = await supabase.from('job_parts').insert({
        job_id: id!, name: partName, quantity: qty, unit_price: price, total: qty * price,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPartName(''); setPartPrice(''); setPartQty('1');
      queryClient.invalidateQueries({ queryKey: ['job_parts', id] });
      toast.success('Part added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removePart = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase.from('job_parts').delete().eq('id', partId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job_parts', id] }),
  });

  const generateInvoice = useMutation({
    mutationFn: async () => {
      if (!job) throw new Error('Job not loaded');
      const subtotal = (job.payment_amount ?? 0) + parts.reduce((s, p) => s + Number(p.total), 0);
      const gstRate = 18;
      const gstAmount = +(subtotal * (gstRate / 100)).toFixed(2);
      const total = +(subtotal + gstAmount).toFixed(2);
      const invNum = `INV-${format(new Date(), 'yyMMdd')}-${Math.floor(Math.random() * 9000 + 1000)}`;
      const { data: inserted, error } = await supabase.from('invoices').insert({
        job_id: job.id,
        customer_id: job.customer_id,
        invoice_number: invNum,
        subtotal,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: total,
        is_paid: job.payment_status === 'collected',
      }).select('id').single();
      if (error) throw error;
      return { invNum, id: inserted.id };
    },
    onSuccess: async ({ invNum, id: invoiceId }) => {
      toast.success(`Invoice ${invNum} generated — downloading PDF…`);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      try {
        const data = await loadInvoicePdfData(invoiceId);
        downloadInvoicePdf(data);
      } catch (e) {
        toast.error(`PDF generation failed: ${(e as Error).message}`);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return <DashboardLayout><div className="py-20 text-center text-muted-foreground">Loading…</div></DashboardLayout>;
  }
  if (!job) {
    return <DashboardLayout title="Job not found"><Button onClick={() => navigate('/app/jobs')} variant="outline">Back to jobs</Button></DashboardLayout>;
  }

  const customer = (job as any).customers;
  const partsTotal = parts.reduce((s, p) => s + Number(p.total), 0);
  const subtotal = (job.payment_amount ?? 0) + partsTotal;
  const gst = +(subtotal * 0.18).toFixed(2);
  const grand = +(subtotal + gst).toFixed(2);

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      updateJob.mutate({ status: 'in_progress', checkin_at: new Date().toISOString() });
      toast.success('Checked in (no GPS)');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        updateJob.mutate({
          status: 'in_progress',
          checkin_at: new Date().toISOString(),
          checkin_latitude: pos.coords.latitude,
          checkin_longitude: pos.coords.longitude,
        });
        toast.success('Checked in with GPS');
      },
      () => {
        updateJob.mutate({ status: 'in_progress', checkin_at: new Date().toISOString() });
        toast.success('Checked in (GPS denied)');
      },
    );
  };

  const handleCheckOut = () => {
    updateJob.mutate({ status: 'completed', checkout_at: new Date().toISOString() });
    toast.success('Job completed');
  };

  const trackingUrl = job.tracking_token
    ? `${window.location.origin}/track/${job.tracking_token}`
    : null;
  const feedbackUrl = job.feedback_token
    ? `${window.location.origin}/feedback/${job.feedback_token}`
    : null;

  const handleShareTracking = () => {
    if (!customer?.phone) return toast.error('No customer phone on file');
    if (!trackingUrl) return toast.error('No tracking link available');
    const url = buildTrackingWhatsAppUrl({
      phone: customer.phone,
      customerName: customer.name,
      jobTitle: job.title,
      trackingUrl,
    });
    window.open(url, '_blank');
    updateJob.mutate({ whatsapp_sent_at: new Date().toISOString() });
  };

  const handleShareFeedback = () => {
    if (!customer?.phone) return toast.error('No customer phone on file');
    if (!feedbackUrl) return toast.error('No feedback link available');
    const url = buildFeedbackWhatsAppUrl({
      phone: customer.phone,
      customerName: customer.name,
      jobTitle: job.title,
      feedbackUrl,
    });
    window.open(url, '_blank');
  };

  const handleCopyTracking = () => {
    if (!trackingUrl) return;
    navigator.clipboard.writeText(trackingUrl);
    toast.success('Tracking link copied');
  };

  const handleShareInvoice = async () => {
    if (!customer?.phone) return toast.error('No customer phone on file');
    setSharingInvoice(true);
    try {
      // Find the most recent invoice for this job
      const { data: inv, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, is_paid, pdf_url')
        .eq('job_id', job.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!inv) {
        toast.error('Generate the GST invoice first');
        return;
      }
      let pdfUrl = inv.pdf_url;
      if (!pdfUrl) {
        toast.info('Preparing invoice PDF link…');
        const res = await uploadInvoicePdfAndGetSignedUrl(inv.id);
        pdfUrl = res.signedUrl;
      }
      const url = buildInvoiceWhatsAppUrl({
        phone: customer.phone,
        customerName: customer.name,
        invoiceNumber: inv.invoice_number,
        total: Number(inv.total_amount),
        isPaid: inv.is_paid,
        pdfUrl,
      });
      window.open(url, '_blank');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSharingInvoice(false);
    }
  };

  return (
    <DashboardLayout
      title={job.title}
      subtitle={`Job ID: ${job.id.slice(0, 8).toUpperCase()} · ${job.service_type ?? 'Service'}`}
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/app/jobs')} className="rounded-full">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={handleShareTracking}
            disabled={!customer?.phone}
            className="rounded-full bg-success text-success-foreground hover:bg-success/90"
          >
            <Share2 className="mr-1 h-4 w-4" /> Send tracking link
          </Button>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left col */}
        <div className="space-y-5 lg:col-span-2">
          {/* Status banner */}
          <Card className="overflow-hidden border-border/70 shadow-card">
            <div className="gradient-primary p-1" />
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <JobStatusBadge status={job.status as Enums<'job_status'>} />
                    {job.priority > 0 && <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">PRIORITY</span>}
                  </div>
                  <h2 className="mt-2 font-heading text-2xl font-bold">{job.title}</h2>
                  {job.description && <p className="mt-1 text-sm text-muted-foreground">{job.description}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.status === 'pending' || job.status === 'assigned' ? (
                    <Button onClick={handleCheckIn} className="rounded-full gradient-primary text-primary-foreground shadow-glow">
                      <Play className="mr-1 h-4 w-4" /> Check in
                    </Button>
                  ) : null}
                  {job.status === 'in_progress' && (
                    <Button onClick={handleCheckOut} className="rounded-full bg-success text-success-foreground hover:bg-success/90">
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Complete
                    </Button>
                  )}
                </div>
              </div>

              {(job.checkin_at || job.checkout_at) && (
                <div className="mt-5 grid gap-3 rounded-xl bg-secondary p-4 sm:grid-cols-2">
                  {job.checkin_at && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <Play className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Checked in</p>
                        <p className="text-sm font-semibold">{format(new Date(job.checkin_at), 'dd MMM, hh:mm a')}</p>
                        {job.checkin_latitude && (
                          <a
                            href={`https://maps.google.com/?q=${job.checkin_latitude},${job.checkin_longitude}`}
                            target="_blank" rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1"
                          >
                            <Navigation className="h-3 w-3" /> View GPS
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {job.checkout_at && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Completed</p>
                        <p className="text-sm font-semibold">{format(new Date(job.checkout_at), 'dd MMM, hh:mm a')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parts */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">Parts & line items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {parts.length === 0 ? (
                <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                  No parts added. Add spare parts used or extra service charges.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Price</th>
                        <th className="px-3 py-2 text-right">Total</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map(p => (
                        <tr key={p.id} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-right">{p.quantity}</td>
                          <td className="px-3 py-2 text-right">₹{Number(p.unit_price).toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2 text-right font-semibold">₹{Number(p.total).toLocaleString('en-IN')}</td>
                          <td className="px-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removePart.mutate(p.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_80px_120px_auto]">
                <Input placeholder="Item name" value={partName} onChange={e => setPartName(e.target.value)} />
                <Input type="number" placeholder="Qty" value={partQty} onChange={e => setPartQty(e.target.value)} />
                <Input type="number" placeholder="Price ₹" value={partPrice} onChange={e => setPartPrice(e.target.value)} />
                <Button onClick={() => addPart.mutate()} disabled={!partName} className="gap-1 rounded-full gradient-primary text-primary-foreground">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                defaultValue={job.notes ?? ''}
                placeholder="Diagnosis, customer requests, follow-up reminders…"
                rows={4}
                onBlur={(e) => {
                  if (e.target.value !== (job.notes ?? '')) {
                    updateJob.mutate({ notes: e.target.value });
                    toast.success('Notes saved');
                  }
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          {/* Customer */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                  {customer?.name?.charAt(0) ?? 'C'}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{customer?.name ?? 'Unknown'}</p>
                  <a href={`tel:${customer?.phone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                    <Phone className="h-3 w-3" /> {customer?.phone}
                  </a>
                </div>
              </div>
              {(job.address || customer?.address) && (
                <div className="flex items-start gap-2 rounded-xl bg-secondary p-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p>{job.address ?? customer?.address}</p>
                    <p className="text-muted-foreground">{job.city ?? customer?.city} {job.pincode ? `- ${job.pincode}` : ''}</p>
                  </div>
                </div>
              )}
              {job.scheduled_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(job.scheduled_date), 'EEE, dd MMM yyyy')}
                  {job.scheduled_time_start && <Clock className="ml-2 h-4 w-4 text-muted-foreground" />}
                  {job.scheduled_time_start && <span>{job.scheduled_time_start}</span>}
                </div>
              )}
              {job.assigned_to && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" /> Assigned technician
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer share */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Share2 className="h-4 w-4 text-primary" /> Customer share
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trackingUrl && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Live tracking link
                  </p>
                  <div className="flex items-center gap-1 rounded-xl border border-dashed border-border bg-secondary/40 p-2">
                    <code className="flex-1 truncate text-[11px] text-muted-foreground">
                      {trackingUrl}
                    </code>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopyTracking} title="Copy link">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button
                    onClick={handleShareTracking}
                    disabled={!customer?.phone}
                    className="w-full rounded-full bg-success text-success-foreground hover:bg-success/90"
                  >
                    <MessageCircle className="mr-1 h-4 w-4" /> Send tracking on WhatsApp
                  </Button>
                </div>
              )}
              {job.status === 'completed' && feedbackUrl && (
                <Button
                  onClick={handleShareFeedback}
                  disabled={!customer?.phone}
                  variant="outline"
                  className="w-full rounded-full border-warning/40 text-warning hover:bg-warning/10 hover:text-warning"
                >
                  <Star className="mr-1 h-4 w-4" /> Request feedback
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Payment summary */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-primary" /> Payment summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service charge</span>
                <span className="font-semibold">₹{(job.payment_amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Parts</span>
                <span className="font-semibold">₹{partsTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GST 18%</span>
                <span className="font-semibold">₹{gst.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-heading font-bold">Total</span>
                <span className="font-heading text-2xl font-extrabold">₹{grand.toLocaleString('en-IN')}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  variant={job.payment_status === 'collected' ? 'default' : 'outline'}
                  className={job.payment_status === 'collected' ? 'bg-success text-success-foreground hover:bg-success/90' : ''}
                  onClick={() => updateJob.mutate({ payment_status: 'collected', payment_method: 'cash' })}
                >
                  Cash
                </Button>
                <Button
                  variant={job.payment_method === 'upi' ? 'default' : 'outline'}
                  className={job.payment_method === 'upi' ? 'bg-success text-success-foreground hover:bg-success/90' : ''}
                  onClick={() => updateJob.mutate({ payment_status: 'collected', payment_method: 'upi' })}
                >
                  UPI
                </Button>
              </div>
              <Button
                onClick={() => generateInvoice.mutate()}
                disabled={generateInvoice.isPending}
                className="w-full rounded-full gradient-primary text-primary-foreground shadow-glow"
              >
                <FileText className="mr-1 h-4 w-4" />
                {generateInvoice.isPending ? 'Generating…' : 'Generate GST invoice'}
              </Button>
              <Button
                onClick={handleShareInvoice}
                disabled={sharingInvoice || !customer?.phone}
                variant="outline"
                className="w-full rounded-full border-success/40 text-success hover:bg-success/10 hover:text-success"
              >
                <MessageCircle className="mr-1 h-4 w-4" />
                {sharingInvoice ? 'Preparing link…' : 'Send invoice on WhatsApp'}
              </Button>
              <Button asChild variant="ghost" className="w-full text-xs">
                <Link to="/app/invoices">View all invoices</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}