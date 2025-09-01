
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { userProfileDAO, type UserProfile } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


export function UserProfileClient() {
  const { toast } = useToast();
  const { data: profiles, isLoading } = useFirestoreData(userProfileDAO);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // For this example, we'll create a default profile if one doesn't exist
    // In a real app, this would be tied to the logged-in user
    if (!isLoading) {
      if (profiles.length > 0) {
        const currentProfile = profiles[0];
        setProfile(currentProfile);
        setName(currentProfile.name);
        setEmail(currentProfile.email);
        setPhone(currentProfile.phone || '');
      } else {
        // Create a default user for demo purposes
        const defaultUser = { name: 'Sandeep C.', email: 'sandeep@example.com', phone: '' };
         userProfileDAO.add(defaultUser).then(newProfile => {
             setProfile(newProfile);
             setName(newProfile.name);
             setEmail(newProfile.email);
             setPhone(newProfile.phone || '');
         });
      }
    }
  }, [profiles, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !profile) return;

    if (!name || !email) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Name and Email are required.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await userProfileDAO.update(profile.id, { name, email, phone });
      toast({
        title: 'Profile Saved',
        description: 'Your user profile has been updated.',
      });
    } catch (error) {
      console.error('Failed to save user profile', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save your user profile.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAction = (actionName: string) => {
    toast({
        title: 'Feature Not Implemented',
        description: `${actionName} functionality is not yet available in this demo.`,
    });
  }

  if (isLoading) {
    return <div className="mt-4 text-center text-muted-foreground">Loading profile...</div>;
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your personal account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
       <Card className="mt-6">
        <CardHeader>
            <CardTitle>Account Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <Button variant="outline" onClick={() => handleAction('Change Password')}>Change Password</Button>
                <p className="text-sm text-muted-foreground mt-2">Update the password for your account.</p>
            </div>
            <Separator />
            <div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">Delete Account</Button>
                    </AlertDialogTrigger>
                     <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleAction('Delete Account')} className="bg-red-600 hover:bg-red-700">Delete Account</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <p className="text-sm text-muted-foreground mt-2">Permanently delete your account and all associated data.</p>
            </div>
        </CardContent>
       </Card>
    </>
  );
}
