import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, CheckCircle, XCircle } from 'lucide-react';

export default function Technicians() {
  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('role', 'technician').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('jobs').select('assigned_to, status');
      if (error) throw error;
      return data;
    },
  });

  const getJobCounts = (userId: string) => {
    const userJobs = jobs.filter(j => j.assigned_to === userId);
    return {
      active: userJobs.filter(j => j.status === 'in_progress').length,
      completed: userJobs.filter(j => j.status === 'completed').length,
      total: userJobs.length,
    };
  };

  return (
    <DashboardLayout title="Technicians" subtitle="Monitor your field workforce">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {technicians.length === 0 ? (
            <Card className="col-span-full shadow-card">
              <CardContent className="py-12 text-center text-muted-foreground">No technicians registered yet. They will appear here once they sign up.</CardContent>
            </Card>
          ) : (
            technicians.map(tech => {
              const counts = getJobCounts(tech.user_id);
              return (
                <Card key={tech.id} className="shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
                        {tech.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading font-semibold truncate">{tech.full_name}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{tech.phone}</p>
                      </div>
                      {tech.is_active ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-secondary p-2">
                        <p className="text-lg font-bold">{counts.active}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div className="rounded-lg bg-secondary p-2">
                        <p className="text-lg font-bold">{counts.completed}</p>
                        <p className="text-xs text-muted-foreground">Done</p>
                      </div>
                      <div className="rounded-lg bg-secondary p-2">
                        <p className="text-lg font-bold">{counts.total}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
