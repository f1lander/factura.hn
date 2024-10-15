"use client";
import InvoiceView2 from "@/components/molecules/InvoiceView2";
import { Invoice, invoiceService } from "@/lib/supabase/services/invoice";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useRouter } from "next/navigation";
export default function CreateInvoice() {
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
    <section className="lg:px-7 xl:px-10">
      <InvoiceView2
        invoice={undefined}
        isEditable={true}
        onSave={handleSaveInvoice}
      />
    </section>
  );
}
