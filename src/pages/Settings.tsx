import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Save, MapPin, Receipt, Wallet, Image as ImageIcon, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { downloadInvoicePdf } from '@/lib/invoicePdf';

const DEFAULT_OWNER = '00000000-0000-0000-0000-000000000000';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
const UPI_REGEX = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

export default function Settings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ['business_settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('business_settings').select('*').eq('owner_id', DEFAULT_OWNER).maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: created, error: insErr } = await supabase.from('business_settings').insert({ owner_id: DEFAULT_OWNER, business_name: 'My Field Service Business' }).select().single();
        if (insErr) throw insErr;
        return created;
      }
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        business_name: settings.business_name ?? '',
        address: settings.address ?? '',
        city: settings.city ?? '',
        state: settings.state ?? '',
        pincode: settings.pincode ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        gst_number: settings.gst_number ?? '',
        upi_id: settings.upi_id ?? '',
        invoice_prefix: settings.invoice_prefix ?? 'INV',
        logo_url: settings.logo_url ?? '',
      });
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('business_settings').update(form as never).eq('owner_id', DEFAULT_OWNER);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Settings saved');
      queryClient.invalidateQueries({ queryKey: ['business_settings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const monogram = (form.business_name || 'FF')
    .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'FF';

  const gstValid = !form.gst_number || GSTIN_REGEX.test(form.gst_number);
  const upiValid = !form.upi_id || UPI_REGEX.test(form.upi_id);

  const generatePreview = async () => {
    try {
      await downloadInvoicePdf({
        invoiceNumber: `${form.invoice_prefix || 'INV'}-PREVIEW`,
        createdAt: new Date(),
        jobTitle: 'AC service & gas refill',
        serviceType: 'Maintenance',
        business: {
          business_name: form.business_name,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone,
          email: form.email,
          gst_number: form.gst_number,
          upi_id: form.upi_id,
          logo_url: form.logo_url,
        },
        customer: { name: 'Sample Customer', phone: '+91 98765 43210', address: '123 MG Road', city: 'Bengaluru' },
        serviceCharge: 1200,
        parts: [
          { name: 'AC capacitor', quantity: 1, unit_price: 450, total: 450 },
          { name: 'Gas refill (R32)', quantity: 1, unit_price: 1800, total: 1800 },
        ],
        subtotal: 3450,
        gstRate: 18,
        gstAmount: 621,
        total: 4071,
        isPaid: false,
      });
      toast.success('Preview invoice downloaded');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <DashboardLayout
      title="Business settings"
      subtitle="Your details appear on every branded invoice, WhatsApp message and customer receipt"
      action={
        <Button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-full gradient-primary text-primary-foreground shadow-glow"
        >
          <Save className="mr-1 h-4 w-4" /> {save.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      }
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Identity */}
          <Card className="overflow-hidden border-border/70 shadow-card">
            <div className="gradient-primary p-1" />
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Brand identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl gradient-primary text-primary-foreground shadow-glow">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="logo" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-heading text-2xl font-extrabold">
                      {monogram}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-xs">Logo URL (optional)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={form.logo_url ?? ''}
                        onChange={e => update('logo_url', e.target.value)}
                        placeholder="https://your-domain.com/logo.png"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Square PNG works best (≥256×256). Leave empty to use the orange monogram instead.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Business name</Label>
                <Input value={form.business_name ?? ''} onChange={e => update('business_name', e.target.value)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label>Phone</Label><Input value={form.phone ?? ''} onChange={e => update('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={e => update('email', e.target.value)} placeholder="hello@business.in" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Service address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address ?? ''} onChange={e => update('address', e.target.value)} placeholder="Shop 12, MG Road" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2"><Label>City</Label><Input value={form.city ?? ''} onChange={e => update('city', e.target.value)} /></div>
                <div className="space-y-2"><Label>State</Label><Input value={form.state ?? ''} onChange={e => update('state', e.target.value)} /></div>
                <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode ?? ''} onChange={e => update('pincode', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Tax & invoicing */}
          <Card className="border-border/70 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" /> Tax & invoicing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>GSTIN</Label>
                  <Input
                    value={form.gst_number ?? ''}
                    onChange={e => update('gst_number', e.target.value.toUpperCase())}
                    placeholder="29ABCDE1234F1Z5"
                    className={!gstValid ? 'border-destructive' : ''}
                  />
                  <ValidHint ok={gstValid} okText="Valid GSTIN format" badText="GSTIN should be 15 chars (e.g. 29ABCDE1234F1Z5)" empty={!form.gst_number} />
                </div>
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input
                    value={form.upi_id ?? ''}
                    onChange={e => update('upi_id', e.target.value)}
                    placeholder="business@hdfcbank"
                    className={!upiValid ? 'border-destructive' : ''}
                  />
                  <ValidHint ok={upiValid} okText="UPI ID looks valid — QR will appear on PDFs" badText="Format should be name@bank (e.g. shop@okhdfcbank)" empty={!form.upi_id} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Invoice prefix</Label>
                  <Input value={form.invoice_prefix ?? ''} onChange={e => update('invoice_prefix', e.target.value.toUpperCase())} placeholder="INV" />
                  <p className="text-[11px] text-muted-foreground">
                    Next invoice will look like <span className="font-mono font-semibold text-foreground">{(form.invoice_prefix || 'INV')}-251224-1042</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Default GST rate</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                    <span className="font-heading text-lg font-bold">{settings?.default_gst_rate ?? 18}%</span>
                    <span className="text-xs text-muted-foreground">applied to all invoices</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Live preview */}
          <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> Invoice preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border bg-background p-3 shadow-sm">
                <div className="flex items-start gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary text-primary-foreground font-heading text-sm font-extrabold">
                    {monogram}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-bold">{form.business_name || 'Your business name'}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {form.city ? `${form.city}, ` : ''}{form.state || 'Karnataka'} · GSTIN {form.gst_number || '—'}
                    </p>
                  </div>
                  <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">TAX INVOICE</span>
                </div>
                <div className="mt-3 flex items-end justify-between border-t pt-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total</p>
                    <p className="font-heading text-lg font-extrabold">₹4,071.00</p>
                  </div>
                  <span className="rounded-full border border-warning bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">UNPAID</span>
                </div>
              </div>
              <Button onClick={generatePreview} variant="outline" className="w-full rounded-full">
                Download sample PDF
              </Button>
              <p className="text-[11px] text-muted-foreground">
                See exactly what your customers will receive — with your logo, GSTIN, UPI QR and brand colors.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Current</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">Business</span>
              </div>
              <p className="text-xs text-muted-foreground">Renews on {new Date(Date.now() + 1000 * 60 * 60 * 24 * 22).toDateString()}</p>
              <Button variant="outline" className="w-full rounded-full">Manage billing</Button>
            </CardContent>
          </Card>

          <Card className="border-success/30 bg-gradient-to-br from-success/5 to-transparent shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Need help?</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Our team in Bengaluru is just a WhatsApp away. We onboard your team for free.
              </p>
              <Button asChild className="mt-4 w-full rounded-full bg-success text-success-foreground hover:bg-success/90">
                <a href="https://wa.me/918000000000" target="_blank" rel="noreferrer">Chat with support</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ValidHint({ ok, okText, badText, empty }: { ok: boolean; okText: string; badText: string; empty: boolean }) {
  if (empty) return null;
  return ok ? (
    <p className="flex items-center gap-1 text-[11px] text-success">
      <CheckCircle2 className="h-3 w-3" /> {okText}
    </p>
  ) : (
    <p className="flex items-center gap-1 text-[11px] text-destructive">
      <AlertCircle className="h-3 w-3" /> {badText}
    </p>
  );
}