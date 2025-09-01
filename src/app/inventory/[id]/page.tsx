
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
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: products, isLoading } = useFirestoreData(productsDAO);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const productId = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundProduct = products.find((p) => p.id === productId);
      if (foundProduct) {
        setProduct(foundProduct);
      }
    }
  }, [params.id, products, isLoading]);

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
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">Item Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>
                    Detailed information about the inventory item.
                    </CardDescription>
                </div>
                {product.stock <= 10 ? (
                    <Badge variant="destructive" className="shrink-0">Low Stock</Badge>
                ) : (
                    <Badge variant="default" className="shrink-0">In Stock</Badge>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
