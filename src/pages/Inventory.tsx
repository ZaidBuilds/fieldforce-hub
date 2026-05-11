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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Package, AlertTriangle, Minus, Send, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Inventory() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState<null | { id: string; name: string; stock: number }>(null);

  const { data: items = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory_items').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: techs = [] } = useQuery({
    queryKey: ['techs-min'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name').eq('is_active', true);
      return data ?? [];
    },
  });

  const { data: techStock = [] } = useQuery({
    queryKey: ['tech-stock'],
    queryFn: async () => {
      const { data } = await supabase.from('technician_stock').select('*');
      return data ?? [];
    },
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['inv-movements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
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
      await supabase.from('inventory_movements').insert({
        item_id: id,
        type: delta > 0 ? 'restock' : 'consume',
        quantity: Math.abs(delta),
        note: 'Manual adjustment',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['inv-movements'] });
    },
  });

  const issue = useMutation({
    mutationFn: async ({ itemId, technicianId, qty, currentStock }: { itemId: string; technicianId: string; qty: number; currentStock: number }) => {
      if (qty <= 0) throw new Error('Quantity must be > 0');
      if (qty > currentStock) throw new Error('Not enough stock');
      // Decrement warehouse stock
      const { error: e1 } = await supabase.from('inventory_items').update({ stock: currentStock - qty }).eq('id', itemId);
      if (e1) throw e1;
      // Increment technician stock (upsert)
      const existing = techStock.find((t: any) => t.item_id === itemId && t.technician_id === technicianId);
      if (existing) {
        const { error } = await supabase
          .from('technician_stock')
          .update({ quantity: Number(existing.quantity) + qty, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('technician_stock').insert({
          technician_id: technicianId, item_id: itemId, quantity: qty,
        });
        if (error) throw error;
      }
      await supabase.from('inventory_movements').insert({
        item_id: itemId, technician_id: technicianId, type: 'issue', quantity: qty, note: 'Issued to technician',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['tech-stock'] });
      qc.invalidateQueries({ queryKey: ['inv-movements'] });
      setIssueOpen(null);
      toast.success('Stock issued to technician');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lowCount = items.filter((i: any) => i.stock <= i.low_stock_threshold).length;
  const itemMap = Object.fromEntries(items.map((i: any) => [i.id, i]));
  const techMap = Object.fromEntries(techs.map((t: any) => [t.user_id, t.full_name]));

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
      <Tabs defaultValue="stock" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock">Warehouse stock</TabsTrigger>
          <TabsTrigger value="techs">Issued to technicians</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="space-y-3">
          {items.length === 0 ? (
            <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
              No inventory items yet.
            </CardContent></Card>
          ) : items.map((it: any) => {
            const low = it.stock <= it.low_stock_threshold;
            return (
              <Card key={it.id} className="border-border/70 shadow-card">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
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
                    <Button size="sm" variant="outline" className="gap-1 ml-2" onClick={() => setIssueOpen({ id: it.id, name: it.name, stock: Number(it.stock) })}>
                      <Send className="h-3.5 w-3.5" /> Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="techs" className="space-y-3">
          {techStock.length === 0 ? (
            <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
              Nothing issued to technicians yet.
            </CardContent></Card>
          ) : techStock.map((t: any) => (
            <Card key={t.id} className="border-border/70 shadow-card">
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-heading font-semibold">{itemMap[t.item_id]?.name ?? 'Item'}</p>
                  <p className="text-xs text-muted-foreground">Held by {techMap[t.technician_id] ?? 'Unknown'}</p>
                </div>
                <Badge className="bg-primary/10 text-primary">{Number(t.quantity)} units</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="movements" className="space-y-2">
          {movements.length === 0 ? (
            <Card className="shadow-card"><CardContent className="py-12 text-center text-muted-foreground">
              No movements yet.
            </CardContent></Card>
          ) : movements.map((m: any) => (
            <Card key={m.id} className="border-border/70 shadow-card">
              <CardContent className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-semibold capitalize">{m.type} · {itemMap[m.item_id]?.name ?? 'Item'}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.technician_id ? `${techMap[m.technician_id] ?? 'Tech'} · ` : ''}{format(new Date(m.created_at), 'dd MMM yyyy, hh:mm a')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">{Number(m.quantity)}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={!!issueOpen} onOpenChange={o => !o && setIssueOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-heading">Issue "{issueOpen?.name}" to technician</DialogTitle></DialogHeader>
          <form
            onSubmit={e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              issue.mutate({
                itemId: issueOpen!.id,
                technicianId: fd.get('technician_id') as string,
                qty: parseFloat(fd.get('qty') as string),
                currentStock: issueOpen!.stock,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Technician</Label>
              <select name="technician_id" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select technician</option>
                {techs.map((t: any) => <option key={t.user_id} value={t.user_id}>{t.full_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity (available: {issueOpen?.stock})</Label>
              <Input name="qty" type="number" step="0.01" min="0.01" max={issueOpen?.stock} required />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={issue.isPending}>
              {issue.isPending ? 'Issuing…' : 'Issue stock'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}