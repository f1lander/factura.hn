'use client';
import React, { useState } from 'react';
import { invoiceService } from '@/lib/supabase/services/invoice';
import InvoiceDashboardCharts from '@/components/organisms/InvoiceDashboardChartsV2';
import { useQuery } from '@tanstack/react-query';
import CaiExpirationWarning from '@/components/molecules/CaiExpirationWarning';
import { companyService } from '@/lib/supabase/services/company';
import { endOfMonth, startOfMonth } from 'date-fns';

export default function Dashboard() {
  const { data: companyId } = useQuery(['companyId'], () =>
    companyService.getCompanyId()
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]); // Needless

  const {
    data: allInvoices,
    isLoading: areInvoicesLoading,
    isFetching: areInvoicesFetching,
  } = useQuery(
    ['allInvoices', companyId, dateRange],
    () =>
      invoiceService.getInvoices({
        dateRange: dateRange,
      }),
    { enabled: !!companyId, keepPreviousData: true }
  );

  const isLoading = areInvoicesLoading || areInvoicesFetching;

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col px-4 pb-6 pt-4 sm:px-6 lg:px-8'>
        <main className='flex w-full flex-col items-start gap-6'>
          <CaiExpirationWarning />
          <InvoiceDashboardCharts
            invoices={allInvoices!}
            dateRange={dateRange}
            setDateRange={setDateRange}
            isLoading={isLoading}
            setSelectedStatuses={setSelectedStatuses}
          />
        </main>
      </div>
    </div>
  );
}
