"use client";
import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, File, ListFilter } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import InvoiceView from "@/components/molecules/InvoiceView2";

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    fetchInvoices();
    fetchRevenue();
  }, []);

  const fetchInvoices = async () => {
    const fetchedInvoices = await invoiceService.getInvoices();
    setInvoices(fetchedInvoices);
  };

  const fetchRevenue = async () => {
    const weeklyRev = await invoiceService.getTotalRevenue("week");
    const monthlyRev = await invoiceService.getTotalRevenue("month");
    setWeeklyRevenue(weeklyRev);
    setMonthlyRevenue(monthlyRev);
  };

  const handleInvoiceSelect = async (invoiceId: string) => {
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      setIsCreatingInvoice(false);
      setIsOpen(true);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(undefined);
    setIsCreatingInvoice(true);
    setIsOpen(true);
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      if (isCreatingInvoice) {
        savedInvoice = await invoiceService.createInvoiceWithItems(invoice);
      } else {
        savedInvoice = await invoiceService.updateInvoiceWithItems(invoice.id, invoice);
      }

      if (!savedInvoice) {
        throw new Error("Failed to save invoice");
      }

      setSelectedInvoice(savedInvoice);
      setIsCreatingInvoice(false);
      fetchInvoices();
      setIsOpen(false);
    } catch (error) {
      console.error("An error occurred while saving the invoice:", error);
    }
  };

  const WidgetsSection = () => (
    <div className="w-full grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
      <Card className="sm:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle>Tus facturas</CardTitle>
          <CardDescription className="max-w-lg text-balance leading-relaxed">
            Dashboard de facturas
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleCreateInvoice}>Crear factura</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Esta Semana</CardDescription>
          <CardTitle className="text-4xl">
            ${weeklyRevenue.toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            +{((weeklyRevenue / monthlyRevenue) * 100).toFixed(2)}% del mes
            pasado
          </div>
        </CardContent>
        <CardFooter>
          <Progress
            value={(weeklyRevenue / monthlyRevenue) * 100}
            aria-label="Incremento semanal"
          />
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Este Mes</CardDescription>
          <CardTitle className="text-4xl">
            ${monthlyRevenue.toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Ingresos totales del mes
          </div>
        </CardContent>
        <CardFooter>
          <Progress value={100} aria-label="Ingresos mensuales" />
        </CardFooter>
      </Card>
    </div>
  );

  interface InvoicesTableProps {
    invoices: Invoice[];
    onSelectInvoice: (invoiceId: string) => void;
  }

  const InvoicesTable: React.FC<InvoicesTableProps> = ({
    invoices,
    onSelectInvoice,
  }) => (

    <Tabs className="w-full" defaultValue="week">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="week">Semana</TabsTrigger>
          <TabsTrigger value="month">Mes</TabsTrigger>
          <TabsTrigger value="year">Año</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                <ListFilter className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked>
                Pagadas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Pendientes</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem>Anuladas</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-sm">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only">Exportar</span>
          </Button>
        </div>
      </div>
      <TabsContent value="week">
        <Card>
          <CardHeader className="px-7">
            <CardTitle>Facturas</CardTitle>
            <CardDescription>Facturas recientes de tu negocio.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número de Factura</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Impuesto</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSelectInvoice(invoice.id)}
                  >
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {invoice.customers.name || invoice.customer_id}
                    </TableCell>
                    <TableCell className="text-right">
                      ${invoice.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${invoice.tax.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${invoice.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-xs"
                        variant={invoice.is_proforma ? "outline" : "secondary"}
                      >
                        {invoice.is_proforma ? "Proforma" : "Factura"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
  const InvoiceFormContent = () => (
    <div className="h-full overflow-y-auto px-4 py-6">
      {(selectedInvoice || isCreatingInvoice) && (
        <InvoiceView
          invoice={selectedInvoice}
          isEditable={isCreatingInvoice || !selectedInvoice}
          onSave={handleSaveInvoice}
        />
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:p-8 p-12">
        <main className="flex w-full flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <WidgetsSection />
          <InvoicesTable
            invoices={invoices}
            onSelectInvoice={handleInvoiceSelect}
          />
        </main>
      </div>

      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>{isCreatingInvoice ? "Create Invoice" : "Edit Invoice"}</DialogTitle>
              <DialogDescription>
                {isCreatingInvoice ? "Create a new invoice here." : "Make changes to the invoice here."}
              </DialogDescription>
            </DialogHeader>
            <InvoiceFormContent />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{isCreatingInvoice ? "Create Invoice" : "Edit Invoice"}</DrawerTitle>
              <DrawerDescription>
                {isCreatingInvoice ? "Create a new invoice here." : "Make changes to the invoice here."}
              </DrawerDescription>
            </DrawerHeader>
            <InvoiceFormContent />
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}