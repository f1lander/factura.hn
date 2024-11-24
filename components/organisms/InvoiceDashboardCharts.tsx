import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, BarChart, LineChart, PieChart, Area, Bar, Line, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Invoice } from '@/lib/supabase/services/invoice';

import { Skeleton } from "@/components/ui/skeleton";

const SkeletonLoader = () => (
  <div className="space-y-2">
    <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
  </div>
);

const ChartSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-muted rounded-md p-4">
    <Skeleton className="h-[150px] w-[150px] rounded-full" />
  </div>
);
const InvoiceDashboardCharts = ({ invoices }: { invoices: Invoice[] }) => {
  // Existing helper functions
  const getInvoicesByStatus = () => {
    const statusCounts = { pending: 0, paid: 0, cancelled: 0 };
    invoices.forEach(invoice => {
      statusCounts[invoice.status]++;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      status: translateStatus(status),
      count
    }));
  };

  const getMonthlyRevenue = () => {
    const monthlyRevenue: any = {};
    invoices.forEach(invoice => {
      const month = new Date(invoice.date).toLocaleString('es-ES', { month: 'short' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + invoice.total;
    });
    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue }));
  };

  const getTopCustomers = () => {
    const customerRevenue: { [key: string]: number } = {};
    invoices.forEach(invoice => {
      customerRevenue[invoice.customers.name] = (customerRevenue[invoice.customers.name] || 0) + invoice.total;
    });
    return Object.entries(customerRevenue)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, revenue]) => ({ name, revenue }));
  };

  // New helper functions
  const getTotalRevenue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const getAverageInvoiceValue = () => {
    const total = getTotalRevenue();
    return invoices.length > 0 ? total / invoices.length : 0;
  };

  const getWeeklyInvoiceCount = () => {
    const weeklyCount: any = {};
    invoices.forEach(invoice => {
      const week = getWeekNumber(new Date(invoice.date));
      weeklyCount[week] = (weeklyCount[week] || 0) + 1;
    });
    return Object.entries(weeklyCount).map(([week, count]) => ({ week: `Semana ${week}`, count }));
  };

  const getDailyRevenue = () => {
    const dailyRevenue: any = {};
    invoices.forEach(invoice => {
      const date = new Date(invoice.date).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + invoice.total;
    });
    return Object.entries(dailyRevenue)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, revenue]) => ({ date, revenue }));
  };

  // Helper functions
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const translateStatus = (status: string) => {
    const translations: { [key: string]: string } = {
      'pending': 'Pendiente',
      'paid': 'Pagada',
      'cancelled': 'Cancelada'
    };
    return translations[status] || status;
  };

  const getTotalsByStatus = () => {
    const data = {
      total: { amount: 0, qty: 0 },
      pending: { amount: 0, qty: 0 },
      paid: { amount: 0, qty: 0 },
      cancelled: { amount: 0, qty: 0 }
    };

    invoices.forEach(invoice => {
      data.total.amount += invoice.total;
      data.total.qty += 1;
      data[invoice.status].amount += invoice.total;
      data[invoice.status].qty += 1;
    });

    return data;
  };


  return (
    <div className="flex flex-wrap gap-4">

      <Card className="flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]">
        <CardHeader>
          <CardTitle>Resumen de Facturas</CardTitle>
          <CardDescription>Totales y cantidades por estado</CardDescription>
        </CardHeader>
        <CardContent className="h-fulll flex items-center justify-center p-4">
          {invoices.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Total Card */}
              <div className="bg-gray-100 rounded-lg p-3 flex flex-col justify-between">
                <div className="text-sm font-medium text-gray-600">Total</div>
                <div>
                  <div className="text-xl font-bold">
                    L. {getTotalsByStatus().total.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-gray-600">{getTotalsByStatus().total.qty} facturas</div>
                </div>
              </div>

              {/* Paid Card */}
              <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-between">
                <div className="text-sm font-medium text-green-600">Pagadas</div>
                <div>
                  <div className="text-xl font-bold text-green-700">
                    L. {getTotalsByStatus().paid.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-green-600">{getTotalsByStatus().paid.qty} facturas</div>
                </div>
              </div>

              {/* Pending Card */}
              <div className="bg-yellow-50 rounded-lg p-3 flex flex-col justify-between">
                <div className="text-sm font-medium text-yellow-600">Pendientes</div>
                <div>
                  <div className="text-xl font-bold text-yellow-700">
                    L. {getTotalsByStatus().pending.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-yellow-600">{getTotalsByStatus().pending.qty} facturas</div>
                </div>
              </div>

              {/* Cancelled Card */}
              <div className="bg-red-50 rounded-lg p-3 flex flex-col justify-between">
                <div className="text-sm font-medium text-red-600">Canceladas</div>
                <div>
                  <div className="text-xl font-bold text-red-700">
                    L. {getTotalsByStatus().cancelled.amount.toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-red-600">{getTotalsByStatus().cancelled.qty} facturas</div>
                </div>
              </div>
            </div>
          ) : (
            <SkeletonLoader />
          )}
        </CardContent>
      </Card>
      <Card className="flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]">
        <CardHeader>
          <CardTitle>Estado de Facturas</CardTitle>
          <CardDescription>Distribución de estados de facturas</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px]">
          {invoices.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="count" data={getInvoicesByStatus()} nameKey="status" cx="50%" cy="50%" outerRadius="80%" fill="#8884d8" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartSkeleton />
          )}
        </CardContent>
      </Card>



      <Card className="flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]">
        <CardHeader>
          <CardTitle>Clientes Principales</CardTitle>
          <CardDescription>Clientes con mayor valor total de facturas</CardDescription>
        </CardHeader>
        <CardContent className="h-[200px]">
          {getTopCustomers().length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getTopCustomers()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" name="Ingresos" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartSkeleton />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 w-full">

        <Card className="flex-grow basis-full sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]">
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Tendencia de ingresos en los últimos meses</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            {getMonthlyRevenue().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getMonthlyRevenue()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">

        <Card className="col-span-1 sm:col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Facturas Semanales</CardTitle>
            <CardDescription>Número de facturas emitidas por semana</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {getWeeklyInvoiceCount().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getWeeklyInvoiceCount()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" name="Número de Facturas" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartSkeleton />
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 sm:col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Ingresos Diarios</CardTitle>
            <CardDescription>Tendencia de ingresos diarios</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {getDailyRevenue().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDailyRevenue()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="#82ca9d" />
                </LineChart>
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