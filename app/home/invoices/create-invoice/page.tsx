"use client";
import InvoiceView2 from "@/components/molecules/InvoiceView2";
import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
export default function CreateInvoice() {
  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      savedInvoice = await invoiceService.createInvoiceWithItems(invoice);

      if (!savedInvoice) {
        throw new Error("Failed to save invoice");
      }
    } catch (error) {
      console.error("An error occurred while saving the invoice:", error);
    }
  };
  return (
    <InvoiceView2
      invoice={undefined}
      isEditable={true}
      onSave={handleSaveInvoice}
    />
  );
}
