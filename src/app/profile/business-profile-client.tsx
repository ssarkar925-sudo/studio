
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { businessProfileDAO, type BusinessProfile } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export function BusinessProfileClient() {
  const { toast } = useToast();
  const { data: profiles, isLoading } = useFirestoreData(businessProfileDAO);

  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && profiles.length > 0) {
      const currentProfile = profiles[0];
      setProfile(currentProfile);
      setCompanyName(currentProfile.companyName);
      setContactPerson(currentProfile.contactPerson || '');
      setContactNumber(currentProfile.contactNumber || '');
      setAddress(currentProfile.address || '');
    }
  }, [profiles, isLoading]);

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
    const updatedProfileData = {
      companyName,
      contactPerson,
      contactNumber,
      address,
    };

    try {
      if (profile) {
        await businessProfileDAO.update(profile.id, updatedProfileData);
      } else {
        await businessProfileDAO.add(updatedProfileData);
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
            <div className="grid gap-3">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
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
