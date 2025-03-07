'use client';
import React, { useCallback, useEffect, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import { useDebounce } from '@/lib/hooks';
import InvoiceDashboardCharts from '@/components/organisms/InvoiceDashboardCharts';
import Link from 'next/link';
import { FileText, PencilIcon } from 'lucide-react';
import GenericEmptyState from '@/components/molecules/GenericEmptyState';
import { useQuery } from '@tanstack/react-query';
import CaiExpirationWarning from '@/components/molecules/CaiExpirationWarning';

export default function Dashboard() {
  const { data: allInvoices, isLoading: areInvoicesLoading } = useQuery(
    ['allInvoices'], // unique query key
    () => invoiceService.getInvoices(), // the function for fetching
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    }
  );
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'pending',
    'paid',
    'cancelled',
  ]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const applyFilters = useCallback(() => {
    let filtered = allInvoices;
    if (areInvoicesLoading) filtered = [];
    console.log('The value of filtered is: ', filtered);

    // Apply search filter
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered!.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(lowerSearchTerm) ||
          invoice.customers.name.toLowerCase().includes(lowerSearchTerm) ||
          invoice.total.toString().includes(lowerSearchTerm) ||
          invoice.invoice_items.some((item) =>
            item.description.toLowerCase().includes(lowerSearchTerm)
          )
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered!.filter((invoice) => {
        const invoiceStatus = invoice.status?.toLowerCase() || 'pending'; // Default to 'pending' if status is undefined
        return selectedStatuses.some(
          (status) => status.toLowerCase() === invoiceStatus
        );
      });
    }

    setFilteredInvoices(filtered!);
  }, [allInvoices, debouncedSearchTerm, selectedStatuses, areInvoicesLoading]);

  // As soon as you enter /home, you'll load the necessary data

  useEffect(() => {
    applyFilters();
  }, [allInvoices, debouncedSearchTerm, selectedStatuses, applyFilters]);
  if (areInvoicesLoading) return <div>Loading invoices</div>;

  const handleDateSearch = () => {
    if (dateRange.start && dateRange.end) {
      const filtered = filteredInvoices.filter((invoice) => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= dateRange.start! && invoiceDate <= dateRange.end!;
      });
      setFilteredInvoices(filtered);
    }
  };

  // Widgets Section
  const WidgetsSection = () => {
    const currentDate = new Date();
    const oneWeekAgo = new Date(
      currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const weeklyRevenue = filteredInvoices
      .filter((invoice) => new Date(invoice.date) >= oneWeekAgo)
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const monthlyRevenue = filteredInvoices
      .filter((invoice) => new Date(invoice.date) >= firstDayOfMonth)
      .reduce((sum, invoice) => sum + invoice.total, 0);

    const weeklyPercentage =
      monthlyRevenue !== 0 ? (weeklyRevenue / monthlyRevenue) * 100 : 0;

    return (
      <div className='w-full grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='sm:col-span-2'>
          <CardHeader className='pb-3'>
            <CardTitle>Tus facturas</CardTitle>
            <CardDescription className='max-w-lg text-balance leading-relaxed'>
              Dashboard de facturas
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link
              className='bg-[#00A1D4] text-lg w-56 p-4 rounded-md text-white font-semibold flex gap-4'
              href='/home/invoices'
            >
              <PencilIcon />
              Ir a Facturas
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Esta Semana</CardDescription>
            <CardTitle className='text-4xl'>
              {`Lps. ${weeklyRevenue.toLocaleString('en')}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-xs text-muted-foreground'>
              {weeklyPercentage.toLocaleString('en')}% del mes actual
            </div>
          </CardContent>
          <CardFooter>
            <Progress
              value={weeklyPercentage}
              aria-label='Incremento semanal'
            />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardDescription>Este Mes</CardDescription>
            <CardTitle className='text-4xl'>
              {`Lps. ${monthlyRevenue.toLocaleString('en')}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-xs text-muted-foreground'>
              Ingresos totales del mes
            </div>
          </CardContent>
          {/* <CardFooter>
            <Progress value={100} aria-label="Ingresos mensuales" />
          </CardFooter> */}
        </Card>
      </div>
    );
  };

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col p-6 xs:p-0 sm:gap-4 lg:p-12'>
        <main className='flex w-full flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
          <CaiExpirationWarning />
          {filteredInvoices.length === 0 ? (
            <>
              <WidgetsSection />
              <div className='w-full items-center'>
                <GenericEmptyState
                  icon={FileText}
                  title='No tienes facturas aún'
                  description='Comienza a crear facturas para tus clientes y visualiza tu progreso.'
                />
              </div>
            </>
          ) : (
            <InvoiceDashboardCharts invoices={filteredInvoices} />
          )}
        </main>
      </div>
    </div>
  );
}
