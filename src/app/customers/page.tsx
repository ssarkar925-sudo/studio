
import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { customersDAO } from '@/lib/data';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { CustomersClient } from './customers-client';

export default async function CustomersPage() {
  const customers = await customersDAO.load();

  return (
    <AppLayout>
      <CustomersClient customers={customers} />
    </AppLayout>
  );
}
