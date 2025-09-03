
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { invoicesDAO, Invoice, businessProfileDAO, customersDAO, vendorsDAO, purchasesDAO, Purchase, productsDAO, Product, featureFlagsDAO, FeatureFlag } from '@/lib/data';
import { DollarSign, FileText, Clock, Bot, Send, Users, Store, Truck, PackageX, ScanLine } from 'lucide-react';
import { DashboardClient } from '@/app/dashboard-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { analyzeDashboard, AnalyzeDashboardOutput, ChatMessage } from '@/ai/flows/analyze-dashboard-flow';
import { subMonths, format, parse, startOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import Markdown from 'react-markdown';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { TagScanner } from '@/components/tag-scanner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function RecentInvoices({ invoices }: { invoices: Invoice[] }) {
    if (invoices.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recent invoices to display.
      </div>
    );
  }
  const sortedInvoices = [...invoices].sort((a,b) => {
      try {
        return parse(b.issueDate, 'dd/MM/yyyy', new Date()).getTime() - parse(a.issueDate, 'dd/MM/yyyy', new Date()).getTime()
      } catch {
        return 0;
      }
  });

  return (
    <div className="space-y-2">
      {sortedInvoices.slice(0, 5).map((invoice) => (
        <Link href={`/invoices/${invoice.id}`} key={invoice.id} className="block p-2 -mx-2 rounded-md hover:bg-muted">
            <div className="flex items-center">
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
        </Link>
      ))}
    </div>
  );
}

function UpcomingDeliveriesCard() {
  const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);
  
  const pendingPurchases = useMemo(() => {
    return purchases
      .filter(p => p.status === 'Pending')
      .sort((a, b) => {
          try {
            return parse(a.orderDate, 'dd/MM/yyyy', new Date()).getTime() - parse(b.orderDate, 'dd/MM/yyyy', new Date()).getTime()
          } catch {
            return 0;
          }
      });
  }, [purchases]);

  return (
      <Card>
          <CardHeader>
              <CardTitle>Upcoming Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
              {purchasesLoading ? (
                  <Skeleton className="h-40" />
              ) : pendingPurchases.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                      No pending deliveries.
                  </div>
              ) : (
                  <div className="space-y-2">
                      {pendingPurchases.slice(0, 5).map((purchase) => (
                          <Link href={`/inventory/purchases/${purchase.id}`} key={purchase.id} className="block p-2 -mx-2 rounded-md hover:bg-muted">
                              <div className="flex items-center">
                                  <div className="space-y-1">
                                      <p className="text-sm font-medium leading-none">
                                          {purchase.vendorName}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                          Order Date: {purchase.orderDate}
                                      </p>
                                  </div>
                                  <div className="ml-auto text-right font-medium">
                                      <p>₹{purchase.totalAmount.toFixed(2)}</p>
                                  </div>
                              </div>
                          </Link>
                      ))}
                  </div>
              )}
          </CardContent>
      </Card>
  );
}


function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
    const variant = {
    Paid: 'success',
    Pending: 'secondary',
    Overdue: 'destructive',
    Partial: 'warning',
  }[status] as 'success' | 'secondary' | 'destructive' | 'warning';

  return (
    <Badge variant={variant} className="mt-1 capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}


function AiAnalyzer({ invoices, isLoading, isEnabled }: { invoices: Invoice[], isLoading: boolean, isEnabled: boolean }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return { name: format(date, 'MMM yy'), profit: 0, start: startOfMonth(date) };
    });

    invoices.forEach(invoice => {
       if (invoice.status === 'Paid') {
          try {
            const issueDate = parse(invoice.issueDate, 'dd/MM/yyyy', new Date());
            const monthData = months.find(m =>
                issueDate.getMonth() === m.start.getMonth() &&
                issueDate.getFullYear() === m.start.getFullYear()
            );

            if (monthData) {
                monthData.profit += (invoice.dueAmount || invoice.amount);
            }
          } catch (e) {
            console.error("Error parsing invoice date for profit calc", invoice.issueDate);
          }
       }
    });

    return months.map(({ name, profit }) => ({ name, profit }));
  }, [invoices]);

  const totalRevenue = useMemo(() => invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0), [invoices]);

  const outstanding = useMemo(() => invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0), [invoices]);

  const overdue = useMemo(() => invoices.filter((i) => i.status === 'Overdue').length, [invoices]);

  useEffect(() => {
    if(scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [history])

  if (!isEnabled) {
    return (
         <Card className="lg:col-span-2 flex flex-col h-[500px] items-center justify-center">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                    <Bot /> AI Analysis Disabled
                </CardTitle>
                 <CardDescription>This feature is currently turned off.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    An administrator can enable it from the Admin -{'>'} Tiers & Features page.
                </p>
            </CardContent>
         </Card>
    );
  }

  const handleInitialAnalysis = async () => {
     if (invoices.length > 0) {
      setIsAnalyzing(true);
      setHistory([]);
      try {
        const result = await analyzeDashboard({
            totalRevenue: totalRevenue,
            outstandingAmount: outstanding,
            overdueInvoices: overdue,
            monthlyProfitData: chartData,
        });
        setHistory([{ role: 'model', content: result.response }]);
      } catch (err) {
        console.error("AI analysis failed", err);
        setHistory([{ role: 'model', content: 'Sorry, I was unable to provide an analysis. Please try again later.'}]);
      } finally {
        setIsAnalyzing(false);
      }
    } else {
        setHistory([{ role: 'model', content: 'There is no data to analyze yet. Create some invoices to get started!'}]);
    }
  }

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isAnalyzing) return;

    const newHistory: ChatMessage[] = [...history, { role: 'user', content: query }];
    setHistory(newHistory);
    setQuery('');
    setIsAnalyzing(true);

    try {
        const result = await analyzeDashboard({
            totalRevenue: totalRevenue,
            outstandingAmount: outstanding,
            overdueInvoices: overdue,
            monthlyProfitData: chartData,
            query: query,
            history: newHistory,
        });
        setHistory([...newHistory, { role: 'model', content: result.response }]);
    } catch (err) {
        console.error("AI query failed", err);
        setHistory([...newHistory, { role: 'model', content: 'Sorry, I encountered an error. Please try again.'}]);
    } finally {
        setIsAnalyzing(false);
    }
  };


  return (
    <Card className="lg:col-span-2 flex flex-col h-[500px]">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Bot /> AI Analysis
            </CardTitle>
            <CardDescription>Ask questions about your business finances.</CardDescription>
        </CardHeader>
        <CardContent className='flex-grow overflow-hidden'>
            <ScrollArea className="h-full" ref={scrollAreaRef}>
                 <div className="space-y-4 pr-4">
                     {history.length === 0 && !isAnalyzing && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Bot size={48} className="mb-4" />
                            <p className="mb-4">Get AI-powered insights on your business performance.</p>
                            <Button onClick={handleInitialAnalysis} disabled={isLoading}>Analyze My Dashboard</Button>
                        </div>
                     )}
                     {history.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {message.role === 'model' && (
                                <div className="h-8 w-8 border rounded-full flex items-center justify-center bg-muted shrink-0">
                                    <Bot size={16}/>
                                </div>
                            )}
                             <div className={`rounded-lg p-3 max-w-sm text-sm ${message.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                <Markdown>{message.content}</Markdown>
                            </div>
                              {message.role === 'user' && (
                                <div className="h-8 w-8 border rounded-full flex items-center justify-center bg-muted shrink-0">
                                    <span className="font-bold">U</span>
                                </div>
                            )}
                        </div>
                     ))}
                      {isAnalyzing && (
                        <div className="flex items-start gap-3">
                           <div className="h-8 w-8 border rounded-full flex items-center justify-center bg-muted shrink-0">
                                <Bot size={16}/>
                            </div>
                            <div className="rounded-lg p-3 bg-muted w-full">
                                <Skeleton className="h-4 w-4/5 mb-2" />
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-3/5" />
                            </div>
                        </div>
                     )}
                 </div>
            </ScrollArea>
        </CardContent>
       {history.length > 0 && (
         <CardFooter>
            <form onSubmit={handleQuerySubmit} className="flex w-full items-center space-x-2">
                <Input 
                    placeholder="e.g. Which month had the highest profit?" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isAnalyzing}
                />
                <Button type="submit" disabled={!query.trim() || isAnalyzing}>
                    <Send />
                </Button>
            </form>
        </CardFooter>
       )}
    </Card>
  );
}

function StatCards() {
    const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
    const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
    const { data: vendors, isLoading: vendorsLoading } = useFirestoreData(vendorsDAO);
    const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
    const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);


    const outstanding = useMemo(() => invoices
        .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
        .reduce((sum, i) => sum + i.amount, 0), [invoices]);

    const overdue = useMemo(() => invoices.filter((i) => i.status === 'Overdue').length, [invoices]);
    const pendingPurchasesCount = useMemo(() => purchases.filter(p => p.status === 'Pending').length, [purchases]);
    const totalCustomers = useMemo(() => customers.length, [customers]);
    const totalVendors = useMemo(() => vendors.length, [vendors]);
    const lowStockItems = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= 10).length, [products]);

    const isLoading = invoicesLoading || customersLoading || vendorsLoading || productsLoading || purchasesLoading;
    
    if (isLoading) {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                           <Skeleton className="h-5 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        )
    }


    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
             <Link href="/inventory?tab=purchases">
                <Card className='hover:bg-muted/50 transition-colors'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Deliveries</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingPurchasesCount}</div>
                        <p className="text-xs text-muted-foreground">
                            Pending purchase orders
                        </p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/inventory?tab=stock">
                <Card className='hover:bg-muted/50 transition-colors'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                        <PackageX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStockItems}</div>
                        <p className="text-xs text-muted-foreground">
                        Items with stock of 10 or less
                        </p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/contacts?tab=customers">
                <Card className='hover:bg-muted/50 transition-colors'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">
                        Manage all your customers
                        </p>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/contacts?tab=vendors">
                <Card className='hover:bg-muted/50 transition-colors'>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
                        <Store className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVendors}</div>
                        <p className="text-xs text-muted-foreground">
                        Manage all your vendors
                        </p>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

function MainDashboardContent() {
    const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
    const { data: products, isLoading: productsLoading } = useFirestoreData(productsDAO);
    const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
    
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
    
    const handleScan = (product: Product) => {
        setScannedProduct(product);
        setIsScannerOpen(false);
    };


    useEffect(() => {
        const unsubscribe = featureFlagsDAO.subscribe(setFeatureFlags);
        return () => unsubscribe();
    }, []);

    const aiAnalysisEnabled = featureFlags.find(f => f.id === 'aiAnalysis')?.enabled ?? false;

    return (
    <>
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
                <ScanLine className="mr-2 h-4 w-4"/>
                Scan Item
            </Button>
        </div>
        <Suspense fallback={
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-1/2" />
                            <Skeleton className="h-4 w-full mt-2" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        }>
            <StatCards/>
        </Suspense>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <Suspense fallback={<Card className="lg:col-span-3"><CardContent><Skeleton className="h-[300px] w-full"/></CardContent></Card>}>
                 <DashboardClient invoices={invoices} />
            </Suspense>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Invoices</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Suspense fallback={<Skeleton className="h-40"/>}>
                            <RecentInvoices invoices={invoices} />
                         </Suspense>
                    </CardContent>
                </Card>
                <Suspense fallback={<Card><CardContent><Skeleton className="h-40"/></CardContent></Card>}>
                    <UpcomingDeliveriesCard />
                </Suspense>
            </div>
            <Suspense fallback={<Card className="lg:col-span-2"><CardContent><Skeleton className="h-[500px] w-full"/></CardContent></Card>}>
                <AiAnalyzer invoices={invoices} isLoading={invoicesLoading} isEnabled={aiAnalysisEnabled} />
            </Suspense>
        </div>
        <TagScanner
            open={isScannerOpen}
            onOpenChange={setIsScannerOpen}
            onScan={handleScan}
            products={products}
        />
        <Dialog open={!!scannedProduct} onOpenChange={() => setScannedProduct(null)}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>{scannedProduct?.name}</DialogTitle>
                    <DialogDescription>
                        This dialog shows the details of the scanned product.
                    </DialogDescription>
                </DialogHeader>
                {scannedProduct && (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="font-semibold">Selling Price</div>
                        <div>₹{scannedProduct.sellingPrice.toFixed(2)}</div>
                        <div className="font-semibold">Stock</div>
                        <div>{scannedProduct.stock}</div>
                        <div className="font-semibold">SKU</div>
                        <div>{scannedProduct.sku}</div>
                         <div className="font-semibold">Batch Code</div>
                        <div>{scannedProduct.batchCode}</div>
                     </div>
                )}
            </DialogContent>
        </Dialog>
    </>
    )
}

export default function DashboardPage() {
    return (
        <AppLayout>
            <MainDashboardContent/>
        </AppLayout>
    );
}

    

    