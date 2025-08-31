
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { invoicesDAO, Invoice } from '@/lib/data';
import { DollarSign, FileText, Clock } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useFirestoreData } from '@/hooks/use-firestore-data';

const chartData = [
  { month: 'January', total: 0, paid: 0 },
  { month: 'February', total: 0, paid: 0 },
  { month: 'March', total: 0, paid: 0 },
  { month: 'April', total: 0, paid: 0 },
  { month: 'May', total: 0, paid: 0 },
  { month: 'June', total: 0, paid: 0 },
];

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--accent))',
  },
  paid: {
    label: 'Paid',
    color: 'hsl(var(--primary))',
  },
} satisfies import('@/components/ui/chart').ChartConfig;

export default function DashboardPage() {
  const { data: invoices } = useFirestoreData(invoicesDAO);

  const totalRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === 'Overdue').length;

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
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `₹${value / 1000}K`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={4}
                />
                <Bar dataKey="paid" fill="var(--color-paid)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Button asChild size="sm">
                <Link href="/invoices/new">New Invoice</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentInvoices invoices={invoices} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
    if (invoices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recent invoices to display.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {invoices.slice(0, 5).map((invoice) => (
        <div key={invoice.id} className="flex items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">
              {invoice.customer.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer.email}
            </p>
          </div>
          <div className="ml-auto text-right font-medium">
            <p>₹{invoice.amount.toFixed(2)}</p>
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
  }[status] as 'default' | 'secondary' | 'destructive';

  return (
    <Badge variant={variant} className="mt-1 capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}
