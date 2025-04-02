"use client";
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Bar,
  BarChart,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
  TooltipProps,
  ResponsiveContainer
} from 'recharts';
import { Invoice } from '@/lib/supabase/services/invoice';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@/components/ui/date-picker';

const SkeletonLoader = () => (
  <div className='space-y-2'>
    <Skeleton className='h-4 w-[250px]' />
    <Skeleton className='h-4 w-[200px]' />
  </div>
);

const ChartSkeleton = () => (
  <div className='w-full h-full flex items-center justify-center bg-muted rounded-md p-4'>
    <Skeleton className='h-[150px] w-[150px] rounded-full' />
  </div>
);

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-sm">
        <p className="text-xs mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value && typeof entry.value === 'object' && 'getMonth' in entry.value
              ? format(entry.value as Date, 'PPP') 
              : typeof entry.value === 'number' 
                ? `L. ${entry.value.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`
                : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = {
  paid: "hsl(142.1, 76.2%, 36.3%)",       // Green
  pending: "hsl(48, 96.5%, 53.9%)",       // Yellow
  cancelled: "hsl(346.8, 77.2%, 49.8%)",  // Red
  product: "hsl(142.1, 76.2%, 36.3%)",    // Green
  service: "hsl(48, 96.5%, 53.9%)",       // Yellow
  revenue: "hsl(224.3, 76.3%, 48%)"       // Blue
};

const InvoiceDashboardCharts = ({ invoices }: { invoices: Invoice[] }) => {
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  // Filter invoices based on date range
  const getFilteredInvoices = () => {
    if (!dateRange.start || !dateRange.end) return invoices;
    
    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= dateRange.start! && invoiceDate <= dateRange.end!;
    });
  };

  const filteredInvoices = getFilteredInvoices();

  // Helper functions
  const getInvoicesByStatus = () => {
    const statusCounts = { 
      pending: 0, 
      paid: 0, 
      cancelled: 0 
    };
    
    filteredInvoices.forEach((invoice) => {
      if (statusCounts[invoice.status] !== undefined) {
        statusCounts[invoice.status]++;
      }
    });
    
    return [
      { name: 'Pendiente', value: statusCounts.pending, color: COLORS.pending },
      { name: 'Pagada', value: statusCounts.paid, color: COLORS.paid },
      { name: 'Cancelada', value: statusCounts.cancelled, color: COLORS.cancelled }
    ];
  };

  // Get sales by product/service
  const getSalesByProductType = () => {
    const salesByType = { product: 0, service: 0 };
    
    filteredInvoices.forEach(invoice => {
      invoice.invoice_items.forEach(item => {
        const type = item.is_service ? 'service' : 'product';
        salesByType[type] += item.quantity * item.unit_cost;
      });
    });
    
    return [
      { name: 'Productos', value: salesByType.product, color: COLORS.product },
      { name: 'Servicios', value: salesByType.service, color: COLORS.service }
    ];
  };

  // Get monthly revenue (for quarterly rolling view)
  const getMonthlyRevenue = () => {
    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 3 months with zero values
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = format(date, 'MMM', { locale: es });
      monthlyRevenue[monthName] = 0;
    }
    
    // Fill in actual revenue data
    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const monthName = format(date, 'MMM', { locale: es });
      if (monthlyRevenue[monthName] !== undefined) {
        monthlyRevenue[monthName] += invoice.total;
      }
    });
    
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      name: month,
      value: revenue,
      color: COLORS.revenue
    }));
  };

  // Get daily revenue (for 7-day rolling view)
  const getDailyRevenue = () => {
    const dailyRevenue: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i);
      const dayName = format(date, 'EEE', { locale: es });
      const formattedDate = format(date, 'dd/MM');
      dailyRevenue[`${dayName} ${formattedDate}`] = 0;
    }
    
    // Fill in actual revenue data
    filteredInvoices.forEach(invoice => {
      const date = new Date(invoice.date);
      const dayName = format(date, 'EEE', { locale: es });
      const formattedDate = format(date, 'dd/MM');
      const key = `${dayName} ${formattedDate}`;
      
      if (dailyRevenue[key] !== undefined) {
        dailyRevenue[key] += invoice.total;
      }
    });
    
    return Object.entries(dailyRevenue).map(([day, revenue]) => ({
      name: day,
      value: revenue,
      color: COLORS.revenue
    }));
  };

  const getTotalsByStatus = () => {
    const data = {
      total: { amount: 0, qty: 0 },
      pending: { amount: 0, qty: 0 },
      paid: { amount: 0, qty: 0 },
      cancelled: { amount: 0, qty: 0 },
    };

    filteredInvoices.forEach((invoice) => {
      if (invoice.status !== 'cancelled') {
        data.total.amount += invoice.total;
        data.total.qty += 1;
      }
      data[invoice.status].amount += invoice.total;
      data[invoice.status].qty += 1;
    });

    return data;
  };

  const setCurrentMonth = () => {
    setDateRange({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    });
  };

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Row 1 */}
      <div className='flex flex-wrap gap-4'>
        {/* Resumen de Facturas */}
        <Card className='flex-grow basis-full sm:basis-[calc(33.333%-1rem)]'>
          <CardHeader className='flex-col space-y-2'>
            <div className='flex justify-between w-full'>
              <div>
                <CardTitle>Resumen de Facturas</CardTitle>
                <CardDescription>Totales y cantidades por estado</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setCurrentMonth}
                className="text-xs"
              >
                Mes actual
              </Button>
            </div>
            <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 text-sm'>
              <div className="flex gap-2 items-center w-full justify-between">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Rango personalizado</span>
                </div>
                <div className="flex gap-2">
                  <DatePicker
                    value={dateRange.start}
                    onChange={(date) => setDateRange({ ...dateRange, start: date })}
                    className="w-[130px] sm:w-[150px] text-xs sm:text-sm"
                  />
                  <DatePicker
                    value={dateRange.end}
                    onChange={(date) => setDateRange({ ...dateRange, end: date })}
                    className="w-[130px] sm:w-[150px] text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredInvoices.length > 0 ? (
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 w-full'>
                {/* Total Card */}
                <div className='bg-gray-100 rounded-lg p-3 flex flex-col justify-between min-h-[80px]'>
                  <div className='text-sm font-medium text-gray-600'>
                    Total (No Canceladas)
                  </div>
                  <div>
                    <div className='text-xl font-bold'>
                      L. {getTotalsByStatus().total.amount.toLocaleString('es-HN', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className='text-sm text-gray-600'>
                      {getTotalsByStatus().total.qty} facturas
                    </div>
                  </div>
                </div>

                {/* Paid Card */}
                <div className='bg-green-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]'>
                  <div className='text-sm font-medium text-green-600'>
                    Pagadas
                  </div>
                  <div>
                    <div className='text-xl font-bold text-green-700'>
                      L. {getTotalsByStatus().paid.amount.toLocaleString('es-HN', {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                    <div className='text-sm text-green-600'>
                      {getTotalsByStatus().paid.qty} facturas
                    </div>
                  </div>
                </div>

                {/* Pending Card */}
                <div className='bg-yellow-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]'>
                  <div className='text-sm font-medium text-yellow-600'>
                    Pendientes
                  </div>
                  <div>
                    <div className='text-xl font-bold text-yellow-700'>
                      L. {getTotalsByStatus().pending.amount.toLocaleString(
                        'es-HN',
                        { minimumFractionDigits: 2 }
                      )}
                    </div>
                    <div className='text-sm text-yellow-600'>
                      {getTotalsByStatus().pending.qty} facturas
                    </div>
                  </div>
                </div>

                {/* Cancelled Card */}
                <div className='bg-red-50 rounded-lg p-3 flex flex-col justify-between min-h-[80px]'>
                  <div className='text-sm font-medium text-red-600'>
                    Canceladas
                  </div>
                  <div>
                    <div className='text-xl font-bold text-red-700'>
                      L. {getTotalsByStatus().cancelled.amount.toLocaleString(
                        'es-HN',
                        { minimumFractionDigits: 2 }
                      )}
                    </div>
                    <div className='text-sm text-red-600'>
                      {getTotalsByStatus().cancelled.qty} facturas
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <SkeletonLoader />
            )}
          </CardContent>
        </Card>

        {/* Estado de Facturas */}
        <Card className='flex-grow basis-full sm:basis-[calc(33.333%-1rem)]'>
          <CardHeader>
            <CardTitle>Estado de Facturas</CardTitle>
            <CardDescription>Distribución de estados de facturas</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {filteredInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={getInvoicesByStatus()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getInvoicesByStatus().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>

        {/* Ventas por Producto y Servicio */}
        <Card className='flex-grow basis-full sm:basis-[calc(33.333%-1rem)]'>
          <CardHeader>
            <CardTitle>Ventas por Producto y Servicio</CardTitle>
            <CardDescription>Distribución de ventas</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {filteredInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Pie
                    data={getSalesByProductType()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {getSalesByProductType().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2 */}
      <div className='flex flex-wrap gap-4'>
        {/* Ingresos Mensuales (Bar - Quarterly-rolling) */}
        <Card className='flex-grow basis-full sm:basis-[calc(50%-0.5rem)]'>
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Últimos 3 meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {filteredInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={getMonthlyRevenue()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    tickFormatter={(value) => 
                      value >= 1000 
                        ? `${(value / 1000).toFixed(0)}k` 
                        : value.toString()
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    name="Ingresos" 
                    fill={COLORS.revenue} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>

        {/* Ingresos Diarios (Bar - Last 7 days) */}
        <Card className='flex-grow basis-full sm:basis-[calc(50%-0.5rem)]'>
          <CardHeader>
            <CardTitle>Ingresos Diarios</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            {filteredInvoices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={getDailyRevenue()}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    tickFormatter={(value) => value.split(' ')[0]} // Show only the day name 
                  />
                  <YAxis 
                    tickFormatter={(value) => 
                      value >= 1000 
                        ? `${(value / 1000).toFixed(0)}k` 
                        : value.toString()
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    name="Ingresos" 
                    fill={COLORS.revenue} 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDashboardCharts;
