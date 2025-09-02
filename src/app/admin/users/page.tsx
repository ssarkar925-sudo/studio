
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminUsersDAO, userProfileDAO, type UserProfile } from '@/lib/data';
import { useAuth } from '@/components/auth-provider';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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
import { Loader2 } from 'lucide-react';


// A custom hook to fetch all users for the admin panel
function useAllUsers() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = adminUsersDAO.subscribe(
            (allUsers) => {
                setUsers(allUsers);
                setIsLoading(false);
            },
            (err) => {
                setError(err);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    return { users, isLoading, error };
}


export default function AdminUsersPage() {
    const { users, isLoading, error } = useAllUsers();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const handleRoleChange = async (user: UserProfile, makeAdmin: boolean) => {
        if (!currentUser || currentUser.uid === user.id) {
            toast({
                variant: 'destructive',
                title: 'Invalid Action',
                description: 'You cannot change your own admin status.',
            });
            return;
        }

        setIsUpdating(user.id);
        try {
            await userProfileDAO.update(user.id, { isAdmin: makeAdmin });
            toast({
                title: 'Success',
                description: `${user.name} has been ${makeAdmin ? 'made an admin' : 'removed from admins'}.`,
            });
        } catch (err) {
            console.error('Failed to update role', err);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: 'Could not update user role. Please try again.',
            });
        } finally {
            setIsUpdating(null);
        }
    };
    
    if (isLoading) {
        return (
            <AppLayout>
                <div className="text-center text-muted-foreground">Loading users...</div>
            </AppLayout>
        );
    }
    
    if (error) {
        return (
             <AppLayout>
                <div className="text-center text-destructive">Error loading users: {error.message}</div>
            </AppLayout>
        )
    }

    const displayedUsers = users.filter(user => user.id !== currentUser?.uid);

    return (
        <AppLayout>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                        A list of all users registered in the application.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>User ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{user.id}</TableCell>
                                    <TableCell>
                                        {user.isAdmin ? <Badge variant="secondary">Admin</Badge> : <Badge variant="outline">User</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant={user.isAdmin ? "destructive" : "outline"} disabled={!!isUpdating}>
                                                     {isUpdating === user.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will {user.isAdmin ? 'remove admin privileges from' : 'grant admin privileges to'} {user.name}.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRoleChange(user, !user.isAdmin)}>
                                                        Confirm
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
