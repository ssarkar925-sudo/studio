
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
import { useRouter, useParams } from 'next/navigation';
import { productsDAO, type Product } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: products, isLoading } = useFirestoreData(productsDAO);
  const [product, setProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [sku, setSku] = useState('');
  const [batchCode, setBatchCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (!isLoading && products.length > 0) {
        const foundProduct = products.find((p) => p.id === productId);
        if (foundProduct) {
            setProduct(foundProduct);
            setName(foundProduct.name);
            setPurchasePrice(foundProduct.purchasePrice);
            setSellingPrice(foundProduct.sellingPrice);
            setStock(foundProduct.stock);
            setSku(foundProduct.sku);
            setBatchCode(foundProduct.batchCode);
        } else {
            toast({
                variant: 'destructive',
                title: 'Product not found',
            });
            router.push('/inventory');
        }
    }
  }, [productId, products, isLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!product || isSaving) return;

    if (!name || isNaN(purchasePrice) || isNaN(sellingPrice) || isNaN(stock) || !sku || !batchCode) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please fill out all fields correctly.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await productsDAO.update(product.id, {
        name,
        purchasePrice,
        sellingPrice,
        stock,
        sku,
        batchCode,
      });
      
      toast({
        title: 'Item Updated',
        description: `Successfully updated item: ${name}.`,
      });
      router.push('/inventory');
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update item.',
      });
      setIsSaving(false);
    }
  };

  if (isLoading || !product) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <h1 className="text-2xl font-semibold">Edit Inventory Item</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
              <CardDescription>
                Update the item's information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" type="text" className="w-full" value={name} onChange={e=>setName(e.target.value)} required />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" value={purchasePrice} onChange={e=>setPurchasePrice(parseFloat(e.target.value))} required />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="sellingPrice">Selling Price</Label>
                        <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" value={sellingPrice} onChange={e=>setSellingPrice(parseFloat(e.target.value))} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="grid gap-3">
                        <Label htmlFor="stock">Stock</Label>
                        <Input id="stock" name="stock" type="number" value={stock} onChange={e=>setStock(parseInt(e.target.value))} required />
                    </div>
                    <div className="grid gap-3">
                        <Label htmlFor="sku">SKU</Label>
                        <Input id="sku" name="sku" type="text" value={sku} onChange={e=>setSku(e.target.value)} required />
                    </div>
                     <div className="grid gap-3">
                        <Label htmlFor="batchCode">Batch Code</Label>
                        <Input id="batchCode" name="batchCode" type="text" value={batchCode} onChange={e=>setBatchCode(e.target.value)} required />
                    </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/inventory')} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
