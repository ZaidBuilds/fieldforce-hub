import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { TrendingUp, IndianRupee, Briefcase, Download, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(name, gst_number, state)');
      if (error) throw error;
      return data ?? [];
    },
  });

  const last30 = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() }).map(d => {
    const ds = format(d, 'yyyy-MM-dd');
    const completed = jobs.filter(j => j.checkout_at && format(new Date(j.checkout_at), 'yyyy-MM-dd') === ds).length;
    const revenue = jobs
      .filter(j => j.payment_status === 'collected' && j.checkout_at && format(new Date(j.checkout_at), 'yyyy-MM-dd') === ds)
      .reduce((s, j) => s + (j.payment_amount ?? 0), 0);
    return { date: d, completed, revenue };
  });
  const max = Math.max(...last30.map(d => d.revenue), 1);
  const totalRevenue = last30.reduce((s, d) => s + d.revenue, 0);
  const totalJobs = last30.reduce((s, d) => s + d.completed, 0);
  const avgTicket = totalJobs ? Math.round(totalRevenue / totalJobs) : 0;
  const totalExpenses30 = expenses
    .filter((e: any) => new Date(e.spent_on) >= subDays(new Date(), 30))
    .reduce((s: number, e: any) => s + Number(e.amount), 0);
  const profit = totalRevenue - totalExpenses30;

  // Top services
  const services = jobs.reduce<Record<string, number>>((acc, j) => {
    const s = j.service_type ?? 'Other';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const topServices = Object.entries(services).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSvc = Math.max(...topServices.map(([, n]) => n), 1);

  const exportGSTR1 = () => {
    if (!invoices.length) { toast.error('No invoices to export'); return; }
    const rows = [
      ['Invoice Number', 'Invoice Date', 'Customer Name', 'Customer GSTIN', 'Place of Supply', 'Taxable Value', 'GST Rate', 'GST Amount', 'Total'],
      ...invoices.map((i: any) => [
        i.invoice_number,
        format(new Date(i.created_at), 'dd-MM-yyyy'),
        i.customers?.name ?? '',
        i.customers?.gst_number ?? '',
        i.customers?.state ?? '',
        i.subtotal,
        i.gst_rate,
        i.gst_amount,
        i.total_amount,
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gstr1-${format(new Date(), 'yyyy-MM')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('GSTR-1 exported');
  };

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Business performance over the last 30 days"
      action={
        <Button onClick={exportGSTR1} variant="outline" className="gap-2 rounded-full">
          <Download className="h-4 w-4" /> Export GSTR-1
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Revenue (30d)', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee },
            { title: 'Expenses (30d)', value: `₹${totalExpenses30.toLocaleString('en-IN')}`, icon: Wallet },
            { title: 'Profit (30d)', value: `₹${profit.toLocaleString('en-IN')}`, icon: TrendingUp },
            { title: 'Jobs completed', value: totalJobs, icon: Briefcase },
          ].map(s => (
            <Card key={s.title} className="border-border/70 shadow-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
          <CardHeader><CardTitle className="font-heading text-base">Daily revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-1">
              {last30.map(d => (
                <div key={d.date.toISOString()} className="group flex flex-1 flex-col items-center justify-end">
                  <div
                    className="w-full rounded-t-sm bg-primary/80 transition-all hover:bg-primary"
                    style={{ height: `${(d.revenue / max) * 160 + 2}px` }}
                    title={`${format(d.date, 'dd MMM')}: ₹${d.revenue}`}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] font-semibold text-muted-foreground">
              <span>{format(last30[0].date, 'dd MMM')}</span>
              <span>{format(last30[last30.length - 1].date, 'dd MMM')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-card">
          <CardHeader><CardTitle className="font-heading text-base">Top services</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topServices.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">No data yet.</p>
            ) : topServices.map(([name, n]) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-muted-foreground">{n} jobs</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full gradient-primary" style={{ width: `${(n / maxSvc) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}