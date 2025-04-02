'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, Users, Package, Calendar, TrendingUp, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { invoiceService } from '@/lib/supabase/services/invoice';
import { customerService } from '@/lib/supabase/services/customer';
import { productService } from '@/lib/supabase/services/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';

const reportCategories = [
  {
    title: 'Facturas',
    icon: FileText,
    reports: [
      {
        id: 'sales_by_period',
        title: 'Ventas por Período',
        description: 'Reporte detallado de ventas por período específico',
        filters: ['date_range', 'status'],
      },
      {
        id: 'invoices_by_customer',
        title: 'Facturas por Cliente',
        description: 'Análisis de facturas agrupadas por cliente',
        filters: ['customer', 'date_range'],
      },
      {
        id: 'invoice_status',
        title: 'Estado de Facturas',
        description: 'Resumen de facturas por estado',
        filters: ['status', 'date_range'],
      },
    ],
  },
  {
    title: 'Clientes',
    icon: Users,
    reports: [
      {
        id: 'top_customers',
        title: 'Mejores Clientes',
        description: 'Top clientes por volumen de ventas',
        filters: ['date_range', 'limit'],
      },
      {
        id: 'purchase_history',
        title: 'Historial de Compras',
        description: 'Historial detallado de compras por cliente',
        filters: ['customer', 'date_range'],
      },
    ],
  },
  {
    title: 'Productos',
    icon: Package,
    reports: [
      {
        id: 'best_selling',
        title: 'Productos más Vendidos',
        description: 'Análisis de productos con mayor volumen de ventas',
        filters: ['date_range', 'category'],
      },
      {
        id: 'inventory',
        title: 'Inventario Actual',
        description: 'Estado actual del inventario con alertas de stock',
        filters: ['category', 'stock_level'],
      },
    ],
  },
];

interface Report {
  id: string;
  title: string;
  description: string;
  filters: string[];
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [customers, setCustomers] = useState<any[]>([]);
  
  const handleReportSelect = async (report: Report) => {
    setSelectedReport(report);
    setReportData(null);
    
    // Load customers if needed for filter
    if (report.filters.includes('customer') && customers.length === 0) {
      try {
        const loadedCustomers = await customerService.getCustomers();
        setCustomers(loadedCustomers || []);
      } catch (error) {
        console.error("Error loading customers:", error);
      }
    }
    
    setIsDialogOpen(true);
  };
  
  const generateReport = async () => {
    if (!selectedReport) return;
    
    setIsLoading(true);
    setReportData(null);
    
    try {
      let data = [];
      
      switch (selectedReport.id) {
        case 'sales_by_period':
          data = await invoiceService.getInvoicesByDateRange(startDate, endDate, selectedStatus);
          break;
          
        case 'invoices_by_customer':
          if (!selectedCustomer) break;
          data = await invoiceService.getInvoicesByCustomer(selectedCustomer, startDate, endDate);
          break;
          
        case 'invoice_status':
          data = await invoiceService.getInvoiceStatusSummary(startDate, endDate);
          break;
          
        case 'top_customers':
          data = await customerService.getTopCustomers(startDate, endDate);
          break;
          
        case 'purchase_history':
          if (!selectedCustomer) break;
          data = await invoiceService.getCustomerPurchaseHistory(selectedCustomer);
          break;
          
        case 'best_selling':
          data = await productService.getBestSellingProducts(startDate, endDate, selectedCategory);
          break;
          
        case 'inventory':
          data = await productService.getCurrentInventory(selectedCategory);
          break;
      }
      
      setReportData(data || []);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedCustomer("");
    setSelectedStatus("");
    setSelectedCategory("");
  };

  const ReportCard = ({ report, category }: { report: Report; category: string }) => {
    return (
      <Card 
        className="hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handleReportSelect(report)}
      >
        <CardHeader>
          <CardTitle className="text-lg">{report.title}</CardTitle>
          <CardDescription>{report.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {report.filters.map((filter: string) => (
              <div
                key={filter}
                className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded"
              >
                {filter.replace('_', ' ')}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  const renderFilters = () => {
    if (!selectedReport) return null;
    
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {selectedReport.filters.includes('date_range') && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha inicial</label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha final</label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </>
        )}
        
        {selectedReport.filters.includes('customer') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Cliente</label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedReport.filters.includes('status') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Estado</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="delivered">Entregada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        
        {selectedReport.filters.includes('category') && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="product">Productos</SelectItem>
                <SelectItem value="service">Servicios</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };
  
  const renderReportResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Generando reporte...</span>
        </div>
      );
    }
    
    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {reportData === null ? 
            "Configure los filtros y haga clic en Generar para ver resultados" : 
            "No se encontraron datos para el reporte con los filtros seleccionados"}
        </div>
      );
    }
    
    // Render appropriate component based on report type
    switch (selectedReport?.id) {
      case 'sales_by_period':
        return <SalesByPeriodReport data={reportData} />;
      case 'invoices_by_customer':
        return <InvoicesByCustomerReport data={reportData} />;
      case 'invoice_status':
        return <InvoiceStatusReport data={reportData} />;
      case 'top_customers':
        return <TopCustomersReport data={reportData} />;
      case 'purchase_history':
        return <PurchaseHistoryReport data={reportData} />;
      case 'best_selling':
        return <BestSellingReport data={reportData} />;
      case 'inventory':
        return <InventoryReport data={reportData} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Seleccione un reporte para ver los resultados
          </div>
        );
    }
  };
  
  // Report display components
  const SalesByPeriodReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-medium">Total: {data.length} facturas</h3>
          <p className="text-muted-foreground">
            Total ventas: Lps. {data.reduce((sum, inv) => sum + (inv.total || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">No. Factura</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Fecha</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Estado</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {data.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 text-sm">{invoice.invoice_number}</td>
                <td className="px-4 py-3 text-sm">{invoice.customers?.name || '-'}</td>
                <td className="px-4 py-3 text-sm">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                    invoice.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {invoice.status === 'paid' ? 'Pagada' :
                     invoice.status === 'cancelled' ? 'Cancelada' :
                     invoice.status === 'delivered' ? 'Entregada' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">Lps. {invoice.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Simplified placeholders for other report components
  const InvoicesByCustomerReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <SalesByPeriodReport data={data} />
    </div>
  );
  
  const InvoiceStatusReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(
          data.reduce((acc: any, inv) => {
            acc[inv.status] = (acc[inv.status] || 0) + 1;
            return acc;
          }, {})
        ).map(([status, count]) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{
                status === 'paid' ? 'Pagadas' :
                status === 'cancelled' ? 'Canceladas' :
                status === 'delivered' ? 'Entregadas' : 'Pendientes'
              }</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{count as number}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <SalesByPeriodReport data={data} />
    </div>
  );
  
  const TopCustomersReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Cliente</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Total Facturas</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {data.map((customer) => (
              <tr key={customer.id}>
                <td className="px-4 py-3 text-sm">{customer.name}</td>
                <td className="px-4 py-3 text-sm">{customer.invoice_count}</td>
                <td className="px-4 py-3 text-sm text-right">Lps. {customer.total_sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Simplified placeholders for other report components
  const PurchaseHistoryReport = ({ data }: { data: any[] }) => (
    <SalesByPeriodReport data={data} />
  );
  
  const BestSellingReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Cantidad Vendida</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Total Ventas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {data.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-sm">{product.name}</td>
                <td className="px-4 py-3 text-sm text-right">{product.quantity_sold}</td>
                <td className="px-4 py-3 text-sm text-right">Lps. {product.total_sales.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const InventoryReport = ({ data }: { data: any[] }) => (
    <div className="space-y-4">
      <div className="rounded-md border">
        <table className="min-w-full divide-y divide-border">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Producto</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Stock Actual</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Precio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {data.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3 text-sm">{product.name}</td>
                <td className={`px-4 py-3 text-sm text-right ${
                  product.stock_quantity <= 5 ? 'text-red-500 font-semibold' : ''
                }`}>{product.stock_quantity}</td>
                <td className="px-4 py-3 text-sm text-right">Lps. {product.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const ConversationalInterface = () => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card">
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 bg-muted p-3 rounded-lg text-sm">
                ¿Cuántas facturas se generaron esta semana?
              </div>
            </div>
            <div className="flex items-start gap-2 ml-10">
              <div className="flex-1 bg-primary/10 p-3 rounded-lg text-sm">
                Esta semana se generaron 24 facturas, un incremento del 20% respecto a la semana anterior.
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Input 
            className="flex-1" 
            placeholder="Pregunta algo sobre tus reportes..."
            disabled
          />
          <Button disabled>
            <MessageSquare className="w-4 h-4 mr-2" />
            Preguntar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reportes</h2>
            <p className="text-muted-foreground">
              Genera reportes detallados de tu negocio
            </p>
          </div>
          <Button variant="outline" disabled={!reportData || reportData.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        <Tabs defaultValue="traditional" className="w-full">
          <TabsList>
            <TabsTrigger value="traditional">Reportes Tradicionales</TabsTrigger>
            <TabsTrigger value="conversational">Reportes Conversacionales</TabsTrigger>
          </TabsList>
          <TabsContent value="traditional" className="mt-6">
            <div className="grid gap-6">
              {reportCategories.map((category) => (
                <div key={category.title}>
                  <div className="flex items-center gap-2 mb-4">
                    <category.icon className="w-5 h-5" />
                    <h3 className="text-lg font-semibold">{category.title}</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {category.reports.map((report) => (
                      <ReportCard
                        key={report.title}
                        report={report}
                        category={category.title}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="conversational" className="mt-6">
            <ConversationalInterface />
          </TabsContent>
        </Tabs>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedReport?.title}</DialogTitle>
            <DialogDescription>
              {selectedReport?.description}
            </DialogDescription>
          </DialogHeader>
          
          {renderFilters()}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
            <Button onClick={generateReport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                'Generar Reporte'
              )}
            </Button>
          </div>
          
          <div className="mt-4 max-h-[500px] overflow-y-auto">
            {renderReportResults()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
