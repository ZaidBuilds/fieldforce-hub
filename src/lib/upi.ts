export function buildUpiLink(opts: {
  vpa: string;
  name?: string | null;
  amount: number;
  note?: string | null;
}) {
  const params = new URLSearchParams();
  params.set('pa', opts.vpa);
  if (opts.name) params.set('pn', opts.name);
  if (opts.amount > 0) params.set('am', opts.amount.toFixed(2));
  params.set('cu', 'INR');
  if (opts.note) params.set('tn', opts.note);
  return `upi://pay?${params.toString()}`;
}