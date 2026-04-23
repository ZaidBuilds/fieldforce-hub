import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import JobStatusBadge from '@/components/JobStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase, IndianRupee, Clock, MapPin, TrendingUp, AlertTriangle,
  CheckCircle2, ArrowRight, Star, Phone,
} from 'lucide-react';
import { format, isToday, subDays, startOfDay } from 'date-fns';
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

  const todayJobs = jobs.filter(j => j.scheduled_date && isToday(new Date(j.scheduled_date)));
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const completedToday = jobs.filter(j => j.status === 'completed' && j.checkout_at && isToday(new Date(j.checkout_at))).length;
  const collectedToday = jobs
    .filter(j => j.payment_status === 'collected' && j.checkout_at && isToday(new Date(j.checkout_at)))
    .reduce((sum, j) => sum + (j.payment_amount ?? 0), 0);
  const pendingPayments = jobs
    .filter(j => j.payment_status === 'pending' && j.payment_amount && j.payment_amount > 0)
    .reduce((sum, j) => sum + (j.payment_amount ?? 0), 0);

  // 7-day revenue spark
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayStr = format(d, 'yyyy-MM-dd');
    const total = jobs
      .filter(j => j.payment_status === 'collected' && j.checkout_at && format(new Date(j.checkout_at), 'yyyy-MM-dd') === dayStr)
      .reduce((s, j) => s + (j.payment_amount ?? 0), 0);
    return { day: format(d, 'EEE'), total };
  });
  const maxDay = Math.max(...days.map(d => d.total), 1);
  const weekTotal = days.reduce((s, d) => s + d.total, 0);

  const slaAlerts = jobs.filter(j => j.status === 'pending' && j.scheduled_date && new Date(j.scheduled_date) < startOfDay(new Date())).slice(0, 3);

  const topTechs = technicians.map(t => {
    const myJobs = jobs.filter(j => j.assigned_to === t.user_id);
    const completed = myJobs.filter(j => j.status === 'completed').length;
    return { ...t, completed, total: myJobs.length };
  }).sort((a, b) => b.completed - a.completed).slice(0, 4);

  const stats = [
    { title: "Today's Jobs", value: todayJobs.length, sub: `${activeJobs} in progress`, icon: Briefcase, color: 'bg-primary/10 text-primary' },
    { title: 'Completed Today', value: completedToday, sub: 'jobs closed', icon: CheckCircle2, color: 'bg-success/10 text-success' },
    { title: 'Collected Today', value: `₹${collectedToday.toLocaleString('en-IN')}`, sub: 'cash + UPI', icon: IndianRupee, color: 'bg-accent/10 text-accent' },
    { title: 'Pending Dues', value: `₹${pendingPayments.toLocaleString('en-IN')}`, sub: 'to be collected', icon: AlertTriangle, color: 'bg-warning/15 text-warning' },
  ];

  return (
    <DashboardLayout title="Good morning, Owner 👋" subtitle={`Here's what's happening on ${format(new Date(), 'EEEE, dd MMM')}`}>
      <div className="space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map(s => (
            <Card key={s.title} className="border-border/70 shadow-card transition hover:shadow-card-hover">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.title}</p>
                <p className="mt-1 font-heading text-3xl font-bold tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue + Today */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-heading text-base">Revenue this week</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Total <span className="font-bold text-foreground">₹{weekTotal.toLocaleString('en-IN')}</span> · last 7 days
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-xs font-bold text-success">
                <TrendingUp className="h-3 w-3" /> Live
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex h-44 items-end gap-2 sm:gap-3">
                {days.map(d => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div className="relative w-full">
                      <div
                        className="w-full rounded-t-lg gradient-primary shadow-glow transition-all"
                        style={{ height: `${(d.total / maxDay) * 140 + 6}px` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-heading text-base">Today's schedule</CardTitle>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link to="/app/schedule">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayJobs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No jobs scheduled for today.
                </div>
              ) : todayJobs.slice(0, 4).map(job => (
                <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center gap-3 rounded-xl border border-border/60 p-3 transition hover:border-primary/40 hover:shadow-card">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{job.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {(job as any).customers?.name ?? 'Customer'} · {job.city ?? '—'}
                    </p>
                  </div>
                  <JobStatusBadge status={job.status as Enums<'job_status'>} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alerts + leaderboard */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-warning/30 bg-warning/5 shadow-card lg:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <CardTitle className="font-heading text-base">Needs your attention</CardTitle>
            </CardHeader>
            <CardContent>
              {slaAlerts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-warning/30 bg-background p-5 text-center text-sm text-muted-foreground">
                  All clear. No overdue jobs 🎉
                </p>
              ) : (
                <div className="space-y-2">
                  {slaAlerts.map(job => (
                    <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between rounded-xl bg-background p-3 transition hover:shadow-card">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{job.title}</p>
                        <p className="text-xs text-warning">
                          Overdue · scheduled {format(new Date(job.scheduled_date!), 'dd MMM')}
                        </p>
                      </div>
                      <span className="rounded-full bg-warning px-2.5 py-1 text-[10px] font-bold text-warning-foreground">
                        Reassign
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="font-heading text-base">Top technicians</CardTitle>
              <Star className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              {topTechs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No technicians yet.</p>
              ) : topTechs.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-4 text-center font-heading text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                    {t.full_name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.full_name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {t.phone}
                    </p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-bold">{t.completed}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Recent jobs feed */}
        <Card className="border-border/70 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="font-heading text-base">Recent activity</CardTitle>
            <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
              <Link to="/app/jobs">All jobs <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No jobs yet. Create your first job to see it here.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {jobs.slice(0, 6).map(job => (
                  <Link key={job.id} to={`/app/jobs/${job.id}`} className="flex items-center justify-between py-3 transition hover:bg-secondary/40">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-sm font-semibold">{job.title}</p>
                      <p className="truncate text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {(job as any).customers?.name ?? 'Customer'} · {job.city ?? 'No city'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.payment_amount ? (
                        <span className="hidden text-sm font-bold sm:inline">₹{job.payment_amount.toLocaleString('en-IN')}</span>
                      ) : null}
                      <JobStatusBadge status={job.status as Enums<'job_status'>} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
