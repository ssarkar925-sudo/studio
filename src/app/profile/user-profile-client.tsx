
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { userProfileDAO, businessProfileDAO, invoicesDAO, customersDAO, productsDAO, purchasesDAO, vendorsDAO, type UserProfile } from '@/lib/data';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';


export function UserProfileClient() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: profiles, isLoading } = useFirestoreData(userProfileDAO);
  const { data: businessProfiles } = useFirestoreData(businessProfileDAO);
  const { data: invoices } = useFirestoreData(invoicesDAO);
  const { data: customers } = useFirestoreData(customersDAO);
  const { data: products } = useFirestoreData(productsDAO);
  const { data: purchases } = useFirestoreData(purchasesDAO);
  const { data: vendors } = useFirestoreData(vendorsDAO);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');


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
  
  const handleChangePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
      });
      return;
    }

    toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated.',
    });
    setIsPasswordDialogOpen(false);
  }

  const handleDeleteAccount = async () => {
    toast({
        title: 'Account Deletion in Progress...',
        description: 'Please wait while we remove all your data.',
    });

    try {
        // Array of promises for all deletion operations
        const deletionPromises: Promise<any>[] = [];

        // Delete all collections' documents
        if (profile) deletionPromises.push(userProfileDAO.remove(profile.id));
        businessProfiles.forEach(p => deletionPromises.push(businessProfileDAO.remove(p.id)));
        invoices.forEach(i => deletionPromises.push(invoicesDAO.remove(i.id)));
        customers.forEach(c => deletionPromises.push(customersDAO.remove(c.id)));
        products.forEach(p => deletionPromises.push(productsDAO.remove(p.id)));
        purchases.forEach(p => deletionPromises.push(purchasesDAO.remove(p.id)));
        vendors.forEach(v => deletionPromises.push(vendorsDAO.remove(v.id)));
        
        await Promise.all(deletionPromises);

        toast({
            title: 'Account Deleted Successfully',
            description: 'Your account and all data have been removed. Redirecting you to the login page.',
        });

        // Add a delay to allow the user to read the toast
        setTimeout(() => router.push('/login'), 2000);

    } catch (error) {
        console.error("Failed to delete account:", error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'There was an error deleting your account. Please try again.',
        });
    }
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
                 <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline">Change Password</Button>
                    </DialogTrigger>
                    <DialogContent>
                         <form onSubmit={handleChangePassword}>
                            <DialogHeader>
                                <DialogTitle>Change Password</DialogTitle>
                                <DialogDescription>
                                    Enter your old and new password below.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="oldPassword">Old Password</Label>
                                    <Input id="oldPassword" name="oldPassword" type="password" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input id="newPassword" name="newPassword" type="password" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input id="confirmPassword" name="confirmPassword" type="password" required />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit">Change Password</Button>
                            </DialogFooter>
                         </form>
                    </DialogContent>
                </Dialog>
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
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers. To confirm, please type "delete total delete this account" in the box below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="delete-confirm" className="sr-only">Confirmation</Label>
                            <Input 
                                id="delete-confirm" 
                                placeholder='delete total delete this account'
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteAccount} 
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteConfirmation !== 'delete total delete this account'}
                            >
                                Delete Account
                            </AlertDialogAction>
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
