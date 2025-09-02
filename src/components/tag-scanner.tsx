
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface TagScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (product: Product) => void;
  products: Product[];
}

export function TagScanner({ open, onOpenChange, onScan, products }: TagScannerProps) {
  const { toast } = useToast();
  const [scannedSku, setScannedSku] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef(new BrowserMultiFormatReader());
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const stopScanner = useCallback(() => {
    codeReaderRef.current.reset();
  }, []);

  const startScanner = useCallback(() => {
    if (!open || !videoRef.current || hasCameraPermission === false) return;

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed", e));
          
          codeReaderRef.current.decodeFromVideoElement(videoRef.current, (result, err) => {
            if (result) {
              const sku = result.getText();
              const foundProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());

              if (foundProduct) {
                toast({
                  title: 'Item Found',
                  description: `${foundProduct.name} added.`,
                });
                onScan(foundProduct);
              } else {
                toast({
                  variant: 'destructive',
                  title: 'Product Not Found',
                  description: `No product found with SKU: ${sku}`,
                });
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error(err);
              toast({
                variant: 'destructive',
                title: 'Scan Error',
                description: 'An unexpected error occurred while scanning.',
              });
            }
          });
        }
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        setHasCameraPermission(false);
      });
  }, [open, products, onScan, toast, hasCameraPermission]);

  useEffect(() => {
    if (open) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner]);

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
      setHasCameraPermission(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Scan Item</DialogTitle>
        </DialogHeader>
        <div className='p-4 bg-muted rounded-md space-y-4'>
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Denied</AlertTitle>
                            <AlertDescription>
                                Please enable camera permissions in your browser settings to use the scanner.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
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
