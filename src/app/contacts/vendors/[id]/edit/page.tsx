
'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { vendorsDAO, type Vendor } from '@/lib/data';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function EditVendorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const vendorId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: vendors, isLoading } = useFirestoreData(vendorsDAO);
  const [vendor, setVendor] = useState<Vendor | null>(null);

  // Form state
  const [vendorName, setVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [gstn, setGstn] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (!isLoading && vendors.length > 0) {
        const foundVendor = vendors.find((v) => v.id === vendorId);
        if (foundVendor) {
            setVendor(foundVendor);
            setVendorName(foundVendor.vendorName);
            setContactPerson(foundVendor.contactPerson || '');
            setContactNumber(foundVendor.contactNumber || '');
            setEmail(foundVendor.email || '');
            setGstn(foundVendor.gstn || '');
            setAddress(foundVendor.address || '');
        } else {
            toast({
                variant: 'destructive',
                title: 'Vendor not found',
            });
            router.push('/contacts?tab=vendors');
        }
    }
  }, [vendorId, vendors, isLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vendor || isSaving) return;


    if (!vendorName) {
       toast({
        variant: 'destructive',
        title: 'Missing Required Fields',
        description: 'Please enter a name for the vendor.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await vendorsDAO.update(vendor.id, {
        vendorName,
        contactPerson,
        contactNumber,
        email,
        gstn,
        address,
      });
      
      toast({
        title: 'Vendor Updated',
        description: `Successfully updated vendor: ${vendorName}.`,
      });
      router.push('/contacts?tab=vendors');
    } catch (error) {
      console.error("Update failed:", error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update vendor.',
      });
      setIsSaving(false);
    }
  };

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
        <h1 className="text-2xl font-semibold">Edit Vendor</h1>
      </div>
      <div className="mx-auto grid w-full max-w-2xl items-start gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Vendor Details</CardTitle>
              <CardDescription>
                Update the vendor's information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="vendorName">Vendor Name</Label>
                  <Input id="vendorName" name="vendorName" type="text" className="w-full" value={vendorName} onChange={e=>setVendorName(e.target.value)} required />
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" name="contactPerson" type="text" className="w-full" value={contactPerson} onChange={e=>setContactPerson(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="contactNumber">Contact Number</Label>
                  <Input id="contactNumber" name="contactNumber" type="tel" className="w-full" value={contactNumber} onChange={e=>setContactNumber(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" className="w-full" value={email} onChange={e=>setEmail(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="gstn">GSTN</Label>
                  <Input id="gstn" name="gstn" type="text" className="w-full" value={gstn} onChange={e=>setGstn(e.target.value)} />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => router.push('/contacts?tab=vendors')} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
