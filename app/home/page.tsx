"use client";
import React, { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import InvoiceView from "@/components/molecules/InvoiceView2";
import { InvoicesTable } from "@/components/molecules/InvoicesTable";
import { useDebounce, useMediaQuery } from "@/lib/hooks";
import { toast } from "@/components/ui/use-toast";

export default function Invoices() {
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({ start: undefined, end: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["pending"]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  useEffect(() => {
    const initializeData = async () => {
      try {
        await invoiceService.ensureInitialized();
        await fetchInvoices();
        await fetchRevenue();
      } catch (error) {
        console.error("Error initializing data:", error);
        // Handle the error appropriately (e.g., show an error message to the user)
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allInvoices, debouncedSearchTerm, selectedStatuses]);

  const fetchInvoices = async () => {
    const fetchedInvoices = await invoiceService.getInvoices();
    setAllInvoices(fetchedInvoices);
    setFilteredInvoices(fetchedInvoices);
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

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleDateRangeChange = (startDate: Date | undefined, endDate: Date | undefined) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
  };
  const applyFilters = useCallback(() => {
    let filtered = allInvoices;

    // Apply search filter
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(invoice =>
        invoice.invoice_number.toLowerCase().includes(lowerSearchTerm) ||
        invoice.customers.name.toLowerCase().includes(lowerSearchTerm) ||
        invoice.total.toString().includes(lowerSearchTerm) ||
        invoice.invoice_items.some(item => item.description.toLowerCase().includes(lowerSearchTerm))
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(invoice => {
        const invoiceStatus = invoice.status?.toLowerCase() || 'pending'; // Default to 'pending' if status is undefined
        return selectedStatuses.some(status => status.toLowerCase() === invoiceStatus);
      });
    }

    setFilteredInvoices(filtered);
  }, [allInvoices, debouncedSearchTerm, selectedStatuses]);
  const handleDateSearch = () => {

    if (dateRange.start && dateRange.end) {
      const filtered = filteredInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= dateRange.start! && invoiceDate <= dateRange.end!;
      });
      setFilteredInvoices(filtered);
    }
  };

  const handleExport = async () => {
    try {
      // This is a placeholder for the actual export logic
      console.log("Exporting invoices:", filteredInvoices);

      // Simulate file download
      const blob = new Blob([JSON.stringify(filteredInvoices, null, 2)], { type: 'application/json' });
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

  const handleUpdateStatus = useCallback(async (invoiceIds: string[], newStatus: string) => {
    try {
      await invoiceService.updateInvoicesStatus(invoiceIds, newStatus);
      // Refresh the invoices list after updating
      fetchInvoices();
      toast({
        title: "Status Updated",
        description: `Successfully updated ${invoiceIds.length} invoice(s) to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating invoice statuses:", error);
      toast({
        title: "Error",
        description: "Failed to update invoice statuses. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchInvoices]);

  // Widgets Section
  const WidgetsSection = () => (
    <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            ${isNaN(weeklyRevenue) ? "0.00" : weeklyRevenue.toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            {(() => {
              if (isNaN(weeklyRevenue) || isNaN(monthlyRevenue) || monthlyRevenue === 0) {
                return "0.00";
              }
              const percentage = (weeklyRevenue / monthlyRevenue) * 100;
              return isFinite(percentage) ? percentage.toFixed(2) : "0.00";
            })()}% del mes pasado
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

  const InvoiceFormContent = () => (
    <div className="h-full overflow-y-auto px-4 py-6 px-0">
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
      <div className="flex flex-col p-6 sm:gap-4 lg:p-12">
        <main className="flex w-full flex-col items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <WidgetsSection />
          <InvoicesTable
            invoices={filteredInvoices}
            onSelectInvoice={handleInvoiceSelect}
            onSearch={handleSearch}
            onDateRangeChange={handleDateRangeChange}
            onStatusFilterChange={handleStatusFilterChange}
            onExport={handleExport}
            onDateSearch={handleDateSearch}
            onUpdateStatus={handleUpdateStatus}
          />
        </main>
      </div>
      {isDesktop ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-[900px] h-[90vh]">
            <InvoiceFormContent />
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
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
