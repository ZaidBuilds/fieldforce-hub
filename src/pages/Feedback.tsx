import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

type FeedbackJob = {
  id: string;
  title: string;
  customer_rating: number | null;
  customer_feedback: string | null;
  customers: { name: string } | null;
  business?: { business_name: string } | null;
};

export default function Feedback() {
  const { token } = useParams();
  const [job, setJob] = useState<FeedbackJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    (async () => {
      const { data: j } = await supabase
        .from('jobs')
        .select('id, title, customer_rating, customer_feedback, customers(name)')
        .eq('feedback_token', token)
        .maybeSingle();
      const { data: business } = await supabase
        .from('business_settings')
        .select('business_name')
        .limit(1)
        .maybeSingle();
      if (!active) return;
      if (j) {
        setJob({ ...(j as unknown as FeedbackJob), business: business ?? null });
        if (j.customer_rating) setSubmitted(true);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [token]);

  const submit = async () => {
    if (!job || rating === 0) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from('jobs')
      .update({
        customer_rating: rating,
        customer_feedback: comment.trim() || null,
      })
      .eq('id', job.id);
    setSubmitting(false);
    if (error) {
      toast.error('Could not submit feedback. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <FullCenter>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </FullCenter>
    );
  }
  if (!job) {
    return <FullCenter>This feedback link is invalid or has expired.</FullCenter>;
  }

  const business = job.business?.business_name ?? 'FieldForce';

  return (
    <div className="min-h-screen gradient-hero">
      <header className="border-b border-border/60 bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-5 py-3">
          <Logo />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-10">
        {submitted ? (
          <Card className="border-success/40 shadow-card">
            <CardContent className="space-y-4 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                <Heart className="h-8 w-8 text-success" />
              </div>
              <h1 className="font-heading text-2xl font-bold">Thank you!</h1>
              <p className="text-muted-foreground">
                Your feedback helps {business} serve you better. We truly appreciate your time.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/70 shadow-card">
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  How did we do?
                </p>
                <h1 className="mt-1 font-heading text-2xl font-bold">
                  Rate your service{job.customers?.name ? `, ${job.customers.name}` : ''}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Service: <span className="font-semibold text-foreground">{job.title}</span>
                </p>
              </div>

              {/* Stars */}
              <div className="flex items-center justify-center gap-2 py-2">
                {[1, 2, 3, 4, 5].map(n => {
                  const active = (hover || rating) >= n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`h-10 w-10 sm:h-12 sm:w-12 ${
                          active ? 'fill-warning text-warning' : 'text-muted-foreground/40'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm font-semibold text-primary animate-fade-in">
                  {['', 'Very poor 😞', 'Could be better 😕', 'It was okay 🙂', 'Great service! 😀', 'Loved it! 🤩'][rating]}
                </p>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tell us more (optional)
                </label>
                <Textarea
                  rows={4}
                  placeholder="What did you like? What could we improve?"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                />
              </div>

              <Button
                onClick={submit}
                disabled={submitting || rating === 0}
                className="w-full rounded-full gradient-primary text-primary-foreground shadow-glow"
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting…</> : 'Submit feedback'}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="pt-6 text-center text-[11px] text-muted-foreground">
          Powered by <span className="font-semibold gradient-text">{business}</span>
        </p>
      </main>
    </div>
  );
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-muted-foreground">
      {children}
    </div>
  );
}