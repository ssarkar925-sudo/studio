
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { productsDAO, type Product } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const productId = Array.isArray(params.id) ? params.id[0] : params.id;
    const products = productsDAO.load();
    const foundProduct = products.find((p) => p.id === productId);
    if (foundProduct) {
      setProduct(foundProduct);
    }
  }, [params.id]);

  if (!product) {
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
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-semibold">Item Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
             <div className="flex justify-between items-start">
                <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                    Detailed information about the inventory item.
                    </CardDescription>
                </div>
                {product.stock <= 10 ? (
                    <Badge variant="destructive">Low Stock</Badge>
                ) : (
                    <Badge variant="default">In Stock</Badge>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">SKU</p>
                    <p>{product.sku}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Batch Code</p>
                    <p>{product.batchCode}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Stock</p>
                    <p>{product.stock}</p>
                </div>
                <div className="grid gap-3">
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                    <p>₹{product.purchasePrice.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Selling Price</p>
                    <p className='font-semibold'>₹{product.sellingPrice.toFixed(2)}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
