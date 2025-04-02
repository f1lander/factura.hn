'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import { useDebounce } from '@/lib/hooks';
import InvoiceDashboardCharts from '@/components/organisms/InvoiceDashboardChartsV2';
import { FileText } from 'lucide-react';
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
    
    // Apply search filter
    if (debouncedSearchTerm && filtered) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
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
    if (selectedStatuses.length > 0 && filtered) {
      filtered = filtered.filter((invoice) => {
        const invoiceStatus = invoice.status?.toLowerCase() || 'pending'; // Default to 'pending' if status is undefined
        return selectedStatuses.some(
          (status) => status.toLowerCase() === invoiceStatus
        );
      });
    }

    setFilteredInvoices(filtered || []);
  }, [allInvoices, debouncedSearchTerm, selectedStatuses, areInvoicesLoading]);

  // As soon as you enter /home, you'll load the necessary data
  useEffect(() => {
    applyFilters();
  }, [allInvoices, debouncedSearchTerm, selectedStatuses, applyFilters]);

  if (areInvoicesLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-32 bg-gray-200 rounded"></div>
          <div className="h-64 w-full max-w-4xl bg-gray-200 rounded"></div>
          <div className="h-12 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  console.log(filteredInvoices);

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8'>
        <main className='flex w-full flex-col items-start gap-6'>
          <CaiExpirationWarning />

          {filteredInvoices.length === 0 ? (
            <div className='w-full items-center'>
              <GenericEmptyState
                icon={FileText}
                title='No tienes facturas aún'
                description='Comienza a crear facturas para tus clientes y visualiza tu progreso.'
              />
            </div>
          ) : (
            <InvoiceDashboardCharts invoices={filteredInvoices} />
          )}
        </main>
      </div>
    </div>
  );
}
