'use client';
import React, { useState } from 'react';
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
  FilterXIcon,
  Calendar,
  Calculator,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Receipt,
  Truck,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Invoice } from '@/lib/supabase/services/invoice';

import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

const statusMap: { [key: string]: string } = {
  Pagadas: 'paid',
  Pendientes: 'pending',
  Anuladas: 'cancelled',
};

export const getStatusBadge = (status: string, delivered?: boolean) => {
  const deliveredMessage = delivered ? ' / Entregada' : '';

  switch (status.toLowerCase()) {
    case 'pagadas':
    case 'paid':
      return (
        <Badge className='bg-green-500 text-white'>
          Pagada{deliveredMessage}
        </Badge>
      );
    case 'pendientes':
    case 'pending':
      return (
        <Badge className='bg-yellow-500 text-white'>
          Pendiente{deliveredMessage}
        </Badge>
      );
    case 'anuladas':
    case 'cancelled':
      return (
        <Badge className='bg-red-500 text-white'>
          Anulada{deliveredMessage}
        </Badge>
      );
    default:
      return null;
  }
};

export const getInvoiceStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pagadas':
    case 'paid':
      return 'bg-green-100 text-green-500';
    case 'pendientes':
    case 'pending':
      return 'bg-yellow-100 text-yellow-500';
    case 'anuladas':
    case 'cancelled':
      return 'bg-red-100 text-red-500';
    default:
      return 'bg-gray-100 text-gray-500';
  }
};

export interface InvoicesTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onSearch: (searchTerm: string) => void;
  onDateRangeChange: (
    startDate: Date | undefined,
    endDate: Date | undefined
  ) => void;
  onStatusFilterChange: (statuses: string[]) => void;
  selectedStatuses: string[];
  onDateSearch: () => void;
  onUpdateStatus: (invoiceIds: string[], newStatus: string) => void;
}

const InvoiceStatusButtons = ({
  selectedInvoices,
  onUpdateStatus,
}: {
  selectedInvoices: string[];
  onUpdateStatus: (newStatus: string) => void;
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const handleOpenDialog = (action: string) => {
    setCurrentAction(action);
    setIsDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (currentAction) {
      onUpdateStatus(currentAction);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className='mb-4 flex gap-2'>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <div className='flex flex-col sm:flex-row gap-2 w-full'>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog('paid')}
              disabled={selectedInvoices.length === 0}
              className='w-full sm:w-auto bg-green-500 hover:bg-green-300 text-foreground'
            >
              <CheckCircle className='mr-2 h-4 w-4' />
              Pagada
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog('cancelled')}
              disabled={selectedInvoices.length === 0}
              className='w-full sm:w-auto bg-white text-foreground border-2 border-red-300 hover:bg-red-50'
            >
              <XCircle className='mr-2 h-4 w-4' />
              Anular
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              onClick={() => handleOpenDialog('Delivered')}
              disabled={selectedInvoices.length === 0}
              className='w-full sm:w-auto bg-white text-foreground border-2 border-blue-300 hover:bg-blue-50'
            >
              <Truck className='mr-2 h-4 w-4' />
              Producto Entregado
            </Button>
          </DialogTrigger>
        </div>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
            <DialogDescription>
              {
                {
                  paid: `¿Está seguro de que desea marcar ${selectedInvoices.length} factura(s) como pagada?`,
                  cancelled: `¿Está seguro de que desea anular ${selectedInvoices.length} factura(s)?`,
                  Delivered: `¿Está seguro de que desea marcar ${selectedInvoices.length} factura(s) como entregada?`,
                }[currentAction!]
              }
              {/* {currentAction === 'paid'
                ? `¿Está seguro de que desea marcar ${selectedInvoices.length} factura(s) como pagadas?`
                : `¿Está seguro de que desea anular ${selectedInvoices.length} factura(s)?`} */}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} variant='outline'>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAction} type='submit'>
              {
                {
                  paid: 'Marcar como pagada',
                  cancelled: 'Anular factura',
                  Delivered: 'Marcar como entregada',
                }[currentAction!]
              }
              {/* {currentAction === 'paid'
                ? 'Marcar como pagada'
                : 'Anular factura'} */}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const InvoicesTable: React.FC<InvoicesTableProps> = ({
  invoices,
  onSelectInvoice,
  onSearch,
  onDateRangeChange,
  onStatusFilterChange,
  onDateSearch,
  onUpdateStatus,
  selectedStatuses,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onSearch(newSearchTerm);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    setStartDate(date);
    onDateRangeChange(date, endDate);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    setEndDate(date);
    onDateRangeChange(startDate, date);
  };

  const handleStatusChange = (status: string) => {
    console.log('selectedStatuses', selectedStatuses);
    const dbStatus = statusMap[status] || status.toLowerCase();
    const updatedStatuses = selectedStatuses.includes(dbStatus)
      ? selectedStatuses.filter((s) => s !== dbStatus)
      : [...selectedStatuses, dbStatus];
    onStatusFilterChange(updatedStatuses);
  };

  const handleOnClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    onDateRangeChange(undefined, undefined);
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(invoices.map((invoice) => invoice.id));
    } else {
      setSelectedInvoices([]);
    }
  };

  const handleInvoiceSelect = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId]);
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invoiceId));
    }
  };

  const handleUpdateStatus = (newStatus: string) => {
    onUpdateStatus(selectedInvoices, newStatus);
    setSelectedInvoices([]);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can adjust this as needed

  // Calculate total pages
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return invoices.slice(startIndex, endIndex);
  };
  return (
    <div className='flex w-full flex-col gap-4'>
      <div className='flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 w-full'>
        <div className='w-full lg:w-1/3'>
          <Input
            placeholder='Buscar facturas...'
            value={searchTerm}
            onChange={handleSearchChange}
            className='w-full bg-white'
          />
        </div>
        <div className='flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full lg:w-2/3'>
          <div className='flex flex-row space-x-2 w-full md:w-3/5'>
            <DatePicker onChange={handleStartDateChange} className='w-1/2' />
            <DatePicker onChange={handleEndDateChange} className='w-1/2' />
          </div>
          <div className='flex flex-row space-x-2 w-full md:w-2/5 items-center'>
            <Button
              size='sm'
              className='w-1/2 gap-2 bg-white text-foreground border-2 border-blue-300 hover:bg-blue-50'
              onClick={handleOnClearDates}
            >
              Limpiar Filtros
              <FilterXIcon className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              className='w-1/2 gap-2 bg-white text-foreground border-2 border-violet-300 hover:bg-violet-50'
              onClick={onDateSearch}
            >
              Buscar
              <Search className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className='px-7 flex flex-col items-start justify-between md:flex-row md:items-center'>
          <CardTitle className='w-full'>Facturas recientes</CardTitle>
          <div className='flex flex-row items-start gap-2  md:items-center md:justify-between'>
            <Toggle
              pressed={selectedStatuses.includes('paid')}
              onPressedChange={() => handleStatusChange('paid')}
              className='h-8 px-3 py-1 transition-colors duration-200 bg-green-500 text-white hover:bg-green-500/90'
            >
              Pagadas
            </Toggle>
            <Toggle
              pressed={selectedStatuses.includes('pending')}
              onPressedChange={() => handleStatusChange('pending')}
              className='h-8 px-3 py-1 transition-colors duration-200 bg-yellow-500 text-white hover:bg-yellow-500/90'
            >
              Pendientes
            </Toggle>
            <Toggle
              pressed={selectedStatuses.includes('cancelled')}
              onPressedChange={() => handleStatusChange('cancelled')}
              className='h-8 px-3 py-1 transition-colors duration-200 bg-red-500 text-white hover:bg-red-500/90'
            >
              Anuladas
            </Toggle>
          </div>
        </CardHeader>
        <CardContent>
          <InvoiceStatusButtons
            selectedInvoices={selectedInvoices}
            onUpdateStatus={handleUpdateStatus}
          />
          <EnhancedInvoiceTable
            invoices={invoices}
            selectedInvoices={selectedInvoices}
            onSelectInvoice={onSelectInvoice}
            handleSelectAllChange={handleSelectAllChange}
            handleInvoiceSelect={handleInvoiceSelect}
            getCurrentPageItems={getCurrentPageItems}
            getStatusBadge={getStatusBadge}
          />
        </CardContent>
        <CardFooter className='flex items-center justify-between'>
          <div>
            Página {currentPage} de {totalPages}
          </div>
          <div className='flex gap-2'>
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant='outline'
              size='sm'
            >
              <ChevronLeft className='h-4 w-4' />
              Anterior
            </Button>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant='outline'
              size='sm'
            >
              Siguiente
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

const EnhancedInvoiceTable = ({
  invoices,
  selectedInvoices,
  onSelectInvoice,
  handleSelectAllChange,
  handleInvoiceSelect,
  getCurrentPageItems,
  getStatusBadge,
}: any) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const [expandedRows, setExpandedRows] = useState<any>({});

  const toggleRow = (id: string) => {
    setExpandedRows((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <div className='hidden sm:block'>
        <Table>
          <TableHeader>
            <TableRow className='bg-muted/50'>
              <TableHead className='w-[50px]'>
                <Checkbox
                  checked={selectedInvoices.length === invoices.length}
                  onCheckedChange={handleSelectAllChange}
                />
              </TableHead>
              <TableHead className='font-semibold'>
                # Factura / Recibo
              </TableHead>
              <TableHead className='font-semibold'>Fecha</TableHead>
              <TableHead className='font-semibold'>Cliente</TableHead>
              <TableHead className='text-right font-semibold'>
                Subtotal
              </TableHead>
              <TableHead className='text-right font-semibold'>
                Impuesto
              </TableHead>
              <TableHead className='text-right font-semibold'>Total</TableHead>
              <TableHead className='font-semibold'>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getCurrentPageItems().map((invoice: Invoice) => (
              <TableRow
                key={invoice.id}
                className='cursor-pointer hover:bg-muted/50 transition-colors'
                onClick={() => onSelectInvoice(invoice)}
              >
                <TableCell
                  className='py-4'
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={selectedInvoices.includes(invoice.id)}
                    onCheckedChange={(checked) =>
                      handleInvoiceSelect(invoice.id, checked)
                    }
                  />
                </TableCell>
                <TableCell className='py-4'>
                  {invoice?.proforma_number
                    ? invoice?.proforma_number
                    : invoice.invoice_number}
                </TableCell>
                <TableCell className='py-4'>
                  {new Date(invoice.date).toLocaleDateString()}
                </TableCell>
                <TableCell className='py-4'>
                  <div className='flex items-center space-x-2'>
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(invoice.customers.name || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <span>{invoice.customers.name || invoice.customer_id}</span>
                  </div>
                </TableCell>
                <TableCell className='text-right py-4'>
                  {`Lps. ${invoice.subtotal.toLocaleString('en')}`}
                </TableCell>
                <TableCell className='text-right py-4'>
                  {`Lps. ${invoice.tax.toLocaleString('en')}`}
                </TableCell>
                <TableCell className='text-right py-4'>
                  {`Lps. ${invoice.total.toLocaleString('en')}`}
                </TableCell>
                <TableCell className='py-4'>
                  {getStatusBadge(invoice.status, !!invoice.delivered_date)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className='sm:hidden space-y-3'>
        {getCurrentPageItems().map((invoice: Invoice) => (
          <div
            key={invoice.id}
            className='bg-white rounded-lg border shadow-sm overflow-hidden'
          >
            {/* Main Content - Always Visible */}
            <div className='p-4'>
              {/* Header Row */}
              <div className='flex flex-col md:flex-row items-start justify-between mb-3 gap-2'>
                <div className='flex items-center gap-3'>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedInvoices.includes(invoice.id)}
                      onCheckedChange={(checked) =>
                        handleInvoiceSelect(invoice.id, checked)
                      }
                    />
                  </div>
                  <div className='flex items-center gap-2'>
                    <Receipt className='w-4 h-4 text-blue-500' />
                    <span className='font-medium'>
                      {invoice.invoice_number}
                    </span>
                  </div>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback
                      className={getInvoiceStatusColor(invoice.status)}
                    >
                      {getInitials(invoice.status || 'Pendiente')}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Customer and Date Row */}
              <div className='flex flex-col items-start justify-between mb-3 gap-3'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-8 w-8'>
                    <AvatarFallback className='bg-blue-100 text-blue-600'>
                      {getInitials(invoice.customers.name || 'Unknown')}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium'>
                    {invoice.customers.name || invoice.customer_id}
                  </span>
                </div>
                <div className='flex w-full items-center text-sm text-gray-500 gap-1'>
                  <Calendar className='w-4 h-4' />
                  <span>{new Date(invoice.date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Total Amount - Prominent Display */}
              <div className='flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md'>
                <div className='flex items-center gap-1 text-gray-600'>
                  <DollarSign className='w-4 h-4' />
                  <span>Total</span>
                </div>
                <span className='font-semibold text-green-600'>
                  {`Lps. ${invoice.total.toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Expandable Section Button */}
            <div
              className='border-t px-4 py-2 flex items-center justify-center gap-2 text-sm text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors'
              onClick={() => toggleRow(invoice.id)}
            >
              {expandedRows[invoice.id] ? (
                <>
                  <span>Ver menos</span>
                  <ChevronUp className='w-4 h-4' />
                </>
              ) : (
                <>
                  <span>Ver detalles</span>
                  <ChevronDown className='w-4 h-4' />
                </>
              )}
            </div>

            {/* Expanded Details */}
            {expandedRows[invoice.id] && (
              <div className='bg-gray-50 p-4 space-y-3 border-t'>
                <div className='grid grid-cols-2 gap-3'>
                  <div className='flex items-center gap-2'>
                    <Calculator className='w-4 h-4 text-gray-400' />
                    <div>
                      <div className='text-xs text-gray-500'>Subtotal</div>
                      <div className='font-medium'>{`Lps. ${invoice.subtotal.toLocaleString(
                        'en'
                      )}`}</div>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <CreditCard className='w-4 h-4 text-gray-400' />
                    <div>
                      <div className='text-xs text-gray-500'>Impuesto</div>
                      <div className='font-medium'>{`Lps. ${invoice.tax.toLocaleString(
                        'en'
                      )}`}</div>
                    </div>
                  </div>
                </div>

                <div
                  className='w-full text-center text-sm text-blue-600 cursor-pointer hover:text-blue-700 transition-colors'
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectInvoice(invoice);
                  }}
                >
                  Ver factura completa
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
