
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
import { DollarSign, FileText, Package, Download, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function ReportsPage() {
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
  const { toast } = useToast();

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
            const issueDate = startOfDay(parse(invoice.issueDate, 'dd/MM/yyyy', new Date()));
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
    productPerformance,
    outstandingRevenue,
    inventoryValue,
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
          const monthKey = format(parse(invoice.issueDate, 'dd/MM/yyyy', new Date()), 'yyyy-MM');
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

    const outstandingRevenue = invoices.filter(i => i.status === 'Pending' || i.status === 'Partial' || i.status === 'Overdue').reduce((sum, inv) => sum + (inv.dueAmount ?? 0), 0);
    const inventoryValue = products.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);


    return {
      totalRevenue,
      totalProfit,
      totalCogs,
      totalSales: filteredInvoices.length,
      monthlyProfitData,
      productPerformance,
      outstandingRevenue,
      inventoryValue,
    };
  }, [filteredInvoices, products, invoices]);

  const handleDownload = (format: 'pdf' | 'excel') => {
    toast({
      title: 'Download Started',
      description: `Your ${format.toUpperCase()} report is being generated. This feature is not yet implemented.`,
    });
  };
  
  const estimatedOperatingExpenses = totalRevenue * 0.15; // Placeholder at 15% of revenue
  const netProfit = totalProfit - estimatedOperatingExpenses;

  const totalAssets = outstandingRevenue + inventoryValue;
  const totalLiabilities = 0; // Placeholder, app does not track liabilities
  const equity = totalAssets - totalLiabilities;

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
        <div className="flex items-center gap-2">
            <DateRangePicker dateRange={dateRange} onUpdate={setDateRange} />
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => handleDownload('pdf')}>
                        Download as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleDownload('excel')}>
                        Download as Excel
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
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
                    <Wallet className="h-4 w-4 text-muted-foreground" />
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
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
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

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Profit & Loss Statement</CardTitle>
                <CardDescription>
                    An overview of your revenue and expenses for the selected period.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>Total Revenue</TableCell>
                            <TableCell className="text-right">₹{totalRevenue.toFixed(2)}</TableCell>
                        </TableRow>
                         <TableRow>
                            <TableCell>Cost of Goods Sold (COGS)</TableCell>
                            <TableCell className="text-right">- ₹{totalCogs.toFixed(2)}</TableCell>
                        </TableRow>
                         <TableRow className="font-semibold">
                            <TableCell>Gross Profit</TableCell>
                            <TableCell className="text-right">₹{totalProfit.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>Operating Expenses (Est.)</TableCell>
                            <TableCell className="text-right">- ₹{estimatedOperatingExpenses.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow className="font-bold text-lg bg-muted/50">
                            <TableCell>Net Profit (Est.)</TableCell>
                            <TableCell className="text-right">₹{netProfit.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Balance Sheet</CardTitle>
                <CardDescription>
                    A snapshot of your company's financial health.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Assets</h4>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Outstanding Revenue</TableCell>
                                    <TableCell className="text-right">₹{outstandingRevenue.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Inventory Value (at cost)</TableCell>
                                    <TableCell className="text-right">₹{inventoryValue.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell>Total Assets</TableCell>
                                    <TableCell className="text-right">₹{totalAssets.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Liabilities</h4>
                        <Table>
                            <TableBody>
                                 <TableRow>
                                    <TableCell>Accounts Payable</TableCell>
                                    <TableCell className="text-right">₹0.00</TableCell>
                                </TableRow>
                                <TableRow className="font-semibold bg-muted/50">
                                    <TableCell>Total Liabilities</TableCell>
                                    <TableCell className="text-right">₹{totalLiabilities.toFixed(2)}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                     <div className="font-bold text-lg pt-2">
                        <div className="flex justify-between items-center p-2 bg-muted rounded-md">
                           <span>Equity</span>
                           <span>₹{equity.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
