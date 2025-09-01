
'use client';

import { productsDAO, type Product } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function BarcodeTag({ product }: { product: Product }) {
  return (
    <div className="p-4 border border-black break-inside-avoid-page flex flex-col items-center justify-center text-center w-[220px] bg-white">
      <p className="font-bold text-lg truncate w-full">{product.name}</p>
      <p className="text-md mb-2">SKU: {product.sku}</p>
      <div className="h-[50px] w-full flex items-center justify-center bg-gray-200 text-gray-500 rounded-md">
        <p className="text-sm">Barcode Placeholder</p>
      </div>
    </div>
  );
}


function PrintPageContent() {
  const searchParams = useSearchParams();
  const { data: allProducts, isLoading } = useFirestoreData(productsDAO);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    if (!tagsContainerRef.current || isDownloading) return;

    setIsDownloading(true);
    const canvas = await html2canvas(tagsContainerRef.current, {
        scale: 2, // Higher scale for better quality
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('barcode-tags.pdf');
    setIsDownloading(false);
  };

  if (isLoading) {
    return <div className="p-8">Loading Tags...</div>;
  }

  if (selectedProducts.length === 0) {
      return <div className="p-8">No products selected or found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Download Barcode Tags</h1>
                <Button onClick={handleDownload} disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
            </div>
            <div ref={tagsContainerRef} className="p-4 bg-white rounded-lg shadow-lg">
                <div className="flex flex-wrap justify-center gap-2">
                    {selectedProducts.map((product) => (
                        <BarcodeTag key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}


export default function DownloadBarcodeTagsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading Tags...</div>}>
            <PrintPageContent />
        </Suspense>
    )
}
