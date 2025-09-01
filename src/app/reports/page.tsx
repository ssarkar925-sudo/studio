
'use client';

import { AppLayout } from '@/components/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reports</h1>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            Gain insights into your business performance. More reports coming
            soon!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p>
              Detailed reports like Profit & Loss, Sales by Customer, and more
              will be available here.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
