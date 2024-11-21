"use client";

import InvoiceForm from "@/components/organisms/invoices/InvoiceForm";
import InvoicePreview from "@/components/organisms/invoices/InvoicePreview";
import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";

export default function CreateInvoicePage() {
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
  const router = useRouter();
  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      savedInvoice = await invoiceService.createInvoiceWithItems(invoice);

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
  return (
    <FormProvider {...methods}>
      <section className="lg:px-7 xl:px-10 flex gap-5 w-full">
        <div className="w-1/2 py-2">
          <InvoiceForm onSave={handleSaveInvoice} />
        </div>
        <div className="w-1/2 py-2">
          <InvoicePreview />
        </div>
      </section>
    </FormProvider>
  );
}
