'use client';

import InvoiceForm from '@/components/organisms/invoices/InvoiceForm';
import InvoicePreview from '@/components/organisms/invoices/InvoicePreview';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import { useInvoicesStore } from '@/store/invoicesStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryConfirmDialog } from '@/components/organisms/invoices/DeliveryConfirmDialog';
import { productService } from '@/lib/supabase/services/product';

export default function CreateInvoicePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const router = useRouter();

  const methods = useForm<Invoice>({
    defaultValues: {
      company_id: '',
      customer_id: '',
      invoice_number: '',
      date: new Date().toISOString(),
      subtotal: 0,
      tax_exonerado: 0,
      tax_exento: 0,
      tax_gravado_15: 0,
      tax_gravado_18: 0,
      tax: 0,
      tax_18: 0,
      total: 0,
      numbers_to_letters: '',
      proforma_number: null,
      is_proforma: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customers: { name: '', rtn: '', email: '' },
      invoice_items: [],
      status: 'pending',
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
          setError('No se encontró la factura especificada');
          return;
        }

        // If invoice is paid, don't allow editing
        if (invoice.status === 'paid') {
          setError('No se puede editar una factura que ya está pagada');
          return;
        }

        // If invoice is paid, don't allow editing
        if (invoice.delivered_date) {
          setError('No se puede editar una factura que ya está entregada');
          return;
        }

        setCurrentInvoice(invoice);
        methods.reset(invoice);
      } catch (err) {
        setError('Error al cargar la factura');
        console.error('Error fetching invoice:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, methods]);

  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [pendingInvoice, setPendingInvoice] = useState<Invoice | null>(null);

  const handleSaveInvoice = async (invoice: Invoice) => {
    try {
      let savedInvoice: Invoice | null;

      if (invoiceId) {
        if ('customer' in invoice) {
          delete invoice.customer;
        }
        if ('items' in invoice) {
          delete invoice.items;
        }
        // Update existing invoice
        savedInvoice = await invoiceService.updateInvoiceWithItems(
          invoiceId,
          invoice
        );
      } else {
        // Create new invoice
        savedInvoice = await invoiceService.createInvoiceWithItems(invoice);
      }

      if (!savedInvoice) {
        throw new Error('Failed to save invoice');
      }

      // Verify if there's at least one non-service item before proceeding
      const hasPhysicalItems = savedInvoice.invoice_items.some(
        (item) => !item.is_service
      );

      if (!hasPhysicalItems) {
        // If all items are services, skip delivery dialog and redirect
        syncInvoices();
        router.push('/home/invoices');
        return;
      }

      setPendingInvoice(savedInvoice);
      setIsDeliveryDialogOpen(true);
    } catch (error) {
      console.error('An error occurred while saving the invoice:', error);
    }
  };

  const handleDeliveryConfirm = async () => {
    try {
      if (!pendingInvoice) return;

      const order = {
        type: 'DELETE' as const,
        invoice_id: pendingInvoice.id,
        update_products: pendingInvoice.invoice_items
          .filter((item) => !item.is_service)
          .map((item) => ({
            product_id: item.product_id,
            quantity_delta: item.quantity,
          })),
        reason_description: `Productos entregados para factura ${pendingInvoice.invoice_number}`,
      };

      const productOrder = await productService.generateProductRegisterOrder(
        order
      );

      if (productOrder?.id) {
        await productService.updateInventory(productOrder.id);
      }

      // Close dialog and redirect
      setIsDeliveryDialogOpen(false);
      syncInvoices();
      router.push('/home/invoices');
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleDeliveryCancel = () => {
    setIsDeliveryDialogOpen(false);
    syncInvoices();
    router.push('/home/invoices');
  };

  return (
    <FormProvider {...methods}>
      <section className='sm:px-2 lg:px-7 xl:px-10 flex gap-5 w-full pt-4'>
        <div className='w-full xl:hidden'>
          <Tabs defaultValue='invoiceForm' className='px-auto w-full' id='tabs'>
            <TabsList id='tabslist'>
              <TabsTrigger value='invoiceForm'>Crear factura</TabsTrigger>
              <TabsTrigger value='invoicePreview'>
                Previsualizar factura
              </TabsTrigger>
            </TabsList>
            <TabsContent value='invoiceForm'>
              <InvoiceForm
                onSave={handleSaveInvoice}
                isEditing={!!invoiceId}
                invoice={currentInvoice}
              />
            </TabsContent>
            <TabsContent value='invoicePreview'>
              <InvoicePreview />
            </TabsContent>
          </Tabs>
        </div>

        <div className='hidden xl:flex xl:w-full xl:gap-5'>
          <div className='w-1/2'>
            <InvoiceForm
              onSave={handleSaveInvoice}
              isEditing={!!invoiceId}
              invoice={currentInvoice}
            />
          </div>
          <div className='w-1/2'>
            <InvoicePreview />
          </div>
        </div>
      </section>
      <DeliveryConfirmDialog
        open={isDeliveryDialogOpen}
        onOpenChange={setIsDeliveryDialogOpen}
        onConfirm={handleDeliveryConfirm}
        onCancel={handleDeliveryCancel}
      />
    </FormProvider>
  );
}
