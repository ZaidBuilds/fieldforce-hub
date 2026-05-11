import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Clock, MapPin, Navigation, Phone, Star,
  Wrench, Sparkles, ShieldCheck, Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import Logo from '@/components/Logo';

type TrackData = {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  service_type: string | null;
  scheduled_date: string | null;
  scheduled_time_start: string | null;
  address: string | null;
  city: string | null;
  pincode: string | null;
  checkin_at: string | null;
  checkout_at: string | null;
  eta_minutes: number | null;
  feedback_token: string | null;
  customer_rating: number | null;
  customer_feedback: string | null;
  customers: { name: string; phone: string } | null;
  technician: { full_name: string; phone: string } | null;
  business: { business_name: string; phone: string | null; logo_url: string | null } | null;
  history: Array<{ id: string; title: string; service_type: string | null; checkout_at: string | null; status: string }>;
};

const stages = [
  { key: 'pending', label: 'Booked', icon: Calendar },
  { key: 'assigned', label: 'Technician assigned', icon: Wrench },
  { key: 'in_progress', label: 'On the way / In progress', icon: Navigation },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
] as const;

const stageIndex = (s: TrackData['status']) =>
  Math.max(0, stages.findIndex(st => st.key === s));

export default function Track() {
  const { token } = useParams();
  const [data, setData] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;

    const load = async () => {
      // Job
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*, customers(name, phone)')
        .eq('tracking_token', token)
        .maybeSingle();
      if (error || !job) {
        if (active) { setNotFound(true); setLoading(false); }
        return;
      }
      // Technician (if assigned)
      let technician: TrackData['technician'] = null;
      if (job.assigned_to) {
        const { data: tech } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', job.assigned_to)
          .maybeSingle();
        technician = tech ?? null;
      }
      // Business (any row — single business per project)
      const { data: business } = await supabase
        .from('business_settings')
        .select('business_name, phone, logo_url')
        .limit(1)
        .maybeSingle();

      // Service history for the same customer (excluding current)
      const { data: history } = await supabase
        .from('jobs')
        .select('id, title, service_type, checkout_at, status')
        .eq('customer_id', job.customer_id)
        .neq('id', job.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!active) return;
      setData({ ...(job as object), technician, business, history: history ?? [] } as TrackData);
      setLoading(false);
    };
    load();

    // Realtime updates
    const channel = supabase
      .channel(`track-${token}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, payload => {
        const updated = payload.new as { tracking_token?: string };
        if (updated.tracking_token === token) load();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [token]);

  if (loading) {
    return <FullPage>Loading…</FullPage>;
  }
  if (notFound || !data) {
    return <FullPage>This tracking link is invalid or has expired.</FullPage>;
  }

  const idx = stageIndex(data.status);
  const isCancelled = data.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Logo />
          {data.business?.phone && (
            <a
              href={`tel:${data.business.phone}`}
              className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold hover:bg-secondary/80"
            >
              <Phone className="h-3.5 w-3.5" /> Help
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-5 sm:px-5">
        {/* Hero status */}
        <Card className="overflow-hidden border-border/70 shadow-card">
          <div className="gradient-primary p-1" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Service request
                </p>
                <h1 className="mt-1 truncate font-heading text-xl font-bold sm:text-2xl">
                  {data.title}
                </h1>
                {data.service_type && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{data.service_type}</p>
                )}
              </div>
              <Badge
                className={
                  isCancelled
                    ? 'bg-destructive text-destructive-foreground'
                    : data.status === 'completed'
                    ? 'bg-success text-success-foreground'
                    : data.status === 'in_progress'
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-warning/15 text-warning border border-warning/40'
                }
              >
                {(stages.find(s => s.key === data.status)?.label) ?? data.status}
              </Badge>
            </div>

            {data.eta_minutes && data.status !== 'completed' && !isCancelled && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold text-primary">ETA {data.eta_minutes} mins</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress timeline */}
        {!isCancelled && (
          <Card className="border-border/70 shadow-card">
            <CardContent className="p-5">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Live status
              </p>
              <ol className="relative space-y-5">
                {stages.map((s, i) => {
                  const Icon = s.icon;
                  const done = i < idx;
                  const current = i === idx;
                  return (
                    <li key={s.key} className="relative flex items-start gap-3">
                      {i < stages.length - 1 && (
                        <span
                          className={`absolute left-[18px] top-9 h-[calc(100%+0.25rem)] w-0.5 ${
                            done ? 'bg-success' : 'bg-border'
                          }`}
                        />
                      )}
                      <span
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          done
                            ? 'bg-success text-success-foreground'
                            : current
                            ? 'gradient-primary text-primary-foreground shadow-glow animate-pulse'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="pt-1">
                        <p
                          className={`font-semibold ${
                            current ? 'text-foreground' : done ? 'text-foreground/80' : 'text-muted-foreground'
                          }`}
                        >
                          {s.label}
                        </p>
                        {s.key === 'in_progress' && data.checkin_at && (
                          <p className="text-xs text-muted-foreground">
                            Started {format(new Date(data.checkin_at), 'dd MMM, hh:mm a')}
                          </p>
                        )}
                        {s.key === 'completed' && data.checkout_at && (
                          <p className="text-xs text-muted-foreground">
                            Completed {format(new Date(data.checkout_at), 'dd MMM, hh:mm a')}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Technician card */}
        {data.technician && data.status !== 'completed' && (
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-card">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full gradient-primary text-lg font-bold text-primary-foreground">
                {data.technician.full_name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Your technician
                </p>
                <p className="truncate font-heading font-bold">{data.technician.full_name}</p>
              </div>
              {data.technician.phone && (
                <Button asChild size="sm" className="rounded-full gradient-primary text-primary-foreground">
                  <a href={`tel:${data.technician.phone}`}>
                    <Phone className="mr-1 h-3.5 w-3.5" /> Call
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Service details */}
        <Card className="border-border/70 shadow-card">
          <CardContent className="space-y-3 p-5 text-sm">
            {data.scheduled_date && (
              <Row icon={<Calendar className="h-4 w-4" />} label="Scheduled">
                {format(new Date(data.scheduled_date), 'EEE, dd MMM yyyy')}
                {data.scheduled_time_start && ` · ${data.scheduled_time_start.slice(0, 5)}`}
              </Row>
            )}
            {(data.address || data.city) && (
              <Row icon={<MapPin className="h-4 w-4" />} label="Service address">
                <span>
                  {data.address}
                  {data.address && (data.city || data.pincode) && <br />}
                  {[data.city, data.pincode].filter(Boolean).join(' - ')}
                </span>
              </Row>
            )}
            {data.description && (
              <Row icon={<Sparkles className="h-4 w-4" />} label="Notes">
                {data.description}
              </Row>
            )}
          </CardContent>
        </Card>

        {/* Feedback CTA after completion */}
        {data.status === 'completed' && data.feedback_token && !data.customer_rating && (
          <Card className="border-success/40 bg-gradient-to-br from-success/10 to-transparent shadow-card">
            <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-warning" />
                <div>
                  <p className="font-heading font-bold">How did we do?</p>
                  <p className="text-xs text-muted-foreground">It takes just 30 seconds.</p>
                </div>
              </div>
              <Button
                asChild
                className="rounded-full bg-success text-success-foreground hover:bg-success/90"
              >
                <a href={`/feedback/${data.feedback_token}`}>Rate your service</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Already-rated indicator */}
        {data.customer_rating && (
          <Card className="border-success/40 shadow-card">
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <ShieldCheck className="h-5 w-5 text-success" />
              <p>
                Thanks for rating us {data.customer_rating}/5
                {data.customer_feedback && ` — "${data.customer_feedback}"`}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Service history */}
        {data.history && data.history.length > 0 && (
          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-3 p-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Your service history
              </p>
              <ul className="divide-y divide-border/60">
                {data.history.map(h => (
                  <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.service_type ?? '—'}{h.checkout_at && ` · ${format(new Date(h.checkout_at), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">{h.status.replace('_', ' ')}</Badge>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          Powered by <span className="font-semibold gradient-text">{data.business?.business_name ?? 'FieldForce'}</span>
        </p>
      </main>
    </div>
  );
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="text-foreground">{children}</div>
      </div>
    </div>
  );
}

function FullPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-muted-foreground">
      {children}
    </div>
  );
}