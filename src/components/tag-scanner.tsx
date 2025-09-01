
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

  const handleSimulateScan = () => {
    if (products.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Products',
        description: 'There are no products in the inventory to scan.',
      });
      return;
    }
    // Simulate finding a random product
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    toast({
        title: 'Item Scanned',
        description: `Added ${randomProduct.name} to the invoice.`,
    });
    onScan(randomProduct);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
        <DialogFooter>
          <Button type="button" onClick={handleSimulateScan} disabled={!hasCameraPermission}>
            Simulate Scan
          </Button>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
