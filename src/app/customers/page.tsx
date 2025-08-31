import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { customers } from '@/lib/data';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function CustomersPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div></div>
        <Link href="/customers/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Customer
          </Button>
        </Link>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>Manage your customers and view their sales history.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className='text-right'>Total Invoiced</TableHead>
                <TableHead className='text-right'>Total Paid</TableHead>
                <TableHead className='text-right'>Invoices</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className='h-9 w-9'>
                        <AvatarImage
                          src={`https://picsum.photos/40/40?random=${customer.id}`}
                          data-ai-hint="profile picture"
                        />
                        <AvatarFallback>
                          {customer.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-right'>${customer.totalInvoiced.toFixed(2)}</TableCell>
                  <TableCell className='text-right'>${customer.totalPaid.toFixed(2)}</TableCell>
                  <TableCell className='text-right'>{customer.invoices}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
