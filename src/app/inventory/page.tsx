
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
import { MoreHorizontal, PlusCircle, Upload, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseHistory } from '@/components/purchase-history';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useLocalStorageData } from '@/hooks/use-local-storage-data';


export default function InventoryPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: products } = useLocalStorageData(productsDAO);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const allProductsSelected = useMemo(() => selectedProducts.length > 0 && selectedProducts.length === products.length, [selectedProducts, products]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleDelete = (productId: string) => {
    productsDAO.remove(productId);
    toast({
      title: 'Item Deleted',
      description: 'The inventory item has been successfully deleted.',
    });
  };

  const handleDeleteSelected = () => {
    selectedProducts.forEach(id => productsDAO.remove(id));
    toast({
        title: 'Items Deleted',
        description: `${selectedProducts.length} item(s) have been deleted.`,
    });
    setSelectedProducts([]);
  };

  const handleAction = (action: string, productId: string, productName: string) => {
    if (action === 'View') {
      router.push(`/inventory/${productId}`);
    } else if (action === 'Edit') {
      toast({
        title: `${action} Inventory Item`,
        description: `You have selected to ${action.toLowerCase()} ${productName}. This feature is not yet implemented.`,
      });
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Inventory</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload />
            Import
          </Button>
        </div>
      </div>
      <Tabs defaultValue="stock">
        <TabsList>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
        </TabsList>
        <TabsContent value="stock">
          <Card className="mt-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className='flex items-center gap-4'>
                <div>
                  <CardTitle>Stock History</CardTitle>
                  <CardDescription>Manage your inventory, services, and their prices.</CardDescription>
                </div>
                 {selectedProducts.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm"><Trash2 /> Delete ({selectedProducts.length})</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete {selectedProducts.length} item(s).
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
               <Button asChild>
                <Link href="/inventory/new">
                  <PlusCircle />
                  New Item
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead className="w-12">
                        <Checkbox
                          checked={allProductsSelected}
                          onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                          aria-label="Select all"
                        />
                      </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch Code</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-state={selectedProducts.includes(product.id) && "selected"}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={(checked) => handleSelectProduct(product.id, checked as boolean)}
                          aria-label="Select row"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.batchCode}</TableCell>
                      <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.stock}</TableCell>
                      <TableCell>
                        {product.stock <= 10 ? (
                            <Badge variant="destructive">Low Stock</Badge>
                        ) : (
                            <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleAction('View', product.id, product.name)}>View</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleAction('Edit', product.id, product.name)}>Edit</DropdownMenuItem>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                              </AlertDialogTrigger>
                            </DropdownMenuContent>
                          </DropdownMenu>
                           <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the item &quot;{product.name}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="purchases">
          <PurchaseHistory />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
