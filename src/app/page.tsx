
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { invoicesDAO, Invoice, businessProfileDAO, customersDAO, vendorsDAO, purchasesDAO } from '@/lib/data';
import { DollarSign, FileText, Clock, Bot, Send, Users, Store, Truck } from 'lucide-react';
import { DashboardClient } from '@/app/dashboard-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState, useMemo, useRef } from 'react';
import { analyzeDashboard, AnalyzeDashboardOutput, ChatMessage } from '@/ai/flows/analyze-dashboard-flow';
import { subMonths, format, parse, startOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Markdown from 'react-markdown';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';


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

function InvoiceStatusBadge({ status }: { status: Invoice['status'] }) {
  const variant = {
    Paid: 'default',
    Pending: 'secondary',
    Overdue: 'destructive',
    Partial: 'outline',
  }[status] as 'default' | 'secondary' | 'destructive' | 'outline';

  if (status === 'Partial') {
    return <Badge variant={variant} className="capitalize mt-1 border-accent text-accent">{status.toLowerCase()}</Badge>;
  }

  return (
    <Badge variant={variant} className="mt-1 capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}


function AiAnalyzer({ invoices, isLoading }: { invoices: Invoice[], isLoading: boolean }) {
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(true);
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

  const totalRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdue = invoices.filter((i) => i.status === 'Overdue').length;

  const initialAnalysis = async () => {
     if (!isLoading && invoices.length > 0) {
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
    } else if (!isLoading) {
        setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    initialAnalysis();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoices, isLoading]);

  useEffect(() => {
    if(scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [history])

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
                     {history.map((message, index) => (
                        <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                            {message.role === 'model' && (
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><Bot size={16}/></AvatarFallback>
                                </Avatar>
                            )}
                             <div className={`rounded-lg p-3 max-w-sm text-sm ${message.role === 'model' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                <Markdown>{message.content}</Markdown>
                            </div>
                              {message.role === 'user' && (
                                <Avatar className="h-8 w-8 border">
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                     ))}
                      {isAnalyzing && history.length > 0 && (
                        <div className="flex items-start gap-3">
                           <Avatar className="h-8 w-8 border">
                                <AvatarFallback><Bot size={16}/></AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg p-3 bg-muted">
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>
                     )}
                     {history.length === 0 && isAnalyzing && (
                        <div className="space-y-2">
                           <Skeleton className="h-16 w-full" />
                           <Skeleton className="h-24 w-4/5 ml-auto" />
                           <Skeleton className="h-16 w-full" />
                        </div>
                     )}
                 </div>
            </ScrollArea>
        </CardContent>
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
    </Card>
  );
}


export default function DashboardPage() {
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: profiles, isLoading: profilesLoading } = useFirestoreData(businessProfileDAO);
  const { data: customers, isLoading: customersLoading } = useFirestoreData(customersDAO);
  const { data: vendors, isLoading: vendorsLoading } = useFirestoreData(vendorsDAO);
  const { data: purchases, isLoading: purchasesLoading } = useFirestoreData(purchasesDAO);

  const companyName = profiles[0]?.companyName;

  useEffect(() => {
    if (companyName) {
      document.title = `${companyName} | Dashboard`;
    } else {
      document.title = 'Dashboard | Vyapar Co';
    }
  }, [companyName]);


  const totalRevenue = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.amount, 0);

  const outstanding = invoices
    .filter((i) => i.status === 'Pending' || i.status === 'Overdue')
    .reduce((sum, i) => sum + i.amount, 0);

  const overdue = invoices.filter((i) => i.status === 'Overdue').length;
  
  const totalCustomers = customers.length;
  const totalVendors = vendors.length;
  const upcomingDeliveries = purchases.filter(p => p.status === 'Pending').length;

  const isLoading = invoicesLoading || profilesLoading || customersLoading || vendorsLoading || purchasesLoading;

  if (isLoading) {
      return (
          <AppLayout>
               <div className="text-center text-muted-foreground">Loading dashboard...</div>
          </AppLayout>
      )
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                Based on all paid invoices
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
        <Link href="/inventory?tab=purchases">
            <Card className='hover:bg-muted/50 transition-colors'>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Deliveries</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{upcomingDeliveries}</div>
                    <p className="text-xs text-muted-foreground">
                    Pending purchase orders
                    </p>
                </CardContent>
            </Card>
        </Link>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <DashboardClient invoices={invoices} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentInvoices invoices={invoices} />
          </CardContent>
        </Card>
        <AiAnalyzer invoices={invoices} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
