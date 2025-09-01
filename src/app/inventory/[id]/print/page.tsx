
'use client';

import { PrintLayout } from '@/app/print-layout';
import { productsDAO, type Product } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';


export default function PrintProductPage() {
  const params = useParams();
  const productId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: products, isLoading } = useFirestoreData(productsDAO);
  const [product, setProduct] = useState<Product | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && products.length > 0) {
      const foundProduct = products.find((p) => p.id === productId);
      setProduct(foundProduct || null);
    }
  }, [productId, products, isLoading]);

  useEffect(() => {
    if (product && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [product, isLoading]);

  if (isLoading || !product) {
    return <div>Loading...</div>;
  }

  return (
    <PrintLayout>
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
    </PrintLayout>
  );
}
