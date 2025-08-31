'use client';

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
import { productsDAO } from '@/lib/data';
import { MoreHorizontal, PlusCircle, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/data';


export default function ProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(productsDAO.load());
  }, []);

  const handleAction = (action: string, productName: string) => {
    toast({
      title: `${action} Inventory Item`,
      description: `You have selected to ${action.toLowerCase()} ${productName}. This feature is not yet implemented.`,
    });
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Item
            </Link>
          </Button>
        </div>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>All Inventory</CardTitle>
          <CardDescription>Manage your inventory, services, and their prices.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className='text-right'>Price</TableHead>
                <TableHead className='text-right'>Stock</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className='text-right'>₹{product.price.toFixed(2)}</TableCell>
                  <TableCell className='text-right'>{product.stock}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => handleAction('View', product.name)}>View</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Edit', product.name)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleAction('Delete', product.name)}>Delete</DropdownMenuItem>
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
