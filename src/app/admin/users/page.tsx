
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
import { adminUsersDAO, type UserProfile } from '@/lib/data';
import { useAuth } from '@/components/auth-provider';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';


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
    const { user: currentUser } = useAuth(); // To exclude the current admin from the list

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
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell className="text-muted-foreground text-xs">{user.id}</TableCell>
                                    <TableCell>
                                        {user.isAdmin && <Badge variant="secondary">Admin</Badge>}
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
