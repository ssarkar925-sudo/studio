
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
import { productsDAO } from '@/lib/data';
import { useEffect, useState } from 'react';

export default function NewInventoryItemPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [fromPurchase, setFromPurchase] = useState(false);

  useEffect(() => {
    // This check needs to be in useEffect to ensure it only runs on the client
    setFromPurchase(new URLSearchParams(window.location.search).has('fromPurchase'));
  }, []);


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const purchasePrice = parseFloat(formData.get('purchasePrice') as string);
    const stock = parseInt(formData.get('stock') as string, 10);

     if (!name || isNaN(purchasePrice)) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please fill out all fields correctly.',
      });
      return;
    }

    if (!fromPurchase && isNaN(stock)) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please provide a stock quantity.',
      });
      return;
    }

    const newProductData = {
      name,
      purchasePrice,
      sellingPrice: purchasePrice * 1.5, // 50% markup
      stock: fromPurchase ? 0 : stock,
      sku: `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`.toUpperCase(),
      batchCode: `BCH-${Date.now()}`.toUpperCase(),
    };

    const newProduct = productsDAO.add(newProductData);
    
    if (fromPurchase) {
      // Store new product info in session storage and go back
      sessionStorage.setItem('newProduct', JSON.stringify(newProduct));
      router.back();
    } else {
       toast({
        title: 'Item Created',
        description: `Successfully created item: ${name}.`,
      });
      router.push('/inventory');
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">New Inventory Item</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Fill out the form to add a new item to your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" placeholder="e.g. Web Design Service" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" placeholder="0.00" required step="0.01" />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="stock">Initial Stock</Label>
                        <Input id="stock" name="stock" type="number" placeholder="0" required={!fromPurchase} disabled={fromPurchase} defaultValue={fromPurchase ? 0 : undefined} />
                    </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit">Save Item</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
