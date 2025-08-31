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
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              Detailed information about the inventory item.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p>₹{product.price.toFixed(2)}</p>
                </div>
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Stock</p>
                    <p>{product.stock}</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
