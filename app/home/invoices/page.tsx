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

import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

import { productService } from '@/lib/supabase/services/product';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import InvoiceView from '@/components/molecules/InvoiceView2';
import { InvoicesTable } from '@/components/molecules/InvoicesTable';
import { useDebounce } from '@/lib/hooks';
import { toast } from '@/components/ui/use-toast';
import { DialogTitle } from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import CreateInvoiceButton from '@/components/molecules/CreateInvoiceButton';
import { useCompanyStore } from '@/store/companyStore';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/lib/supabase/services/company';

const convertInvoicesToCSV = (invoices: Invoice[]) => {
  const headers = [
    'ID',
    'Fecha de Emisión',
    'Status',
    'Total de Productos (Sin ISV)',
    'Total de Servicios (Sin ISV)',
    'ISV 15%',
    'ISV 18%',
    'Total',
    'Método de Pago',
  ].join(',');

  const rows = invoices.map((invoice) => {
    // Calculate totals for products and services
    const productsTotal = invoice.invoice_items
      .filter((item) => !item.is_service)
      .reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);

    const servicesTotal = invoice.invoice_items
      .filter((item) => item.is_service)
      .reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);

    // Calculate ISV by rate
    const isv15Total = invoice.tax_gravado_15 || 0;
    // .filter((item) => item. === 15)
    // .reduce((sum, item) => sum + item.unit_cost * item.quantity * 0.15, 0);

    const isv18Total = invoice.tax_gravado_18 || 0;
    // .filter((item) => item.tax_rate === 18)
    // .reduce((sum, item) => sum + item.unit_cost * item.quantity * 0.18, 0);

    return [
      invoice.proforma_number || invoice.invoice_number,
      new Date(invoice.date).toLocaleDateString('es-HN'),
      invoice.status,
      productsTotal.toFixed(2),
      servicesTotal.toFixed(2),
      isv15Total.toFixed(2),
      isv18Total.toFixed(2),
      invoice.total.toFixed(2),
      invoice.payment_method?.name || 'N/A',
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: companyId } = useQuery(['companyId'], () =>
    companyService.getCompanyId()
  );
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const { data: allInvoices, isLoading: areInvoicesLoading } = useQuery(
    [
      'allInvoices',
      companyId,
      dateRange,
      selectedStatuses,
      debouncedSearchTerm,
    ],
    () =>
      invoiceService.getInvoices({
        dateRange: dateRange,
        statuses: selectedStatuses,
        searchTerm: debouncedSearchTerm,
      }),
    { placeholderData: [], enabled: !!companyId }
  );

  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { company } = useCompanyStore();
  const [isInvoiceContentReady, setIsInvoiceContentReady] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setIsInvoiceContentReady(true);
    } else {
      setIsInvoiceContentReady(false);
    }
  }, [isOpen, company]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        if (allInvoices) setFilteredInvoices(allInvoices);
        await fetchRevenue();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, [allInvoices]);

  // const applyFilters = useCallback(() => {
  //   let filtered: Invoice[] = [];
  //   if (!areInvoicesLoading && allInvoices) filtered = allInvoices;

  //   if (debouncedSearchTerm) {
  //     const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
  //     filtered = filtered.filter(
  //       (invoice) =>
  //         invoice.invoice_number.toLowerCase().includes(lowerSearchTerm) ||
  //         invoice.customers.name.toLowerCase().includes(lowerSearchTerm) ||
  //         invoice.total.toString().includes(lowerSearchTerm) ||
  //         invoice.invoice_items.some((item) =>
  //           item.description.toLowerCase().includes(lowerSearchTerm)
  //         )
  //     );
  //   }

  //   if (selectedStatuses.length > 0) {
  //     filtered = filtered.filter((invoice) => {
  //       const invoiceStatus = invoice.status?.toLowerCase() || 'pending'; // Default to 'pending' if status is undefined
  //       return selectedStatuses.some(
  //         (status) => status.toLowerCase() === invoiceStatus
  //       );
  //     });
  //   }

  //   setFilteredInvoices(filtered);
  // }, [allInvoices, debouncedSearchTerm, selectedStatuses, areInvoicesLoading]);

  // useEffect(() => {
  //   applyFilters();
  // }, [
  //   allInvoices,
  //   debouncedSearchTerm,
  //   selectedStatuses,
  //   dateRange,
  //   applyFilters,
  // ]);

  // STARTS HERE

  const fetchRevenue = async () => {
    const weeklyRev = await invoiceService.getTotalRevenue('week');
    const monthlyRev = await invoiceService.getTotalRevenue('month');
    console.log('Weekly Revenue:', weeklyRev);
    console.log('Monthly Revenue:', monthlyRev);
    setWeeklyRevenue(weeklyRev);
    setMonthlyRevenue(monthlyRev);
  };

  const handleInvoiceSelect = async (invoice: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setIsCreatingInvoice(false);
      setIsOpen(true);
    }
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      if (isCreatingInvoice) {
        savedInvoice = await invoiceService.createInvoiceWithItems(invoice);
      } else {
        savedInvoice = await invoiceService.updateInvoiceWithItems(
          invoice.id,
          invoice
        );
      }

      if (!savedInvoice) {
        throw new Error('Failed to save invoice');
      }

      setSelectedInvoice(savedInvoice);
      setIsCreatingInvoice(false);
      if (allInvoices) setFilteredInvoices(allInvoices);
      setIsOpen(false);
    } catch (error) {
      console.error('An error occurred while saving the invoice:', error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleDateRangeChange = (
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
  };
  // const handleDateSearch = () => {
  //   if (dateRange.start && dateRange.end) {
  //     const filtered = filteredInvoices.filter((invoice) => {
  //       const invoiceDate = new Date(invoice.date);
  //       return invoiceDate >= dateRange.start! && invoiceDate <= dateRange.end!;
  //     });
  //     setFilteredInvoices(filtered);
  //   }
  // };

  const handleExportCSV = () => {
    try {
      if (!allInvoices?.length) {
        return toast({
          title: 'No hay facturas',
          description: 'No hay facturas para exportar',
          variant: 'destructive',
        });
      }

      const csvContent = convertInvoicesToCSV(allInvoices);
      const blob = new Blob([csvContent], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const startDate = dateRange.start?.toISOString().split('T')[0];
      const endDate = dateRange.end?.toISOString().split('T')[0];

      link.href = url;
      link.setAttribute(
        'download',
        `${!startDate && !endDate ? 'todas-las-' : ''}facturas${
          startDate ? `-desde-${startDate}` : ''
        }${endDate ? `-hasta-${endDate}` : ''}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Exportación exitosa',
        description: 'Las facturas han sido exportadas correctamente',
      });
    } catch (error) {
      console.error('Error exporting invoices:', error);
      toast({
        title: 'Error',
        description: 'No se pudo exportar las facturas',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async () => {
    try {
      // This is a placeholder for the actual export logic
      console.log('Exporting invoices:', filteredInvoices);

      // Simulate file download
      const blob = new Blob([JSON.stringify(filteredInvoices, null, 2)], {
        type: 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices-export.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting invoices:', error);
    }
  };

  const handleUpdateStatus = useCallback(
    async (invoiceIds: string[], newStatus: string) => {
      // Handle inventory update for delivered status
      if (newStatus === 'Delivered') {
        for (const invoiceId of invoiceIds) {
          const invoice = await invoiceService.getInvoiceById(invoiceId);
          const updateProducts = invoice?.invoice_items
            .filter((item) => !item.is_service)
            .map((item) => ({
              product_id: item.product_id,
              quantity_delta: item.quantity,
            }));
          const isDelivered = !!invoice?.delivered_date;

          if (isDelivered) {
            return toast({
              title: 'Error',
              description: 'La factura ya ha sido entregada',
              variant: 'destructive',
            });
          }

          if (invoice?.status !== 'paid' && invoice?.status !== 'pending') {
            return toast({
              title: 'Error',
              description:
                'La factura debe estar pagada o pendiente para ser entregada',
              variant: 'destructive',
            });
          }

          if (updateProducts && updateProducts.length > 0) {
            const order = {
              type: 'DELETE' as const,
              invoice_id: invoiceId,
              update_products: updateProducts,
              reason_description: `Productos entregados para factura ${invoice?.invoice_number}`,
            };

            const productOrder =
              await productService.generateProductRegisterOrder(order);
            if (productOrder?.id) {
              await productService.updateInventory(productOrder.id);
            }
          }
        }
        return toast({
          title: 'Estado Actualizado',
          description: `Se actualizaron correctamente ${invoiceIds.length} factura(s) a ${newStatus}`,
        });
      }

      try {
        await invoiceService.updateInvoicesStatus(invoiceIds, newStatus);
        // Refresh the invoices list after updating
        // fetchInvoices();
        toast({
          title: 'Estado Actualizado',
          description: `Se actualizaron correctamente ${invoiceIds.length} factura(s) a ${newStatus}`,
        });
      } catch (error) {
        console.error('Error updating invoice statuses:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron actualizar los estados de las facturas. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
      }
    },
    []
  );

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

    const weeklyPercentage =
      monthlyRevenue !== 0 ? (weeklyRevenue / monthlyRevenue) * 100 : 0;
    if (areInvoicesLoading) return <div>Cargando invoices</div>;

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
            <CreateInvoiceButton />
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
        </Card>
      </div>
    );
  };

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col p-0 md:p-6 sm:gap-4 lg:p-12'>
        <main className='flex w-full flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
          <WidgetsSection />
          <InvoicesTable
            invoices={filteredInvoices}
            onSelectInvoice={handleInvoiceSelect}
            onSearch={handleSearch}
            onDateRangeChange={handleDateRangeChange}
            onStatusFilterChange={handleStatusFilterChange}
            selectedStatuses={selectedStatuses}
            handleExportCSV={
              filteredInvoices.length > 0 ? handleExportCSV : undefined
            }
            // onDateSearch={handleDateSearch}
            onUpdateStatus={handleUpdateStatus}
          />
        </main>
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className='dialog-X sm:max-w-[900px] h-[90vh] p-1'>
          <DialogHeader>
            <VisuallyHidden.Root>
              <DialogTitle></DialogTitle>
            </VisuallyHidden.Root>
          </DialogHeader>
          {isInvoiceContentReady && (
            <div className='h-full overflow-y-auto px-0 md:px-4 py-6'>
              {(selectedInvoice || isCreatingInvoice) && company && (
                <InvoiceView
                  invoice={selectedInvoice}
                  isEditable={isCreatingInvoice || !selectedInvoice}
                  onSave={handleSaveInvoice}
                />
              )}
            </div>
          )}
          {!isInvoiceContentReady && (
            <div className='flex items-center justify-center h-full'>
              Loading...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
