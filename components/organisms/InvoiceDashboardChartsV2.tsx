"use client";
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
  Line,
  LineChart,
  ResponsiveContainer,
  LabelList
} from 'recharts';
  import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Invoice } from '@/lib/supabase/services/invoice';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { DatePicker } from '@/components/ui/date-picker';
import { TrendingUp, TrendingDown, CalendarIcon } from 'lucide-react';


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

// Define chart colors using CSS variables
const COLORS = {
  paid: "var(--color-paid)",          // Primary blue
  pending: "var(--color-pending)",    // Light blue
  cancelled: "var(--color-cancelled)",// Medium blue
  product: "var(--color-product)",    // Primary blue
  service: "var(--color-service)",    // Light blue
  revenue: "var(--color-revenue)"     // Primary blue
};

// Define chart configs
const invoiceStatusChartConfig = {
  pending: {
    label: "Pendiente",
    color: "hsl(var(--chart-2))",
  },
  paid: {
    label: "Pagada",
    color: "hsl(var(--chart-1))",
  },
  cancelled: {
    label: "Cancelada",
    color: "hsl(var(--chart-3))",
  },
};

const productServiceChartConfig = {
  product: {
    label: "Productos",
    color: "hsl(var(--chart-1))",
  },
  service: {
    label: "Servicios",
    color: "hsl(var(--chart-2))",
  },
};

const revenueChartConfig = {
  value: {
    label: "Ingresos",
    color: "hsl(var(--chart-1))",
  },
};

// Define an additional chart config for the interactive invoice chart
const invoiceInteractiveChartConfig = {
  invoices: {
    label: "Facturas",
  },
  pending: {
    label: "Pendiente",
    color: "hsl(var(--chart-2))",
  },
  paid: {
    label: "Pagada",
    color: "hsl(var(--chart-1))",
  },
  cancelled: {
    label: "Cancelada",
    color: "hsl(var(--chart-3))",
  },
  total: {
    label: "Total",
    color: "hsl(var(--chart-4))",
  },
};

const InvoiceDashboardChartsV2 = ({ invoices }: { invoices: Invoice[] }) => {
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });

  // New state for the interactive chart
  const [activeInvoiceType, setActiveInvoiceType] =
    React.useState<'paid' | 'pending' | 'cancelled' | 'total'>('total');

  // Filter invoices based on date range
  const getFilteredInvoices = () => {
    if (!dateRange.start || !dateRange.end) return invoices;

    return invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate >= dateRange.start! && invoiceDate <= dateRange.end!;
    });
  };

  const filteredInvoices = getFilteredInvoices();

  // New function to get daily invoice data for the interactive chart
  const getDailyInvoiceData = () => {
    // Create a map to store invoice counts by date
    const dailyData: Record<string, { paid: number; pending: number; cancelled: number; total: number }> = {};

    // Get date range to ensure we have entries for all days
    const start = dateRange.start || new Date();
    const end = dateRange.end || new Date();
    let currentDate = new Date(start);

    // Initialize all dates in range with zero values
    while (currentDate <= end) {
      const dateKey = format(currentDate, 'yyyy-MM-dd');
      dailyData[dateKey] = { paid: 0, pending: 0, cancelled: 0, total: 0 };
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill with actual data
    filteredInvoices.forEach(invoice => {
      const dateKey = format(new Date(invoice.date), 'yyyy-MM-dd');
      if (dailyData[dateKey]) {
        dailyData[dateKey][invoice.status]++;
        // Only count non-cancelled invoices in total
        if (invoice.status !== 'cancelled') {
          dailyData[dateKey].total++;
        }
      }
    });

    // Convert to array format for the chart
    return Object.entries(dailyData).map(([date, counts]) => ({
      date,
      paid: counts.paid,
      pending: counts.pending,
      cancelled: counts.cancelled,
      total: counts.total
    }));
  };

  // Calculate totals for each status
  const invoiceTotals = React.useMemo(() => {
    const totals = {
      paid: {
        count: filteredInvoices.filter(inv => inv.status === 'paid').length,
        amount: filteredInvoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.total, 0)
      },
      pending: {
        count: filteredInvoices.filter(inv => inv.status === 'pending').length,
        amount: filteredInvoices.filter(inv => inv.status === 'pending').reduce((acc, inv) => acc + inv.total, 0)
      },
      cancelled: {
        count: filteredInvoices.filter(inv => inv.status === 'cancelled').length,
        amount: filteredInvoices.filter(inv => inv.status === 'cancelled').reduce((acc, inv) => acc + inv.total, 0)
      },
      total: {
        count: filteredInvoices.filter(inv => inv.status !== 'cancelled').length,
        amount: filteredInvoices.filter(inv => inv.status !== 'cancelled').reduce((acc, inv) => acc + inv.total, 0)
      }
    };
    return totals;
  }, [filteredInvoices]);

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
      { name: 'Pendiente', value: statusCounts.pending, fill: COLORS.pending },
      { name: 'Pagada', value: statusCounts.paid, fill: COLORS.paid },
      { name: 'Cancelada', value: statusCounts.cancelled, fill: COLORS.cancelled }
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
      { name: 'Productos', value: salesByType.product, fill: COLORS.product },
      { name: 'Servicios', value: salesByType.service, fill: COLORS.service }
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
      value: revenue
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
      value: revenue
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

  // Calculate trend percentage
  const calculateTrend = () => {
    const revenue = getMonthlyRevenue();
    if (revenue.length < 2) return { percentage: 0, isUp: true };

    const currentMonth = revenue[revenue.length - 1].value;
    const previousMonth = revenue[revenue.length - 2].value;

    if (previousMonth === 0) return { percentage: 100, isUp: true };

    const percentage = ((currentMonth - previousMonth) / previousMonth) * 100;
    return {
      percentage: Math.abs(percentage).toFixed(1),
      isUp: percentage >= 0
    };
  };

  const trend = calculateTrend();

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Interactive Invoice Chart */}
      <Card className='flex-grow basis-full'>
        <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
          <div className='flex flex-1 flex-col justify-center gap-1 p-4 sm:py-5 sm:max-w-[40%]'>
            <CardTitle className="text-base sm:text-lg">Resumen de Facturas</CardTitle>
            <div className='flex flex-col items-start gap-1 text-xs'>
              <div className="flex gap-2 flex-wrap">
                <DatePicker
                  value={dateRange.start}
                  onChange={(date) => setDateRange({ ...dateRange, start: date })}
                  className="w-[120px] text-xs"
                />
                <DatePicker
                  value={dateRange.end}
                  onChange={(date) => setDateRange({ ...dateRange, end: date })}
                  className="w-[120px] text-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={setCurrentMonth}
                  className="text-xs"
                >
                  Mes actual
                </Button>
              </div>
            </div>
          </div>
          <div className='flex flex-wrap flex-grow sm:max-w-[60%]'>
            {['total', 'paid', 'pending', 'cancelled'].map((key) => {
              const statusKey = key as keyof typeof invoiceTotals;
              const statusColorClass =
                statusKey === 'paid' ? 'bg-green-50 border-green-100' :
                  statusKey === 'pending' ? 'bg-yellow-50 border-yellow-100' :
                    statusKey === 'cancelled' ? 'bg-red-50 border-red-100' :
                      'bg-gray-50 border-gray-100';

              const textColorClass =
                statusKey === 'paid' ? 'text-green-700' :
                  statusKey === 'pending' ? 'text-yellow-700' :
                    statusKey === 'cancelled' ? 'text-red-700' :
                      'text-gray-700';

              return (
                <button
                  key={statusKey}
                  data-active={activeInvoiceType === statusKey}
                  className={`relative z-30 flex flex-1 basis-1/2 sm:basis-auto flex-col justify-center gap-1 border-t px-3 py-2 text-left even:border-l 
                    sm:border-l sm:border-t-0 sm:px-4 sm:py-5 
                    ${statusColorClass} 
                    data-[active=true]:bg-slate-200 
                    data-[active=true]:font-bold
                    data-[active=true]:shadow-sm
                    transition-all duration-150`}
                  onClick={() => setActiveInvoiceType(statusKey)}
                >
                  <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                    {invoiceInteractiveChartConfig[statusKey].label}
                  </span>
                  <div className="flex flex-col">
                    <span data-active={activeInvoiceType === statusKey} className={`text-base sm:text-lg font-semibold leading-none sm:text-2xl 
                    data-[active=true]:text-xl sm:data-[active=true]:text-3xl data-[active=true]:font-extrabold ${textColorClass}`}>
                      {invoiceTotals[statusKey].count.toLocaleString()}
                    </span>
                    <span data-active={activeInvoiceType === statusKey} className={`text-xs sm:text-sm font-medium mt-1 
                    data-[active=true]:text-sm sm:data-[active=true]:text-lg data-[active=true]:font-bold ${textColorClass}`}>
                      L. {invoiceTotals[statusKey].amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <ChartContainer
            config={invoiceInteractiveChartConfig}
            className="aspect-auto h-[400px] sm:h-[250px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer
                data={getDailyInvoiceData()}
                margin={{
                  top: 10,
                  left: 0,
                  right: 0,
                  bottom: 20
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={10}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return format(date, 'dd MMM', { locale: es });
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="w-[150px]"
                      nameKey="invoices"
                      labelFormatter={(value) => {
                        return format(new Date(value), 'dd MMM yyyy', { locale: es });
                      }}
                    />
                  }
                />
                <Bar
                  dataKey={activeInvoiceType}
                  fill={`var(--color-${activeInvoiceType})`}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className='flex flex-wrap gap-4'>
        {/* Estado de Facturas */}
        <Card className='flex-grow basis-full sm:basis-[calc(33.333%-1rem)]'>
          <CardHeader>
            <CardTitle>Estado de Facturas</CardTitle>
            <CardDescription>Distribución de estados de facturas</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] px-2 sm:px-6">
            {filteredInvoices.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <ChartContainer
                    config={invoiceStatusChartConfig}
                    className="mx-auto w-full max-w-[180px] sm:max-w-[220px] aspect-square [&_.recharts-text]:fill-background"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={getInvoicesByStatus()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name}` : ''
                        }
                        labelLine={false}
                      >
                        {getInvoicesByStatus().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {getInvoicesByStatus().map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: entry.fill }}
                      ></div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-medium">{entry.name}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">{entry.value} facturas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>

        {/* Ventas por Producto y Servicio */}
        <Card className='flex-grow basis-full sm:basis-[calc(33.333%-1rem)]'>
          <CardHeader>
            <CardTitle>Ventas por Tipo</CardTitle>
            <CardDescription>Productos vs Servicios</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px] px-2 sm:px-6">
            {filteredInvoices.length > 0 ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <ChartContainer
                    config={productServiceChartConfig}
                    className="mx-auto w-full max-w-[180px] sm:max-w-[220px] aspect-square [&_.recharts-text]:fill-background"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={getSalesByProductType()}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        label={({ name, percent }) => 
                          percent > 0.05 ? `${name}` : ''
                        }
                        labelLine={false}
                      >
                        {getSalesByProductType().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {getSalesByProductType().map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: entry.fill }}
                      ></div>
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-medium">{entry.name}</span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          L. {entry.value.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
          <CardContent className="p-2 sm:p-6">
            {filteredInvoices.length > 0 ? (
              <ChartContainer
                config={revenueChartConfig}
                className="h-[400px] sm:h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    accessibilityLayer
                    data={getMonthlyRevenue()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `${(value / 1000).toFixed(0)}k`
                          : value.toString()
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="value"
                      name="Ingresos"
                      fill="var(--color-value)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-xs sm:text-sm p-4">
            <div className="flex gap-2 font-medium leading-none">
              {trend.isUp ? (
                <>
                  Tendencia al alza por {trend.percentage}% este mes <TrendingUp className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  Tendencia a la baja por {trend.percentage}% este mes <TrendingDown className="h-4 w-4 text-red-500" />
                </>
              )}
            </div>
            <div className="leading-none text-muted-foreground">
              Mostrando ingresos totales de los últimos 3 meses
            </div>
          </CardFooter>
        </Card>

        {/* Ingresos Diarios (Line - Last 7 days) */}
        <Card className='flex-grow basis-full sm:basis-[calc(50%-0.5rem)] w-[395px] lg:w-full'>
          <CardHeader>
            <CardTitle>Ingresos Diarios</CardTitle>
            <CardDescription>Últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {filteredInvoices.length > 0 ? (
              <ChartContainer
                config={revenueChartConfig}
                className="h-[400px] sm:h-[250px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    accessibilityLayer
                    data={getDailyRevenue()}
                    margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => value.split(' ')[0]} // Show only the day name
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000
                          ? `${(value / 1000).toFixed(0)}k`
                          : value.toString()
                      }
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip
                      content={<ChartTooltipContent />}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      name="Ingresos"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-xs sm:text-sm p-4">
            <div className="leading-none text-muted-foreground">
              Mostrando ingresos diarios de los últimos 7 días
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default InvoiceDashboardChartsV2; 