
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { userProfileDAO, deleteAllUserData } from '@/lib/data';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
import { useAuth } from '@/components/auth-provider';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';


export function UserProfileClient() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<{name: string, email: string, phone: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');


  useEffect(() => {
    if (user) {
        userProfileDAO.get(user.uid).then(userProfile => {
            if (userProfile) {
                setProfile({
                    name: userProfile.name || user.displayName || '',
                    email: userProfile.email || user.email || '',
                    phone: userProfile.phone || user.phoneNumber || ''
                });
            }
            setIsLoading(false);
        })
    }
  }, [user]);

  const handleProfileChange = (field: 'name' | 'phone', value: string) => {
    if (profile) {
        setProfile({...profile, [field]: value});
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving || !profile || !user) return;

    if (!profile.name) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Name is required.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await userProfileDAO.update(user.uid, { name: profile.name, phone: profile.phone });
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
  
  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const oldPassword = formData.get('oldPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    if (newPassword.length < 6) {
        toast({ variant: 'destructive', title: 'Password too short', description: 'Password must be at least 6 characters long.' });
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email!, oldPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: 'Password Changed', description: 'Your password has been successfully updated.' });
        setIsPasswordDialogOpen(false);
    } catch (error: any) {
        console.error("Password change failed", error);
         toast({ variant: 'destructive', title: 'Password Change Failed', description: error.code === 'auth/wrong-password' ? 'The old password you entered is incorrect.' : error.message});
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    toast({
        title: 'Account Deletion in Progress...',
        description: 'Please wait while we remove all your data.',
    });

    try {
        await deleteAllUserData(user.uid);
        await user.delete();
        toast({
            title: 'Account Deleted Successfully',
            description: 'Your account and all data have been removed. Redirecting you to the login page.',
        });
        router.push('/login');
    } catch (error: any) {
        console.error("Failed to delete account:", error);
         if (error.code === 'auth/requires-recent-login') {
            toast({
                variant: 'destructive',
                title: 'Re-authentication Required',
                description: 'This is a sensitive operation. Please log out and log back in before deleting your account.',
            });
         } else {
            toast({
                variant: 'destructive',
                title: 'Deletion Failed',
                description: 'There was an error deleting your account. Please try again.',
            });
         }
    }
  }


  if (isLoading || !profile) {
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
                  <Input id="name" value={profile.name} onChange={(e) => handleProfileChange('name', e.target.value)} required />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => handleProfileChange('phone', e.target.value)} />
                </div>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
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
                                This action cannot be undone. This will permanently delete your account and remove your data from our servers. To confirm, please type "delete my account" in the box below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="delete-confirm" className="sr-only">Confirmation</Label>
                            <Input 
                                id="delete-confirm" 
                                placeholder='delete my account'
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteAccount} 
                                className="bg-red-600 hover:bg-red-700"
                                disabled={deleteConfirmation !== 'delete my account'}
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
