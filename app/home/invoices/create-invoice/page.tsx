"use client";

import InvoiceForm from "@/components/organisms/invoices/InvoiceForm";
import InvoicePreview from "@/components/organisms/invoices/InvoicePreview";
// import { Card } from "@/components/ui/card";
import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useRouter, useSearchParams } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useWindowSize from "@/hooks/useWindowSize";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function CreateInvoicePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get("invoice_id");
  const router = useRouter();
  const { windowWidth } = useWindowSize();

  const methods = useForm<Invoice>({
    defaultValues: {
      company_id: "",
      customer_id: "",
      invoice_number: "",
      date: new Date().toISOString(),
      subtotal: 0,
      tax_exonerado: 0,
      tax_exento: 0,
      tax_gravado_15: 0,
      tax_gravado_18: 0,
      tax: 0,
      tax_18: 0,
      total: 0,
      numbers_to_letters: "",
      proforma_number: null,
      is_proforma: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customers: { name: "", rtn: "", email: "" },
      invoice_items: [],
      status: "pending",
    },
  });

  const { syncInvoices } = useInvoicesStore();

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setLoading(false);
        return;
      }

      try {
        const invoice = await invoiceService.getInvoiceById(invoiceId);
        if (!invoice) {
          setError("No se encontró la factura especificada");
          return;
        }

        // If invoice is paid, don't allow editing
        if (invoice.status === "paid") {
          setError("No se puede editar una factura que ya está pagada");
          return;
        }

        setCurrentInvoice(invoice);
        methods.reset(invoice);
      } catch (err) {
        setError("Error al cargar la factura");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, methods]);

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      if (invoiceId) {
        // Update existing invoice
        savedInvoice = await invoiceService.updateInvoiceWithItems(
          invoiceId,
          invoice,
        );
      } else {
        // Create new invoice
        savedInvoice = await invoiceService.createInvoiceWithItems(invoice);
      }

      if (!savedInvoice) {
        throw new Error("Failed to save invoice");
      }

      // If all went right, then sync the invoice list and redirect to next page
      syncInvoices();
      router.push("/home/invoices");
    } catch (error) {
      console.error("An error occurred while saving the invoice:", error);
    }
  };

  const handleGoBack = () => {
    router.push("/home/invoices");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleGoBack}>Volver a Facturas</Button>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <section className="sm:px-2 lg:px-7 xl:px-10 flex gap-5 w-full pt-4">
        {windowWidth < 1280 && (
          <Tabs defaultValue="invoiceForm" className="px-auto w-full" id="tabs">
            <TabsList id="tabslist">
              <TabsTrigger value="invoiceForm">Crear factura</TabsTrigger>
              <TabsTrigger value="invoicePreview">
                Previsualizar factura
              </TabsTrigger>
            </TabsList>
            <TabsContent value="invoiceForm">
              <InvoiceForm
                onSave={handleSaveInvoice}
                isEditing={!!invoiceId}
                invoice={currentInvoice}
              />
            </TabsContent>
            <TabsContent value="invoicePreview">
              <InvoicePreview />
            </TabsContent>
          </Tabs>
        )}
        {windowWidth >= 1280 && (
          <div className="flex flex-col w-full gap-4">
            <Sheet>
              <SheetTrigger asChild id="sheettrigger">
                <Button className="w-4/5 mx-auto">Previsualizar factura</Button>
              </SheetTrigger>
              <SheetContent
                style={{ maxWidth: "60vw" }}
                className="overflow-auto"
              >
                <InvoicePreview />
              </SheetContent>
            </Sheet>
            <InvoiceForm
              onSave={handleSaveInvoice}
              isEditing={!!invoiceId}
              invoice={currentInvoice}
            />
          </div>
        )}
      </section>
    </FormProvider>
  );
}
