
'use client';

import { AppLayout } from '@/components/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { invoicesDAO, productsDAO, type Invoice, type Product } from '@/lib/data';
import { useState, useMemo } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { subDays, startOfDay, parse, format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, FileText, Package } from 'lucide-react';
import Link from 'next/link';

type ProductProfit = {
  productId: string;
  name: string;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
};

export default function ReportsPage() {
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredInvoices = useMemo(() => {
    if (!dateRange?.from) return invoices;
    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? startOfDay(dateRange.to) : new Date();

    return invoices.filter(invoice => {
        try {
            const issueDate = startOfDay(parse(invoice.issueDate, 'PPP', new Date()));
            return issueDate >= fromDate && issueDate <= toDate;
        } catch(e) {
            return false;
        }
    })
  }, [invoices, dateRange]);


  const {
    totalRevenue,
    totalProfit,
    totalCogs,
    totalSales,
    monthlyProfitData,
    productPerformance
  } = useMemo(() => {
    const productsMap = new Map<string, Product>(products.map(p => [p.id, p]));
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCogs = 0;
    const salesByMonth: {[key: string]: number} = {};
    const productSales: {[key: string]: { name: string, quantitySold: number }} = {};

    for(const p of products) {
      productSales[p.id] = { name: p.name, quantitySold: 0 };
    }

    filteredInvoices.forEach(invoice => {
      totalRevenue += invoice.amount;
      invoice.items.forEach(item => {
        const product = productsMap.get(item.productId);
        if (product) {
          const itemCost = product.purchasePrice * item.quantity;
          totalCogs += itemCost;
          totalProfit += (item.sellingPrice * item.quantity) - itemCost;
          if (productSales[item.productId]) {
            productSales[item.productId].quantitySold += item.quantity;
          }
        } else {
            // For manual items, assume cost is 70% of selling price for profit calc
            const itemCost = (item.sellingPrice * 0.7) * item.quantity;
            totalCogs += itemCost;
            totalProfit += (item.sellingPrice * item.quantity) - itemCost;
        }
      });

      try {
          const monthKey = format(parse(invoice.issueDate, 'PPP', new Date()), 'yyyy-MM');
          if(!salesByMonth[monthKey]) salesByMonth[monthKey] = 0;
          salesByMonth[monthKey] += invoice.items.reduce((profit, item) => {
              const product = productsMap.get(item.productId);
              if (product) {
                  return profit + (item.sellingPrice - product.purchasePrice) * item.quantity;
              }
              return profit + (item.sellingPrice * 0.3) * item.quantity; // Manual item profit
          }, 0);
      } catch(e) {}
    });
    
    const monthlyProfitData = Object.entries(salesByMonth).map(([month, profit]) => ({
      name: format(new Date(month + '-02'), 'MMM yy'),
      profit: parseFloat(profit.toFixed(2)),
    })).sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    const productPerformance = Object.entries(productSales)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a,b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);


    return {
      totalRevenue,
      totalProfit,
      totalCogs,
      totalSales: filteredInvoices.length,
      monthlyProfitData,
      productPerformance
    };
  }, [filteredInvoices, products]);

  const isLoading = invoicesLoading || productsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Reports</h1>
        </div>
        <div className="mt-4 text-center text-muted-foreground">
          Loading reports...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <DateRangePicker dateRange={dateRange} onUpdate={setDateRange} />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
        <Link href="/invoices">
            <Card className='hover:bg-muted/50 transition-colors'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total revenue from selected period</p>
                </CardContent>
            </Card>
        </Link>
         <Link href="/invoices">
            <Card className='hover:bg-muted/50 transition-colors'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cost of Goods Sold</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalCogs.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total cost of items sold</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/invoices">
            <Card className='hover:bg-muted/50 transition-colors'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₹{totalProfit.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Estimated profit from sales</p>
                </CardContent>
            </Card>
        </Link>
        <Link href="/invoices">
            <Card className='hover:bg-muted/50 transition-colors'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSales}</div>
                    <p className="text-xs text-muted-foreground">Total invoices created</p>
                </CardContent>
            </Card>
        </Link>
      </div>

       <div className="grid gap-4 mt-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Profit Over Time</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyProfitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" fill="hsl(var(--primary))" name="Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>
              Your most popular products by quantity sold.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {productPerformance.map(product => (
                <Link href={`/inventory/${product.id}`} key={product.id} className="block p-2 -mx-2 rounded-md hover:bg-muted">
                    <div className="flex items-center">
                        <div className="p-2 bg-muted rounded-md mr-4">
                            <Package className="h-5 w-5 text-muted-foreground"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{product.quantitySold} units sold</p>
                        </div>
                    </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
