
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { invoicesDAO, Invoice } from '@/lib/data';
import { DollarSign, FileText, Clock } from 'lucide-react';
import { DashboardClient } from '@/components/dashboard-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';

export default function DashboardPage() {
  const { data: invoices, isLoading } = useFirestoreData(invoicesDAO);

  const totalRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdue = invoices.filter((i) => i.status === 'Overdue').length;
  
  if (isLoading) {
      return (
          <AppLayout>
               <div className="text-center text-muted-foreground">Loading dashboard...</div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +0% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{outstanding.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all pending invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{overdue}</div>
            <p className="text-xs text-muted-foreground">
              Invoices past their due date
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <DashboardClient invoices={invoices} />
      </div>
    </AppLayout>
  );
}
