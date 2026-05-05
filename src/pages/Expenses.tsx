import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Wallet, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth } from 'date-fns';

const CATEGORIES = ['fuel', 'parts', 'tools', 'salary', 'rent', 'utilities', 'marketing', 'general'];

export default function Expenses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, jobs(title)')
        .order('spent_on', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (fd: FormData) => {
      const { error } = await supabase.from('expenses').insert({
        category: fd.get('category') as string,
        description: (fd.get('description') as string) || null,
        amount: parseFloat(fd.get('amount') as string) || 0,
        spent_on: fd.get('spent_on') as string,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); setOpen(false); toast.success('Expense added'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const monthStart = startOfMonth(new Date());
  const monthTotal = expenses
    .filter((e: any) => new Date(e.spent_on) >= monthStart)
    .reduce((s: number, e: any) => s + Number(e.amount), 0);

  return (
    <DashboardLayout
      title="Expenses"
      subtitle={`This month: ₹${monthTotal.toLocaleString('en-IN')}`}
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" /> New Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Expense</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select name="category" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/^./, l => l.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Input name="description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Amount (₹)</Label><Input name="amount" type="number" step="0.01" required /></div>
                <div className="space-y-2"><Label>Date</Label><Input name="spent_on" type="date" defaultValue={format(new Date(), 'yyyy-MM-dd')} required /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={create.isPending}>
                {create.isPending ? 'Saving...' : 'Add expense'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
            No expenses logged yet.
          </CardContent></Card>
        ) : expenses.map((e: any) => (
          <Card key={e.id} className="border-border/70 shadow-card">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-heading font-semibold capitalize">{e.category}{e.description ? ` — ${e.description}` : ''}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(e.spent_on), 'dd MMM yyyy')}
                    {e.jobs?.title && <> · Job: {e.jobs.title}</>}
                  </p>
                </div>
              </div>
              <p className="font-heading text-lg font-bold flex items-center"><IndianRupee className="h-4 w-4" />{Number(e.amount).toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}