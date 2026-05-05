import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, AlertTriangle, Minus } from 'lucide-react';
import { toast } from 'sonner';

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async (fd: FormData) => {
      const { error } = await supabase.from('inventory_items').insert({
        name: fd.get('name') as string,
        sku: (fd.get('sku') as string) || null,
        unit_price: parseFloat(fd.get('unit_price') as string) || 0,
        stock: parseFloat(fd.get('stock') as string) || 0,
        low_stock_threshold: parseFloat(fd.get('low_stock_threshold') as string) || 5,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inventory'] }); setOpen(false); toast.success('Item added'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: async ({ id, delta, current }: { id: string; delta: number; current: number }) => {
      const { error } = await supabase.from('inventory_items').update({ stock: current + delta }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const lowCount = items.filter((i: any) => i.stock <= i.low_stock_threshold).length;

  return (
    <DashboardLayout
      title="Inventory"
      subtitle={lowCount ? `${lowCount} item(s) low on stock` : 'Track parts and consumables'}
      action={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" /> New Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Add Inventory Item</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); create.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>SKU</Label><Input name="sku" /></div>
                <div className="space-y-2"><Label>Unit price (₹)</Label><Input name="unit_price" type="number" step="0.01" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Stock</Label><Input name="stock" type="number" step="0.01" defaultValue={0} /></div>
                <div className="space-y-2"><Label>Low stock alert</Label><Input name="low_stock_threshold" type="number" step="0.01" defaultValue={5} /></div>
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={create.isPending}>
                {create.isPending ? 'Saving...' : 'Add item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-3">
        {items.length === 0 ? (
          <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
            No inventory items yet.
          </CardContent></Card>
        ) : items.map((it: any) => {
          const low = it.stock <= it.low_stock_threshold;
          return (
            <Card key={it.id} className="border-border/70 shadow-card">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${low ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {low ? <AlertTriangle className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold">{it.name}</p>
                      {low && <Badge variant="destructive">Low</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {it.sku && <>SKU {it.sku} · </>}₹{Number(it.unit_price).toLocaleString('en-IN')}/unit · alert at {it.low_stock_threshold}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust.mutate({ id: it.id, delta: -1, current: Number(it.stock) })}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-12 text-center font-heading text-lg font-bold">{Number(it.stock)}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => adjust.mutate({ id: it.id, delta: 1, current: Number(it.stock) })}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}