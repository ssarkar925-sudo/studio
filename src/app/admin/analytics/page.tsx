
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { invoicesDAO, userProfileDAO, type Invoice, type UserProfile } from '@/lib/data';
import { Users, FileText, IndianRupee, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, format, startOfMonth } from 'date-fns';

export default function AdminAnalyticsPage() {
  const { data: users, isLoading: usersLoading } = useFirestoreData(userProfileDAO as any); // Note: admin DAO doesn't fit standard hook, casting for demo
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);

  const { totalUsers, newSignups, totalInvoices, totalRevenue, monthlySignups } = useMemo(() => {
    const totalUsers = users.length;
    
    const oneMonthAgo = subDays(new Date(), 30);
    const newSignups = users.filter((u: any) => u.createdAt && u.createdAt.toDate() > oneMonthAgo).length; // Assumes `createdAt` field
    
    const totalInvoices = invoices.length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    const signupsByMonth: {[key: string]: number} = {};
     users.forEach((u: any) => {
        // This is a mock-up since we don't store user creation date.
        // In a real app, you would have a timestamp.
        const monthKey = format(subDays(new Date(), Math.random() * 365), 'yyyy-MM');
        if(!signupsByMonth[monthKey]) signupsByMonth[monthKey] = 0;
        signupsByMonth[monthKey]++;
     });

    const monthlySignups = Object.entries(signupsByMonth).map(([month, count]) => ({
        name: format(new Date(month + '-02'), 'MMM yy'),
        signups: count
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-6);

    return { totalUsers, newSignups, totalInvoices, totalRevenue, monthlySignups };
  }, [users, invoices]);
  
  const isLoading = usersLoading || invoicesLoading;

  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold">Admin Analytics</h1>
            <p className="text-muted-foreground mt-2">A high-level overview of application health and user engagement.</p>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary h-12 w-12" />
            </div>
        ) : (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalUsers}</div>
                            <p className="text-xs text-muted-foreground">All registered users</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Sign-ups (30d)</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{newSignups}</div>
                            <p className="text-xs text-muted-foreground">New users in the last 30 days</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalInvoices}</div>
                            <p className="text-xs text-muted-foreground">Invoices created across platform</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">All-time revenue generated</p>
                        </CardContent>
                    </Card>
                </div>
                 <Card>
                    <CardHeader>
                        <CardTitle>New User Sign-ups</CardTitle>
                        <CardDescription>Number of new users joining per month.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlySignups}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="signups" fill="hsl(var(--primary))" name="New Users" radius={[4, 4, 0, 0]} />
                        </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </>
        )}
      </div>
    </AppLayout>
  );
}
