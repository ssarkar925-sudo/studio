
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Product } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

interface TagScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (product: Product) => void;
  products: Product[];
}

export function TagScanner({ open, onOpenChange, onScan, products }: TagScannerProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scannedSku, setScannedSku] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());
  const controlsRef = useRef<any>(null); // To store controls from the decoder

  const startScanner = useCallback(async () => {
    if (!videoRef.current || !hasCameraPermission) return;

    try {
       const newControls = await codeReader.current.decodeFromVideoElement(videoRef.current, (result, err) => {
        if (result) {
            const sku = result.getText();
            const foundProduct = products.find(p => p.sku.toLowerCase() === sku.toLowerCase());
            if (foundProduct) {
              toast({
                title: 'Item Scanned',
                description: `${foundProduct.name} found.`,
              });
              onScan(foundProduct);
            }
        }
         if (err && !(err instanceof NotFoundException)) {
            console.error("Decoding error:", err);
        }
      });
      controlsRef.current = newControls;
    } catch(err) {
        console.error("Failed to start scanner:", err);
    }
  }, [hasCameraPermission, onScan, products, toast]);


  useEffect(() => {
    const getCameraPermissionAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setHasCameraPermission(true);
            // `startScanner` will be called by `onCanPlay` event on video element
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    };
    
    if (open) {
        getCameraPermissionAndStart();
    } else {
        if (controlsRef.current) {
            controlsRef.current.stop();
        }
    }

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
      }
    };
  }, [open, toast]);

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
            description: `No product found with SKU ending in: ${scannedSku}`,
        });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
      if (!isOpen) {
          setScannedSku('');
      }
      onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Scan Item Tag</DialogTitle>
        </DialogHeader>
        <div className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted onCanPlay={startScanner} />
           <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/2 border-4 border-dashed border-white/50 rounded-lg" />
            </div>
          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
                 <Alert variant="destructive" className="m-4">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
            </div>
          )}
        </div>
        <div className='p-4 bg-muted rounded-md'>
            <Label htmlFor='sku-manual-scan' className='text-sm font-medium'>Or Enter last 5 digits of SKU</Label>
            <div className='flex gap-2 mt-2'>
                <Input 
                    id='sku-manual-scan'
                    placeholder='e.g. 12345'
                    value={scannedSku}
                    onChange={(e) => setScannedSku(e.target.value)}
                     onKeyDown={(e) => {
                        if(e.key === 'Enter') {
                            handleManualScan();
                        }
                    }}
                />
                 <Button type="button" onClick={handleManualScan}>
                    Find
                </Button>
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
