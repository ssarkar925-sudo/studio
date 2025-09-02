
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
import { Camera, Loader2 } from 'lucide-react';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const stopScanner = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    if (open) {
      getCameraPermission();
    } else {
      stopScanner();
    }

    return () => {
       if (!open) {
          stopScanner();
       }
    };
  }, [open, stopScanner]);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        variant: 'destructive',
        title: 'Scanner not ready',
        description: 'The video feed is not available to capture an image.',
      });
      return;
    }
    setIsScanning(true);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageDataUrl = canvas.toDataURL('image/png');
    const codeReader = new BrowserMultiFormatReader();

    try {
      const result = await codeReader.decodeFromImageUrl(imageDataUrl);
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
    } catch (err) {
       if (err instanceof NotFoundException) {
          toast({
            variant: 'destructive',
            title: 'Barcode Not Found',
            description: 'Could not detect a barcode in the captured image. Please try again.',
          });
       } else {
          console.error('Scan Error:', err);
          toast({
            variant: 'destructive',
            title: 'Scan Error',
            description: 'An unexpected error occurred during the scan.',
          });
       }
    } finally {
      setIsScanning(false);
    }
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
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
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
             {hasCameraPermission === null && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="text-white">Requesting camera access...</p>
                </div>
             )}
          </div>

          <Button onClick={handleCapture} disabled={!hasCameraPermission || isScanning} className="w-full">
            {isScanning ? (
              <Loader2 className="mr-2 animate-spin" />
            ) : (
              <Camera className="mr-2" />
            )}
            Capture Barcode
          </Button>

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
