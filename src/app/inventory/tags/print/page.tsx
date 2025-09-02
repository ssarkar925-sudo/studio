
'use client';

import { productsDAO, type Product } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer as PrintIcon } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'react-qr-code';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function QRCodeTag({ product, size }: { product: Product; size: 'a4' | 'thermal' }) {
  return (
    <div
      className={cn(
        "p-2 border border-dashed border-black break-inside-avoid-page flex flex-col items-center justify-between text-center bg-white",
        size === 'a4' && "w-[130px] h-[130px]",
        size === 'thermal' && "w-[190px] p-1" // ~50mm width for 2-inch thermal paper
      )}
    >
      <div className="text-center">
        <p className={cn("font-bold break-words", size === 'a4' ? 'text-sm' : 'text-xs')}>{product.name}</p>
        <p className={cn("break-all", size === 'a4' ? 'text-xs' : 'text-[10px]')}>SKU: {product.sku}</p>
         <p className={cn("break-all", size === 'a4' ? 'text-xs' : 'text-[10px]')}>{product.batchCode}</p>
      </div>
      <div className='w-full p-1 mt-1 bg-white flex justify-center'>
        <QRCode 
          value={product.sku} 
          size={size === 'a4' ? 64 : 64}
          viewBox={`0 0 ${size === 'a4' ? 64 : 64} ${size === 'a4' ? 64 : 64}`}
          className="w-full h-auto max-w-[64px] max-h-[64px]"
        />
      </div>
    </div>
  );
}


function PrintPageContent() {
  const searchParams = useSearchParams();
  const { data: allProducts, isLoading } = useFirestoreData(productsDAO);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [paperSize, setPaperSize] = useState<'a4' | 'thermal'>('a4');
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
        backgroundColor: null, // Use transparent background
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save('qrcode-tags.pdf');
    setIsDownloading(false);
  };
  
  const handlePrint = () => {
      window.print();
  }

  if (isLoading) {
    return <div className="p-8">Loading Tags...</div>;
  }

  if (selectedProducts.length === 0) {
      return <div className="p-8">No products selected or found.</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-8 print:bg-white print:p-0">
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 print:hidden">
                <h1 className="text-2xl font-bold">QR Code Tags</h1>
                 <div className="flex items-center gap-4">
                    <div className="grid gap-1.5">
                      <Label htmlFor="paper-size">Paper Size</Label>
                      <Select value={paperSize} onValueChange={(value) => setPaperSize(value as 'a4' | 'thermal')}>
                        <SelectTrigger id="paper-size" className="w-[180px]">
                            <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="a4">A4 / Letter</SelectItem>
                            <SelectItem value="thermal">2-inch Thermal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 self-end">
                        <Button onClick={handlePrint}>
                            <PrintIcon className="mr-2 h-4 w-4" />
                            Print
                        </Button>
                        <Button onClick={handleDownload} disabled={isDownloading}>
                            <Download className="mr-2 h-4 w-4" />
                            {isDownloading ? 'Downloading...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>
            </div>
            <div ref={tagsContainerRef} className="p-4 bg-white rounded-lg shadow-lg print:shadow-none print:p-0">
                <div className={cn(
                    "flex flex-wrap justify-center gap-2",
                    paperSize === 'thermal' && "flex-col items-center"
                )}>
                    {selectedProducts.map((product) => (
                        <QRCodeTag key={product.id} product={product} size={paperSize} />
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
