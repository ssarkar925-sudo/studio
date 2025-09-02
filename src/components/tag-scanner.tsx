
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
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

interface TagScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (product: Product) => void;
  products: Product[];
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
};

export function TagScanner({ open, onOpenChange, onScan, products }: TagScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [scannedSku, setScannedSku] = useState('');

  const handleUserMedia = () => {
    setHasCameraPermission(true);
  };

  const handleUserMediaError = (error: any) => {
    console.error('Error accessing camera:', error);
    setHasCameraPermission(false);
    toast({
      variant: 'destructive',
      title: 'Camera Access Denied',
      description:
        'Please enable camera permissions in your browser settings.',
    });
  };
  
  const handleManualScan = () => {
    if (!scannedSku) {
      toast({
        variant: 'destructive',
        title: 'No SKU Entered',
        description: 'Please enter an SKU to find a product.',
      });
      return;
    }
    
    const foundProduct = products.find(p => p.sku.toLowerCase() === scannedSku.toLowerCase());

    if (foundProduct) {
        toast({
            title: 'Item Found',
            description: `${foundProduct.name} details displayed.`,
        });
        onScan(foundProduct);
        setScannedSku(''); // Clear input after successful scan
    } else {
        toast({
            variant: 'destructive',
            title: 'Product Not Found',
            description: `No product found with SKU: ${scannedSku}`,
        });
    }
  };

  // Close and reset state when dialog closes
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
          <Webcam
            audio={false}
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="h-full w-full object-cover"
          />
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
            <Label htmlFor='sku-manual-scan' className='text-sm font-medium'>Or Enter SKU Manually</Label>
            <div className='flex gap-2 mt-2'>
                <Input 
                    id='sku-manual-scan'
                    placeholder='e.g. SKU-12345'
                    value={scannedSku}
                    onChange={(e) => setScannedSku(e.target.value)}
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
