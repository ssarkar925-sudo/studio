
'use client';

import { PrintLayout } from '@/app/print-layout';
import { vendorsDAO, type Vendor } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PrintVendorPage() {
  const params = useParams();
  const vendorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data: vendors, isLoading } = useFirestoreData(vendorsDAO);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const printTriggered = useRef(false);

  useEffect(() => {
    if (!isLoading && vendors.length > 0) {
      const foundVendor = vendors.find((v) => v.id === vendorId);
      setVendor(foundVendor || null);
    }
  }, [vendorId, vendors, isLoading]);

  useEffect(() => {
    if (vendor && !isLoading && !printTriggered.current) {
        printTriggered.current = true;
        window.print();
    }
  }, [vendor, isLoading]);

  if (isLoading || !vendor) {
    return <div>Loading...</div>;
  }

  return (
    <PrintLayout>
       <Card>
          <CardHeader>
            <CardTitle>{vendor.vendorName}</CardTitle>
            <CardDescription>
              {vendor.email || 'No email provided'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
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
    </PrintLayout>
  );
}
