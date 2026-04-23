import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, Save } from 'lucide-react';

const DEFAULT_OWNER = '00000000-0000-0000-0000-000000000000';

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

  return (
    <DashboardLayout title="Business settings" subtitle="Your details appear on invoices, WhatsApp messages and customer receipts">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-border/70 shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Business profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Business name</Label>
              <Input value={form.business_name ?? ''} onChange={e => update('business_name', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Phone</Label><Input value={form.phone ?? ''} onChange={e => update('phone', e.target.value)} /></div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email ?? ''} onChange={e => update('email', e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address ?? ''} onChange={e => update('address', e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>City</Label><Input value={form.city ?? ''} onChange={e => update('city', e.target.value)} /></div>
              <div className="space-y-2"><Label>State</Label><Input value={form.state ?? ''} onChange={e => update('state', e.target.value)} /></div>
              <div className="space-y-2"><Label>Pincode</Label><Input value={form.pincode ?? ''} onChange={e => update('pincode', e.target.value)} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>GST number</Label><Input value={form.gst_number ?? ''} onChange={e => update('gst_number', e.target.value)} placeholder="29ABCDE1234F1Z5" /></div>
              <div className="space-y-2"><Label>UPI ID</Label><Input value={form.upi_id ?? ''} onChange={e => update('upi_id', e.target.value)} placeholder="business@hdfcbank" /></div>
            </div>
            <div className="space-y-2">
              <Label>Invoice prefix</Label>
              <Input value={form.invoice_prefix ?? ''} onChange={e => update('invoice_prefix', e.target.value)} className="max-w-[160px]" />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-full gradient-primary text-primary-foreground shadow-glow">
              <Save className="mr-1 h-4 w-4" /> {save.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-5">
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

          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-card">
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