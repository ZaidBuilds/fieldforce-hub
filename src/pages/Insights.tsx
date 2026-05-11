import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInMinutes, format, subDays, eachDayOfInterval } from 'date-fns';
import { Trophy, Repeat2, Timer, TrendingUp, Star } from 'lucide-react';

export default function Insights() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs-insights'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: techs = [] } = useQuery({
    queryKey: ['techs-insights'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id, full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const today = new Date();
  const completed = jobs.filter((j: any) => j.checkout_at);

  // Revenue/day 30d
  const last30 = eachDayOfInterval({ start: subDays(today, 29), end: today }).map(d => {
    const ds = format(d, 'yyyy-MM-dd');
    const rev = jobs
      .filter((j: any) => j.payment_status === 'collected' && j.checkout_at && format(new Date(j.checkout_at), 'yyyy-MM-dd') === ds)
      .reduce((s: number, j: any) => s + Number(j.payment_amount ?? 0), 0);
    return { date: d, rev };
  });
  const maxRev = Math.max(...last30.map(d => d.rev), 1);

  // Technician leaderboard
  const leaderboard = techs
    .map((t: any) => {
      const tJobs = completed.filter((j: any) => j.assigned_to === t.user_id);
      const revenue = tJobs
        .filter((j: any) => j.payment_status === 'collected')
        .reduce((s: number, j: any) => s + Number(j.payment_amount ?? 0), 0);
      const ratings = tJobs.filter((j: any) => j.customer_rating).map((j: any) => Number(j.customer_rating));
      const avgRating = ratings.length ? ratings.reduce((s: number, r: number) => s + r, 0) / ratings.length : 0;
      return { name: t.full_name, jobs: tJobs.length, revenue, avgRating };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  // Repeat customer %
  const customerCounts = completed.reduce<Record<string, number>>((acc, j: any) => {
    acc[j.customer_id] = (acc[j.customer_id] ?? 0) + 1;
    return acc;
  }, {});
  const totalCust = Object.keys(customerCounts).length;
  const repeatCust = Object.values(customerCounts).filter(n => n > 1).length;
  const repeatPct = totalCust ? Math.round((repeatCust / totalCust) * 100) : 0;

  // Avg resolution time
  const resolved = completed.filter((j: any) => j.checkin_at && j.checkout_at);
  const avgResolveMin = resolved.length
    ? Math.round(
        resolved.reduce((s: number, j: any) => s + differenceInMinutes(new Date(j.checkout_at), new Date(j.checkin_at)), 0) /
          resolved.length,
      )
    : 0;

  // Avg rating
  const allRatings = completed.filter((j: any) => j.customer_rating).map((j: any) => Number(j.customer_rating));
  const avgRating = allRatings.length ? (allRatings.reduce((s: number, r: number) => s + r, 0) / allRatings.length).toFixed(1) : '—';

  // Service category performance
  const svcRevenue = completed.reduce<Record<string, number>>((acc, j: any) => {
    const k = j.service_type ?? 'Other';
    acc[k] = (acc[k] ?? 0) + Number(j.payment_amount ?? 0);
    return acc;
  }, {});
  const svcSorted = Object.entries(svcRevenue).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSvc = Math.max(...svcSorted.map(([, v]) => v), 1);

  return (
    <DashboardLayout title="Business Insights" subtitle="Operational intelligence at a glance">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Repeat customer %', value: `${repeatPct}%`, icon: Repeat2, tone: 'bg-primary/10 text-primary' },
            { title: 'Avg resolution', value: avgResolveMin ? `${avgResolveMin} min` : '—', icon: Timer, tone: 'bg-warning/15 text-warning' },
            { title: 'Avg customer rating', value: avgRating, icon: Star, tone: 'bg-success/10 text-success' },
            { title: 'Jobs completed', value: completed.length, icon: TrendingUp, tone: 'bg-accent/15 text-accent-foreground' },
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

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="font-heading text-base">Daily revenue (30d)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-1">
              {last30.map(d => (
                <div key={d.date.toISOString()} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-sm bg-primary/80 hover:bg-primary"
                    style={{ height: `${(d.rev / maxRev) * 140 + 2}px` }}
                    title={`${format(d.date, 'dd MMM')}: ₹${d.rev}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="border-border/70 shadow-card">
            <CardHeader><CardTitle className="font-heading text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" />Technician leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
              ) : leaderboard.map((t, i) => (
                <div key={t.name + i} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-warning text-warning-foreground' : 'bg-secondary'}`}>{i + 1}</span>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.jobs} jobs · {t.avgRating ? `${t.avgRating.toFixed(1)}★` : 'no ratings'}</p>
                    </div>
                  </div>
                  <p className="font-heading font-bold">₹{t.revenue.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Service category revenue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {svcSorted.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No data yet.</p>
              ) : svcSorted.map(([name, rev]) => (
                <div key={name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    <Badge variant="outline">₹{rev.toLocaleString('en-IN')}</Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full gradient-primary" style={{ width: `${(rev / maxSvc) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}