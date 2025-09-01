
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Invoice } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { subMonths, format, parse, startOfMonth } from 'date-fns';
import { useMemo } from 'react';


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

export function DashboardClient({ invoices }: { invoices: Invoice[] }) {
    const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        month: format(date, 'MMMM'),
        total: 0,
        paid: 0,
        start: startOfMonth(date),
      };
    });

    invoices.forEach(invoice => {
      try {
        const issueDate = parse(invoice.issueDate, 'dd/MM/yyyy', new Date());
        const monthData = months.find(m => 
            issueDate.getMonth() === m.start.getMonth() && 
            issueDate.getFullYear() === m.start.getFullYear()
        );

        if (monthData) {
          monthData.total += invoice.amount;
          if (invoice.status === 'Paid') {
            monthData.paid += invoice.amount;
          }
        }
      } catch (e) {
        console.error("Error parsing invoice date", invoice.issueDate);
      }
    });

    return months.map(({ month, total, paid }) => ({ month, total, paid }));
  }, [invoices]);

  return (
    <>
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
    </>
  )
}
