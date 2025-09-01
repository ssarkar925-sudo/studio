
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { businessProfileDAO, type BusinessProfile } from '@/lib/data';
import { Loader2, Upload } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { Icons } from '@/components/icons';

export function BusinessProfileClient() {
  const { toast } = useToast();
  const { data: profiles, isLoading } = useFirestoreData(businessProfileDAO);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && profiles.length > 0) {
      const currentProfile = profiles[0];
      setProfile(currentProfile);
      setCompanyName(currentProfile.companyName || '');
      setContactPerson(currentProfile.contactPerson || '');
      setContactNumber(currentProfile.contactNumber || '');
      setAddress(currentProfile.address || '');
      setLogoUrl(currentProfile.logoUrl || null);
    }
  }, [profiles, isLoading]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real application, you would upload this file to a service like Firebase Storage
    // and get the public URL. For this demo, we'll use a placeholder.
    const reader = new FileReader();
    reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
        toast({
            title: 'Logo Updated',
            description: 'Click "Save Changes" to apply your new logo.',
        })
    };
    reader.readAsDataURL(file);
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    if (!companyName) {
      toast({
        variant: 'destructive',
        title: 'Missing Field',
        description: 'Company Name is required.',
      });
      return;
    }

    setIsSaving(true);
    const updatedProfileData: Partial<BusinessProfile> = {
      companyName,
      contactPerson,
      contactNumber,
      address,
      logoUrl: logoUrl || '',
    };

    try {
      if (profile) {
        await businessProfileDAO.update(profile.id, updatedProfileData);
      } else {
        // We add .id here because the DAO returns the full object with the new ID
        const newProfile = await businessProfileDAO.add(updatedProfileData as Omit<BusinessProfile, 'id'>);
        setProfile(newProfile);
      }
      toast({
        title: 'Profile Saved',
        description: 'Your business profile has been updated.',
      });
    } catch (error) {
      console.error('Failed to save business profile', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your business profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="mt-4 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>This information will appear on your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-4">
                <div className="grid gap-3">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                    />
                </div>
                <div className="grid gap-3 justify-items-center">
                    <Label>Logo</Label>
                     <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                        {logoUrl ? <img src={logoUrl} alt="Company Logo" className="h-full w-full object-cover rounded-full" /> : <Icons.logo className="h-8 w-8 text-muted-foreground" />}
                     </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-3">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Your business address"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
