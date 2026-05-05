import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Repeat, Calendar, IndianRupee, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

export default function Contracts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_contracts')
        .select('*, customers(name, phone, address, city)')
        .order('next_due_date', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('id, name, phone');
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (fd: FormData) => {
      const { error } = await supabase.from('service_contracts').insert({
        customer_id: fd.get('customer_id') as string,
        title: fd.get('title') as string,
        service_type: (fd.get('service_type') as string) || null,
        frequency_days: parseInt(fd.get('frequency_days') as string) || 90,
        next_due_date: fd.get('next_due_date') as string,
        amount: parseFloat(fd.get('amount') as string) || 0,
        notes: (fd.get('notes') as string) || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      setOpen(false);
      toast.success('Contract added');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateJob = useMutation({
    mutationFn: async (c: any) => {
      // Create a job from this contract
      const { error } = await supabase.from('jobs').insert({
        title: c.title,
        service_type: c.service_type,
        customer_id: c.customer_id,
        address: c.customers?.address,
        city: c.customers?.city,
        scheduled_date: c.next_due_date,
        payment_amount: c.amount,
        status: 'pending',
        created_by: user?.id,
      });
      if (error) throw error;
      // Advance next_due_date
      const next = format(addDays(new Date(c.next_due_date), c.frequency_days), 'yyyy-MM-dd');
      const { error: e2 } = await supabase
        .from('service_contracts')
        .update({ next_due_date: next })
        .eq('id', c.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job generated and contract advanced');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date();

  return (
    <DashboardLayout
      title="AMC Contracts"
      subtitle="Recurring service contracts with auto-job generation"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground gap-2">
              <Plus className="h-4 w-4" /> New Contract
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">New AMC Contract</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <select name="customer_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select customer</option>
                  {customers.map((c: any) => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input name="title" required placeholder="Quarterly AC Service" /></div>
              <div className="space-y-2"><Label>Service Type</Label><Input name="service_type" placeholder="AC Maintenance" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Frequency (days)</Label><Input name="frequency_days" type="number" defaultValue={90} required /></div>
                <div className="space-y-2"><Label>Next due date</Label><Input name="next_due_date" type="date" required /></div>
              </div>
              <div className="space-y-2"><Label>Amount (₹)</Label><Input name="amount" type="number" step="0.01" /></div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={create.isPending}>
                {create.isPending ? 'Saving...' : 'Save contract'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-3">
        {contracts.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
            No contracts yet. Add your first AMC to start automating recurring jobs.
          </CardContent></Card>
        ) : contracts.map((c: any) => {
          const due = new Date(c.next_due_date);
          const overdue = due < today;
          return (
            <Card key={c.id} className="border-border/70 shadow-card">
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-heading font-semibold">{c.title}</p>
                    {overdue && <Badge variant="destructive">Due</Badge>}
                    {!c.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span>{c.customers?.name}</span>
                    <span className="flex items-center gap-1"><Repeat className="h-3 w-3" /> Every {c.frequency_days} days</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(due, 'dd MMM yyyy')}</span>
                    {c.amount > 0 && <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{c.amount.toLocaleString('en-IN')}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1" onClick={() => generateJob.mutate(c)} disabled={generateJob.isPending}>
                  <PlayCircle className="h-4 w-4" /> Generate job
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}