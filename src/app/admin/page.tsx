
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, SlidersHorizontal, Settings, BarChart3, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  return (
    <AppLayout>
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold">Admin Control Panel</h1>
            <p className="text-muted-foreground mt-2">Manage your application, users, and services.</p>
        </div>

        <Card>
            <CardHeader>
                <div className='flex items-center gap-3'>
                    <Users className="h-6 w-6 text-primary" />
                    <CardTitle>User Management</CardTitle>
                </div>
                <CardDescription>View and manage all registered users of your application.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/admin/users">
                        Go to User Management <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>

         <Card>
            <CardHeader>
                <div className='flex items-center gap-3'>
                    <SlidersHorizontal className="h-6 w-6 text-primary" />
                    <CardTitle>Service Tiers & Feature Control</CardTitle>
                </div>
                <CardDescription>Define what services and features are available to different users or subscription levels.</CardDescription>
            </CardHeader>
             <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/admin/tiers">
                        Manage Tiers & Features <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <Card>
            <CardHeader>
                 <div className='flex items-center gap-3'>
                    <Settings className="h-6 w-6 text-primary" />
                    <CardTitle>Application-Wide Controls</CardTitle>
                </div>
                <CardDescription>Global settings to manage the entire application's state and behavior.</CardDescription>
            </CardHeader>
             <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/admin/controls">
                        Go to App Controls <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
        
        <Card>
            <CardHeader>
                 <div className='flex items-center gap-3'>
                    <BarChart3 className="h-6 w-6 text-primary" />
                    <CardTitle>Admin Analytics</CardTitle>
                </div>
                <CardDescription>High-level overview of application health and user engagement.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button asChild variant="outline">
                    <Link href="/admin/analytics">
                        View Analytics <ArrowRight className="ml-2" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>

      </div>
    </AppLayout>
  );
}
