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
import { Plus, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createCustomer = useMutation({
    mutationFn: async (formData: FormData) => {
      const { error } = await supabase.from('customers').insert({
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: formData.get('email') as string || null,
        address: formData.get('address') as string || null,
        city: formData.get('city') as string || null,
        pincode: formData.get('pincode') as string || null,
        gst_number: formData.get('gst_number') as string || null,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setOpen(false);
      toast.success('Customer added');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <DashboardLayout
      title="Customers"
      subtitle="Manage your customer directory"
      action={
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full gradient-primary text-primary-foreground shadow-glow gap-2"><Plus className="h-4 w-4" /> Add Customer</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">Add Customer</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createCustomer.mutate(new FormData(e.currentTarget)); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name</Label><Input name="name" required /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input name="phone" required placeholder="+91..." /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" /></div>
                <div className="space-y-2"><Label>Address</Label><Input name="address" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>City</Label><Input name="city" /></div>
                  <div className="space-y-2"><Label>Pincode</Label><Input name="pincode" /></div>
                </div>
                <div className="space-y-2"><Label>GST Number</Label><Input name="gst_number" /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={createCustomer.isPending}>
                  {createCustomer.isPending ? 'Adding...' : 'Add Customer'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.length === 0 ? (
            <Card className="col-span-full shadow-card">
              <CardContent className="py-12 text-center text-muted-foreground">No customers yet.</CardContent>
            </Card>
          ) : (
            customers.map(c => (
              <Card key={c.id} className="shadow-card hover:shadow-card-hover transition-shadow animate-fade-in">
                <CardContent className="p-4 space-y-2">
                  <p className="font-heading font-semibold text-lg">{c.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</p>
                  {c.city && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}{c.pincode ? ` - ${c.pincode}` : ''}</p>}
                  {c.gst_number && <p className="text-xs text-muted-foreground">GST: {c.gst_number}</p>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
