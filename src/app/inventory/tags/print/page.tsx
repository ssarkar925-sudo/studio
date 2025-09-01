
'use client';

import { PrintLayout } from '@/app/print-layout';
import { productsDAO, type Product } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Barcode from 'react-barcode';

function BarcodeTag({ product }: { product: Product }) {
  return (
    <div className="p-4 border border-dashed border-gray-400 break-inside-avoid-page flex flex-col items-center justify-center text-center">
      <p className="font-semibold text-lg">{product.name}</p>
      <p className="text-sm mb-2">SKU: {product.sku}</p>
      <Barcode 
        value={product.sku} 
        height={50}
        width={2}
        fontSize={16}
      />
    </div>
  );
}

export default function PrintBarcodeTagsPage() {
  const searchParams = useSearchParams();
  const { data: allProducts, isLoading } = useFirestoreData(productsDAO);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && allProducts.length > 0) {
      const idsParam = searchParams.get('ids');
      if (idsParam) {
        const ids = idsParam.split(',');
        const foundProducts = allProducts.filter((p) => ids.includes(p.id));
        setSelectedProducts(foundProducts);
      }
    }
  }, [searchParams, allProducts, isLoading]);

  useEffect(() => {
    if (selectedProducts.length > 0 && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [selectedProducts, isLoading]);

  if (isLoading || selectedProducts.length === 0) {
    return <div>Loading Tags...</div>;
  }

  return (
    <PrintLayout>
        <div className="grid grid-cols-2 gap-4">
            {selectedProducts.map((product) => (
                <BarcodeTag key={product.id} product={product} />
            ))}
      </div>
    </PrintLayout>
  );
}
