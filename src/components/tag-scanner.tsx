
'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Upload } from 'lucide-react';

interface TagScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (product: Product) => void;
  products: Product[];
}

export function TagScanner({ open, onOpenChange, onScan, products }: TagScannerProps) {
  const { toast } = useToast();
  const [scannedSku, setScannedSku] = useState('');
  const [isDecoding, setIsDecoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReader = new BrowserMultiFormatReader();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsDecoding(true);
    toast({
        title: 'Decoding Image...',
        description: 'Please wait while the barcode is being processed.',
    });

    try {
        const imageUrl = URL.createObjectURL(file);
        const result = await codeReader.decodeFromImageUrl(imageUrl);
        const sku = result.getText();
        const foundProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());

        if (foundProduct) {
            toast({
                title: 'Item Found',
                description: `${foundProduct.name} details displayed.`,
            });
            onScan(foundProduct);
        } else {
            toast({
                variant: 'destructive',
                title: 'Product Not Found',
                description: `No product found with SKU: ${sku}`,
            });
        }
    } catch (error) {
        if (error instanceof NotFoundException) {
            toast({ variant: 'destructive', title: 'Scan Failed', description: 'No barcode was found in the image.' });
        } else {
            console.error("Decoding error:", error);
            toast({ variant: 'destructive', title: 'Scan Error', description: 'Could not decode the barcode from the image.' });
        }
    } finally {
        setIsDecoding(false);
        // Reset file input to allow scanning the same file again
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleManualScan = () => {
    if (!scannedSku) {
      toast({
        variant: 'destructive',
        title: 'No SKU Entered',
        description: 'Please enter an SKU to find a product.',
      });
      return;
    }

    const foundProduct = products.find(p => p.sku.toLowerCase().endsWith(scannedSku.toLowerCase()));

    if (foundProduct) {
      toast({
        title: 'Item Found',
        description: `${foundProduct.name} details displayed.`,
      });
      onScan(foundProduct);
      setScannedSku('');
    } else {
      toast({
        variant: 'destructive',
        title: 'Product Not Found',
        description: `No product found with an SKU ending in: ${scannedSku}`,
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setScannedSku('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Find Item</DialogTitle>
        </DialogHeader>
        <div className='p-4 bg-muted rounded-md space-y-4'>
            <div>
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                 <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isDecoding}>
                    <Upload className="mr-2" />
                    {isDecoding ? 'Processing...' : 'Upload Barcode Image'}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">Take a picture of a barcode to scan it.</p>
            </div>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-muted px-2 text-muted-foreground">
                    Or
                    </span>
                </div>
            </div>
            <div>
                <Label htmlFor='sku-manual-scan' className='text-sm font-medium'>Enter last 5 digits of SKU</Label>
                <div className='flex gap-2 mt-2'>
                    <Input
                    id='sku-manual-scan'
                    placeholder='e.g. 12345'
                    value={scannedSku}
                    onChange={(e) => setScannedSku(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                        handleManualScan();
                        }
                    }}
                    />
                    <Button type="button" onClick={handleManualScan}>
                    Find
                    </Button>
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
