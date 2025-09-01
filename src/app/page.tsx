
'use client';

import { AppLayout } from '@/components/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { invoicesDAO, Invoice, businessProfileDAO } from '@/lib/data';
import { DollarSign, FileText, Clock, Bot, Lightbulb, CheckCircle } from 'lucide-react';
import { DashboardClient } from '@/app/dashboard-client';
import { useFirestoreData } from '@/hooks/use-firestore-data';
import { useEffect, useState, useMemo } from 'react';
import { analyzeDashboard, AnalyzeDashboardOutput } from '@/ai/flows/analyze-dashboard-flow';
import { subMonths, format, parse, startOfMonth } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

function AiAnalyzer({ invoices, isLoading }: { invoices: Invoice[], isLoading: boolean }) {
  const [analysis, setAnalysis] = useState<AnalyzeDashboardOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

   const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return { name: format(date, 'MMM yy'), profit: 0, start: startOfMonth(date) };
    });

    invoices.forEach(invoice => {
       if (invoice.status === 'Paid') {
          try {
            const issueDate = parse(invoice.issueDate, 'PPP', new Date());
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


  useEffect(() => {
    if (!isLoading && invoices.length > 0) {
      setIsAnalyzing(true);
      analyzeDashboard({
        totalRevenue: totalRevenue,
        outstandingAmount: outstanding,
        overdueInvoices: overdue,
        monthlyProfitData: chartData,
      }).then(result => {
        setAnalysis(result);
        setIsAnalyzing(false);
      }).catch(err => {
        console.error("AI analysis failed", err);
        setIsAnalyzing(false);
      });
    } else if (!isLoading) {
        setIsAnalyzing(false);
    }
  }, [invoices, isLoading, totalRevenue, outstanding, overdue, chartData]);

  if (isAnalyzing) {
     return (
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot /> AI Analysis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="pt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
        </Card>
     )
  }

  if (!analysis) {
    return null; // Don't show the card if there's no analysis
  }

  return (
    <Card className="lg:col-span-2 bg-accent/20 border-accent/50">
        <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent-foreground/80">
                <Bot /> AI Analysis
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-foreground/90">{analysis.summary}</p>
            
            {analysis.insights.length > 0 && (
                <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><Lightbulb className="text-yellow-500" /> Insights</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                        {analysis.insights.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}
            {analysis.suggestions.length > 0 && (
                 <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-2"><CheckCircle className="text-green-500" /> Suggestions</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground/80">
                        {analysis.suggestions.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}
        </CardContent>
    </Card>
  );
}


export default function DashboardPage() {
  const { data: invoices, isLoading: invoicesLoading } = useFirestoreData(invoicesDAO);
  const { data: profiles, isLoading: profilesLoading } = useFirestoreData(businessProfileDAO);

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
  
  const isLoading = invoicesLoading || profilesLoading;

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
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <DashboardClient invoices={invoices} />
        <AiAnalyzer invoices={invoices} isLoading={isLoading} />
      </div>
    </AppLayout>
  );
}
