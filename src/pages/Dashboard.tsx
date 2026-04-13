import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import JobStatusBadge from '@/components/JobStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, IndianRupee, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { Enums } from '@/integrations/supabase/types';

export default function Dashboard() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*, customers(name, phone)').order('created_at', { ascending: false });
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

  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const completedToday = jobs.filter(j => j.status === 'completed' && j.checkout_at && format(new Date(j.checkout_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;
  const totalCollected = jobs.filter(j => j.payment_status === 'collected').reduce((sum, j) => sum + (j.payment_amount ?? 0), 0);
  const pendingPayments = jobs.filter(j => j.payment_status === 'pending' && j.payment_amount && j.payment_amount > 0).reduce((sum, j) => sum + (j.payment_amount ?? 0), 0);

  const recentJobs = jobs.slice(0, 8);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your field operations at a glance</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Jobs" value={activeJobs} icon={Briefcase} variant="primary" />
          <StatCard title="Completed Today" value={completedToday} icon={Clock} variant="success" />
          <StatCard title="Cash Collected" value={`₹${totalCollected.toLocaleString('en-IN')}`} icon={IndianRupee} variant="accent" />
          <StatCard title="Pending Payments" value={`₹${pendingPayments.toLocaleString('en-IN')}`} icon={IndianRupee} variant="warning" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {recentJobs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No jobs yet. Create your first job!</p>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between rounded-lg border p-3 hover:shadow-card-hover transition-shadow">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{job.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {(job as any).customers?.name ?? 'Unknown'} • {job.city ?? 'No city'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {job.payment_amount ? (
                          <span className="text-sm font-medium">₹{job.payment_amount.toLocaleString('en-IN')}</span>
                        ) : null}
                        <JobStatusBadge status={job.status as Enums<'job_status'>} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Technicians</CardTitle>
            </CardHeader>
            <CardContent>
              {technicians.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No technicians added yet.</p>
              ) : (
                <div className="space-y-3">
                  {technicians.map(tech => (
                    <div key={tech.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                        {tech.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{tech.full_name}</p>
                        <p className="text-xs text-muted-foreground">{tech.phone}</p>
                      </div>
                      <div className={`h-2.5 w-2.5 rounded-full ${tech.is_active ? 'bg-success' : 'bg-muted-foreground'}`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
