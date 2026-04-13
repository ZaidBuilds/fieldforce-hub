import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import JobStatusBadge from '@/components/JobStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import type { Enums } from '@/integrations/supabase/types';

export default function Jobs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*, customers(name, phone)').order('scheduled_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'technician');
      if (error) throw error;
      return data;
    },
  });

  const createJob = useMutation({
    mutationFn: async (formData: FormData) => {
      const { error } = await supabase.from('jobs').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        service_type: formData.get('service_type') as string,
        customer_id: formData.get('customer_id') as string,
        assigned_to: formData.get('assigned_to') as string || null,
        address: formData.get('address') as string,
        city: formData.get('city') as string,
        pincode: formData.get('pincode') as string,
        scheduled_date: formData.get('scheduled_date') as string || null,
        payment_amount: parseFloat(formData.get('payment_amount') as string) || 0,
        status: (formData.get('assigned_to') ? 'assigned' : 'pending') as Enums<'job_status'>,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setOpen(false);
      toast.success('Job created successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filteredJobs = filterStatus === 'all' ? jobs : jobs.filter(j => j.status === filterStatus);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Jobs</h1>
            <p className="text-muted-foreground">Manage and track all service jobs</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground gap-2">
                <Plus className="h-4 w-4" /> New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading">Create New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createJob.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input name="title" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea name="description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Service Type</Label>
                    <Input name="service_type" placeholder="AC Repair, Plumbing..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Scheduled Date</Label>
                    <Input name="scheduled_date" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <select name="customer_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Select customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                  <select name="assigned_to" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="">Unassigned</option>
                    {technicians.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input name="address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input name="city" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input name="pincode" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Payment Amount (₹)</Label>
                  <Input name="payment_amount" type="number" step="0.01" />
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={createJob.isPending}>
                  {createJob.isPending ? 'Creating...' : 'Create Job'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'assigned', 'in_progress', 'completed', 'cancelled'].map(s => (
            <Button key={s} variant={filterStatus === s ? 'default' : 'outline'} size="sm"
              onClick={() => setFilterStatus(s)} className={filterStatus === s ? 'gradient-primary text-primary-foreground' : ''}>
              {s === 'all' ? 'All' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredJobs.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center text-muted-foreground">
                No jobs found. Create your first job to get started!
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <Card key={job.id} className="shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold">{job.title}</p>
                      <JobStatusBadge status={job.status} />
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {(job as any).customers?.name ?? 'Unknown'}
                      </span>
                      {job.service_type && <span>{job.service_type}</span>}
                      {job.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {format(new Date(job.scheduled_date), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {job.payment_amount ? (
                      <p className="font-heading font-bold text-lg">₹{job.payment_amount.toLocaleString('en-IN')}</p>
                    ) : null}
                    {job.city && <p className="text-xs text-muted-foreground">{job.city}</p>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
