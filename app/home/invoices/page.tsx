"use client";
import React, { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";

import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import InvoiceView from "@/components/molecules/InvoiceView2";
import { InvoicesTable } from "@/components/molecules/InvoicesTable";
import { useAccount, useDebounce, useMediaQuery } from "@/lib/hooks";
import { toast } from "@/components/ui/use-toast";
import { DialogTitle } from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
// import { PlusCircleIcon } from "lucide-react";
import CreateInvoiceButton from "@/components/molecules/CreateInvoiceButton";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useCompanyStore } from "@/store/companyStore";
import { useQuery } from "@tanstack/react-query";

export default function Invoices() {
  // const { allInvoices, syncInvoices } = useInvoicesStore();
  const { data: allInvoices, isLoading: areInvoicesLoading } = useQuery(
    ["allInvoices"], // unique query key
    () => invoiceService.getInvoices(), // the function for fetching
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    },
  );
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "pending",
    "paid",
    "cancelled",
  ]);
  const { company } = useCompanyStore();
  const [isInvoiceContentReady, setIsInvoiceContentReady] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      setIsInvoiceContentReady(true);
    } else {
      setIsInvoiceContentReady(false);
    }
  }, [isOpen, company]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // const isDesktop = useMediaQuery("(min-width: 768px)");
  useEffect(() => {
    const initializeData = async () => {
      try {
        setFilteredInvoices(allInvoices);
        await fetchRevenue();
      } catch (error) {
        console.error("Error initializing data:", error);
        // Handle the error appropriately (e.g., show an error message to the user)
      }
    };

    initializeData();
  }, [allInvoices]);

  useEffect(() => {
    applyFilters();
  }, [allInvoices, debouncedSearchTerm, selectedStatuses]);

  // STARTS HERE

  const fetchRevenue = async () => {
    const weeklyRev = await invoiceService.getTotalRevenue("week");
    const monthlyRev = await invoiceService.getTotalRevenue("month");
    console.log("Weekly Revenue:", weeklyRev);
    console.log("Monthly Revenue:", monthlyRev);
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

  // const handleCreateInvoice = () => {
  //   setSelectedInvoice(undefined);
  //   setIsCreatingInvoice(true);
  //   setIsOpen(true);
  // };

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      // After creating the invoice, we need to sync it
      if (isCreatingInvoice) {
        savedInvoice = await invoiceService.createInvoiceWithItems(invoice);
      } else {
        savedInvoice = await invoiceService.updateInvoiceWithItems(
          invoice.id,
          invoice,
        );
      }

      if (!savedInvoice) {
        throw new Error("Failed to save invoice");
      }

      setSelectedInvoice(savedInvoice);
      setIsCreatingInvoice(false);
      // sync invoices
      setFilteredInvoices(allInvoices);
      // fetchInvoices();
      setIsOpen(false);
    } catch (error) {
      console.error("An error occurred while saving the invoice:", error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleDateRangeChange = (
    startDate: Date | undefined,
    endDate: Date | undefined,
  ) => {
    setDateRange({ start: startDate, end: endDate });
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setSelectedStatuses(statuses);
  };
  const applyFilters = useCallback(() => {
    let filtered: Invoice[] = [];
    if (!areInvoicesLoading && allInvoices) filtered = allInvoices;

    // Apply search filter
    if (debouncedSearchTerm) {
      const lowerSearchTerm = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (invoice) =>
          invoice.invoice_number.toLowerCase().includes(lowerSearchTerm) ||
          invoice.customers.name.toLowerCase().includes(lowerSearchTerm) ||
          invoice.total.toString().includes(lowerSearchTerm) ||
          invoice.invoice_items.some((item) =>
            item.description.toLowerCase().includes(lowerSearchTerm),
          ),
      );
    }

    // Apply status filter
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((invoice) => {
        const invoiceStatus = invoice.status?.toLowerCase() || "pending"; // Default to 'pending' if status is undefined
        return selectedStatuses.some(
          (status) => status.toLowerCase() === invoiceStatus,
        );
      });
    }

    setFilteredInvoices(filtered);
  }, [allInvoices, debouncedSearchTerm, selectedStatuses]);
  const handleDateSearch = () => {
    if (dateRange.start && dateRange.end) {
      const filtered = filteredInvoices.filter((invoice) => {
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
      const blob = new Blob([JSON.stringify(filteredInvoices, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices-export.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting invoices:", error);
    }
  };

  const handleUpdateStatus = useCallback(
    async (invoiceIds: string[], newStatus: string) => {
      try {
        await invoiceService.updateInvoicesStatus(invoiceIds, newStatus);
        // Refresh the invoices list after updating
        // fetchInvoices();
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
    },
    [],
  );

  // Widgets Section
  const WidgetsSection = () => {
    const currentDate = new Date();
    const oneWeekAgo = new Date(
      currentDate.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const firstDayOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1,
    );

    // console.log("The filteredInvoices are: ", filteredInvoices);
    // const weeklyRevenue = filteredInvoices
    //   .filter((invoice) => new Date(invoice.date) >= oneWeekAgo)
    //   .reduce((sum, invoice) => sum + invoice.total, 0);
    // console.log("the weekly revenue is: ", weeklyRevenue);
    //
    // const monthlyRevenue = filteredInvoices
    //   .filter((invoice) => new Date(invoice.date) >= firstDayOfMonth)
    //   .reduce((sum, invoice) => sum + invoice.total, 0);

    const weeklyPercentage =
      monthlyRevenue !== 0 ? (weeklyRevenue / monthlyRevenue) * 100 : 0;
    if (areInvoicesLoading) return <div>Loading invoices</div>;

    return (
      <div className="w-full grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="sm:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Tus facturas</CardTitle>
            <CardDescription className="max-w-lg text-balance leading-relaxed">
              Dashboard de facturas
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <CreateInvoiceButton />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Esta Semana</CardDescription>
            <CardTitle className="text-4xl">
              {`Lps. ${weeklyRevenue.toFixed(2)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              {weeklyPercentage.toFixed(2)}% del mes actual
            </div>
          </CardContent>
          <CardFooter>
            <Progress
              value={weeklyPercentage}
              aria-label="Incremento semanal"
            />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Este Mes</CardDescription>
            <CardTitle className="text-4xl">
              {`Lps. ${monthlyRevenue.toFixed(2)}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Ingresos totales del mes
            </div>
          </CardContent>
          {/* <CardFooter>
            <Progress value={100} aria-label="Ingresos mensuales" />
          </CardFooter> */}
        </Card>
      </div>
    );
  };

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
            selectedStatuses={selectedStatuses}
            onDateSearch={handleDateSearch}
            onUpdateStatus={handleUpdateStatus}
          />
        </main>
      </div>
      {/* {isDesktop ? ( */}
      {/* This is the dialog box that opens when pressing on crear factura button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[900px] h-[90vh]">
          <DialogHeader>
            <VisuallyHidden.Root>
              <DialogTitle></DialogTitle>
            </VisuallyHidden.Root>
          </DialogHeader>
          {isInvoiceContentReady && (
            <div className="h-full overflow-y-auto px-4 py-6">
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
            <div className="flex items-center justify-center h-full">
              Loading...
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* ) : (
        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent>
            <div className="h-full overflow-y-auto px-4 py-6 px-0">
              {(selectedInvoice || isCreatingInvoice) && company && (
                <InvoiceView
                  invoice={selectedInvoice}
                  isEditable={isCreatingInvoice || !selectedInvoice}
                  onSave={handleSaveInvoice}
                />
              )}
            </div>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Cancel</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )} */}
    </div>
  );
}
