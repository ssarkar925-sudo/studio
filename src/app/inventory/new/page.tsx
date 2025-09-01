
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { productsDAO, purchasesDAO } from '@/lib/data';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

export default function NewInventoryItemPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if(isSaving || !user) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const stock = parseInt(formData.get('stock') as string, 10);

     if (!name || isNaN(purchasePrice) || isNaN(stock)) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please fill out all fields correctly.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await purchasesDAO.add({
          userId: user.uid,
          vendorName: 'N/A (Manual Entry)',
          vendorId: 'manual',
          orderDate: format(new Date(), 'dd/MM/yyyy'),
          items: [{
              productId: `new_${Date.now()}`,
              productName: name,
              quantity: stock,
              purchasePrice: purchasePrice,
              total: stock * purchasePrice,
              isNew: true,
          }],
          totalAmount: stock * purchasePrice,
          paymentDone: 0,
          dueAmount: stock * purchasePrice,
          status: 'Pending',
          gst: 0,
          deliveryCharges: 0,
      });

      toast({
          title: 'Purchase Entry Created',
          description: `A pending purchase for "${name}" has been created. Receive it in the "Purchases" tab to add it to stock.`,
      });
      router.push('/inventory?tab=purchases');
    } catch (error) {
       console.error("Creation failed", error);
       toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: 'Could not create purchase entry.',
      });
       setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">New Stock Entry</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Create a pending purchase order to add new stock. The item will be added to inventory after you mark it as &quot;Received&quot; in the purchases tab.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" placeholder="e.g. T-Shirt (Large)" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="purchasePrice">Purchase Price (per unit)</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" placeholder="0.00" required step="0.01" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="stock">Quantity</Label>
                        <Input id="stock" name="stock" type="number" placeholder="0" required />
                    </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/inventory')} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Purchase Entry
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
