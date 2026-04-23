import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Logo from '@/components/Logo';
import {
  ArrowRight, MapPin, Camera, FileText, Smartphone, MessageCircle,
  IndianRupee, ShieldCheck, Zap, Star, Clock, Users, CheckCircle2,
} from 'lucide-react';
import heroImage from '@/assets/hero-technician.jpg';

const features = [
  { icon: MapPin, title: 'GPS Check-in / Check-out', desc: 'Verify your technician reached the site. Real-time location stamp on every job.' },
  { icon: Camera, title: 'Before / After photos', desc: 'Build customer trust with proof-of-work captured straight from the field.' },
  { icon: IndianRupee, title: 'GST invoices in 1 tap', desc: 'Auto-generated GST invoices with your branding. Cash, UPI, online — all tracked.' },
  { icon: MessageCircle, title: 'WhatsApp updates', desc: 'Customers get job status and invoice on WhatsApp. No app install needed.' },
  { icon: Smartphone, title: 'Built for the field', desc: 'Works offline. Designed mobile-first for technicians on 4G in Tier-2 / Tier-3 India.' },
  { icon: ShieldCheck, title: 'Cash collection control', desc: 'Track every rupee collected. Owner verifies, technician deposits. Zero leakage.' },
];

const stats = [
  { value: '4.8★', label: 'Avg. customer rating' },
  { value: '–32%', label: 'Cash leakage' },
  { value: '+41%', label: 'Jobs / technician' },
  { value: '< 60s', label: 'To create an invoice' },
];

const niches = ['AC & Refrigeration', 'Plumbing', 'Electrical', 'Pest Control', 'Appliance Repair', 'CCTV & Security', 'Solar Install', 'RO / Water Purifier'];

const pricing = [
  {
    name: 'Starter', price: '₹0', tag: 'Forever free',
    desc: 'For solo technicians starting out.',
    features: ['1 technician', 'Up to 30 jobs / month', 'GST invoices', 'WhatsApp share'],
    cta: 'Start free', highlight: false,
  },
  {
    name: 'Business', price: '₹999', tag: 'Per month',
    desc: 'Most popular for growing service teams.',
    features: ['Up to 10 technicians', 'Unlimited jobs', 'GPS check-in & photos', 'Customer feedback', 'Priority support'],
    cta: 'Start 14-day trial', highlight: true,
  },
  {
    name: 'Scale', price: '₹2,499', tag: 'Per month',
    desc: 'For multi-city operations.',
    features: ['Unlimited technicians', 'Multi-branch reports', 'API access', 'Dedicated success manager'],
    cta: 'Talk to sales', highlight: false,
  },
];

const testimonials = [
  {
    quote: 'Pehle saari billing diary mein hoti thi. Ab WhatsApp se invoice jaata hai aur paisa same day account mein.',
    name: 'Rakesh Yadav', role: 'Cool Comfort AC Services, Lucknow',
  },
  {
    quote: 'Technician check-in ne game change kar diya. Ab pata rehta hai kaun kahaan hai, kitna time laga.',
    name: 'Anjali Mehta', role: 'Mehta Plumbing Solutions, Pune',
  },
  {
    quote: 'Customers ko before–after photo bhejne ke baad complaints 60% kam ho gayin.',
    name: 'Imran Sheikh', role: 'Sheikh Electricals, Hyderabad',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">Pricing</a>
            <a href="#niches" className="text-sm font-medium text-muted-foreground hover:text-foreground">Industries</a>
            <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground">Customers</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link to="/app">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full gradient-primary text-primary-foreground shadow-glow">
              <Link to="/app">
                Open dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="container relative grid gap-12 py-16 lg:grid-cols-12 lg:gap-8 lg:py-24">
          <div className="lg:col-span-7 lg:pt-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold shadow-card">
              <span className="flex h-1.5 w-1.5 rounded-full bg-success" />
              Trusted by 1,800+ field service teams across India
            </div>
            <h1 className="mt-6 font-heading text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Run your field service{' '}
              <span className="gradient-text">like the big guys.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              FieldForce is the operating system for Indian repair, install and maintenance businesses. Dispatch jobs, track technicians on GPS, collect payments and send GST invoices on WhatsApp — from one screen.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-full gradient-primary px-7 text-primary-foreground shadow-glow">
                <Link to="/app">
                  Start free — no card needed <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7">
                <a href="#features">See how it works</a>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4">
              {stats.map(s => (
                <div key={s.label}>
                  <p className="font-heading text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-card-hover">
                <img
                  src={heroImage}
                  alt="FieldForce technician on a service call in India"
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-card/95 p-3 shadow-card-hover backdrop-blur">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                    <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Job #2847 completed</p>
                    <p className="text-xs text-muted-foreground">Split AC service • ₹1,450 collected via UPI</p>
                  </div>
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success">+₹1,450</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo strip */}
      <section id="niches" className="border-y border-border bg-secondary/40 py-10">
        <div className="container">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built for these field service businesses
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {niches.map(n => (
              <span key={n} className="text-sm font-semibold text-foreground/70">{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Everything in one app
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Stop losing jobs, cash and customers.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Diary, WhatsApp groups and Excel sheets are killing your margin. FieldForce gives you the same superpowers as Urban Company — for your own brand.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <Card key={f.title} className="group relative overflow-hidden border-border/70 p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-accent text-accent-foreground">
        <div className="container py-20 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="inline-block rounded-full bg-accent-foreground/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                A day with FieldForce
              </span>
              <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Morning to evening,<br />in <span className="text-primary-glow">one flow.</span>
              </h2>
              <p className="mt-4 max-w-md text-lg text-accent-foreground/70">
                From dispatch to deposit — every step is logged, photographed and signed. No more “sir, technician aaya hi nahin.”
              </p>
              <Button asChild size="lg" className="mt-8 rounded-full gradient-primary text-primary-foreground shadow-glow">
                <Link to="/app">Try the live demo <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <ol className="space-y-5">
              {[
                { icon: Clock, title: '8:30 AM — Dispatch', desc: 'Owner assigns the day’s jobs by area. Technicians get instant push notification.' },
                { icon: MapPin, title: '10:15 AM — On-site check-in', desc: 'GPS-verified arrival. Customer gets a “technician arrived” WhatsApp.' },
                { icon: Camera, title: '11:40 AM — Work proof', desc: 'Before & after photos uploaded. Customer signs on phone.' },
                { icon: IndianRupee, title: '12:00 PM — Payment', desc: 'UPI or cash, captured. Owner sees collection in real-time.' },
                { icon: FileText, title: '12:01 PM — GST invoice', desc: 'Auto-generated and sent on WhatsApp. Day done in 90 minutes.' },
              ].map((step, i) => (
                <li key={step.title} className="flex gap-4 rounded-2xl border border-accent-foreground/10 bg-accent-foreground/5 p-5 backdrop-blur">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-glow">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm text-accent-foreground/70">{step.desc}</p>
                  </div>
                  <span className="ml-auto self-start font-heading text-3xl font-extrabold text-accent-foreground/10">
                    0{i + 1}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="container py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            Voices from the field
          </span>
          <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Owners who don’t want to babysit anymore.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {testimonials.map(t => (
            <Card key={t.name} className="flex flex-col gap-5 p-7 shadow-card">
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-base leading-relaxed text-foreground">“{t.quote}”</p>
              <div className="mt-auto flex items-center gap-3 border-t border-border pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-primary-foreground">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-secondary/40">
        <div className="container py-20 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              Pricing
            </span>
            <h2 className="mt-4 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              Honest pricing in rupees.
            </h2>
            <p className="mt-4 text-muted-foreground">No surprise dollar bills. Cancel anytime, keep your data.</p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricing.map(p => (
              <Card key={p.name} className={`relative flex flex-col p-7 shadow-card ${p.highlight ? 'border-primary shadow-glow lg:-translate-y-3' : ''}`}>
                {p.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <p className="font-heading text-lg font-semibold">{p.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-heading text-5xl font-extrabold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.tag}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className={`mt-8 h-11 rounded-full ${p.highlight ? 'gradient-primary text-primary-foreground shadow-glow' : ''}`} variant={p.highlight ? 'default' : 'outline'}>
                  <Link to="/app">{p.cta}</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl gradient-sidebar p-10 text-sidebar-foreground sm:p-16">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent-glow/30 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
                Stop running on diary.<br /> Start running on data.
              </h2>
              <p className="mt-4 max-w-md text-sidebar-foreground/70">
                Set up in under 5 minutes. Onboard your first technician today.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button asChild size="lg" className="h-12 rounded-full gradient-primary px-7 text-primary-foreground shadow-glow">
                <Link to="/app">Open dashboard <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-sidebar-foreground/20 bg-transparent px-7 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">
                <a href="https://wa.me/918000000000" target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-1 h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} FieldForce India. Made in Bengaluru.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}