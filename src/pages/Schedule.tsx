import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import JobStatusBadge from '@/components/JobStatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, Clock, User } from 'lucide-react';
import type { Enums } from '@/integrations/supabase/types';

export default function Schedule() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('*, customers(name, phone), profiles!jobs_assigned_to_fkey(full_name)').order('scheduled_date', { ascending: true });
      if (error) {
        // fallback if relationship not present
        const fb = await supabase.from('jobs').select('*, customers(name, phone)').order('scheduled_date', { ascending: true });
        if (fb.error) throw fb.error;
        return fb.data;
      }
      return data;
    },
  });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <DashboardLayout
      title="Schedule"
      subtitle="Plan technician routes and balance the workload"
      action={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <div className="grid min-w-[900px] grid-cols-7 gap-3">
          {days.map(d => {
            const dayJobs = jobs.filter(j => j.scheduled_date && isSameDay(new Date(j.scheduled_date), d));
            const isToday = isSameDay(d, new Date());
            return (
              <div key={d.toISOString()} className="flex flex-col">
                <div className={`mb-3 rounded-xl px-3 py-2 ${isToday ? 'gradient-primary text-primary-foreground shadow-glow' : 'bg-secondary'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{format(d, 'EEE')}</p>
                  <p className="font-heading text-2xl font-bold">{format(d, 'd')}</p>
                </div>
                <div className="space-y-2">
                  {dayJobs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-3 text-center text-[11px] text-muted-foreground">
                      No jobs
                    </div>
                  ) : dayJobs.map(job => (
                    <Link key={job.id} to={`/app/jobs/${job.id}`}>
                      <Card className="border-border/60 p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-card-hover">
                        <p className="line-clamp-2 text-xs font-semibold">{job.title}</p>
                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                          {job.scheduled_time_start && (
                            <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.scheduled_time_start}</p>
                          )}
                          {(job as any).customers?.name && (
                            <p className="flex items-center gap-1"><User className="h-3 w-3" /> {(job as any).customers.name}</p>
                          )}
                          {job.city && (
                            <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.city}</p>
                          )}
                        </div>
                        <div className="mt-2">
                          <JobStatusBadge status={job.status as Enums<'job_status'>} />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}