
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { vendorsDAO, type Vendor } from '@/lib/data';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function VendorDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: vendors, isLoading } = useFirestoreData(vendorsDAO);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!isLoading) {
      const vendorId = Array.isArray(params.id) ? params.id[0] : params.id;
      const foundVendor = vendors.find((v) => v.id === vendorId);
      if (foundVendor) {
        setVendor(foundVendor);
      }
    }
  }, [params.id, vendors, isLoading]);

  if (isLoading || !vendor) {
    return (
        <AppLayout>
            <div className="mx-auto grid w-full max-w-2xl gap-2">
                <h1 className="text-2xl font-semibold">Loading...</h1>
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-2xl gap-2">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-xl md:text-2xl font-semibold">Vendor Details</h1>
        </div>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{vendor.vendorName}</CardTitle>
            <CardDescription>
              {vendor.email || 'No email provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                    <p>{vendor.contactPerson || 'N/A'}</p>
                </div>
                 <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                    <p>{vendor.contactNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 mt-6">
                <div className="grid gap-3">
                    <p className="text-sm font-medium text-muted-foreground">GSTN</p>
                    <p>{vendor.gstn || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
