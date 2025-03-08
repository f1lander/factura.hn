'use client';

import InvoiceForm from '@/components/organisms/invoices/InvoiceForm';
import InvoicePreview from '@/components/organisms/invoices/InvoicePreview';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import { useInvoicesStore } from '@/store/invoicesStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormProvider, Resolver, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryConfirmDialog } from '@/components/organisms/invoices/DeliveryConfirmDialog';
import { productService } from '@/lib/supabase/services/product';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/lib/supabase/services/company';

const invoiceSchema = yup.object().shape({
  id: yup.string().optional(),
  company_id: yup.string(),
  customer_id: yup.string().required('El ID del cliente es requerido'),
  invoice_number: yup
    .string()
    .required('El número de factura es requerido')
    .test(
      'valid-invoice-number',
      'Número de factura inválido o fuera de secuencia',
      async function (value, ctx) {
        // Access context variables through this.options.context
        const { isEditing, latestInvoiceNumber, latestSarCai, lastInvoice } =
          this.options.context || {};

        const {
          parent: { is_proforma },
        } = ctx;

        if (isEditing || is_proforma) return true; // Skip validation when editing

        if (!latestInvoiceNumber?.latest_invoice_number || !value) return false;

        const previousInvoiceNumber =
          latestInvoiceNumber?.latest_invoice_number as string;
        const nextInvoiceNumber = value;

        const isValid =
          await invoiceService.validateNextInvoiceNumberWithSarCai(
            previousInvoiceNumber,
            nextInvoiceNumber,
            latestSarCai,
            !latestInvoiceNumber?.error
          );

        if (typeof isValid === 'string') {
          return ctx.createError({
            message: isValid,
          });
        }

        return isValid;
      }
    ),
  date: yup.string().required('La fecha es requerida'),
  subtotal: yup
    .number()
    .min(0, 'El subtotal debe ser positivo')
    .required('El subtotal es requerido'),
  tax_exonerado: yup
    .number()
    .min(0, 'El impuesto exonerado debe ser positivo')
    .required('El impuesto exonerado es requerido'),
  exento: yup.boolean().default(false),
  tax_exento: yup
    .number()
    .min(0, 'El impuesto exento debe ser positivo')
    .required('El impuesto exento es requerido'),
  tax_gravado_15: yup
    .number()
    .min(0, 'El impuesto gravado 15% debe ser positivo'),
  tax_gravado_18: yup
    .number()
    .min(0, 'El impuesto gravado 18% debe ser positivo'),
  tax: yup
    .number()
    .min(0, 'El impuesto debe ser positivo')
    .required('El impuesto es requerido'),
  tax_18: yup
    .number()
    .min(0, 'El impuesto 18% debe ser positivo')
    .required('El impuesto 18% es requerido'),
  total: yup
    .number()
    .min(0, 'El total debe ser positivo')
    .required('El total es requerido'),
  numbers_to_letters: yup.string(),
  proforma_number: yup.string().nullable(),
  is_proforma: yup.boolean(),
  created_at: yup.string().required('La fecha de creación es requerida'),
  updated_at: yup.string().required('La fecha de actualización es requerida'),
  customers: yup.object().shape({
    name: yup.string().required('El nombre del cliente es requerido'),
    rtn: yup.string().required('El RTN es requerido'),
    email: yup
      .string()
      .email('Formato de correo electrónico inválido')
      .required('El correo electrónico es requerido'),
  }),
  invoice_items: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().optional(),
        invoice_id: yup.string().optional(),
        product_id: yup.string().required('El ID del producto es requerido'),
        description: yup.string().optional(),
        quantity: yup
          .number()
          .min(1, 'La cantidad debe ser al menos 1')
          .required('La cantidad es requerida'),
        unit_cost: yup
          .number()
          // .transform((value) => (isNaN(value) ? undefined : Number(value)))
          .min(0, 'El precio debe ser positivo')
          .required('El precio es requerido'),
        discount: yup
          .number()
          // .transform((value) => (isNaN(value) ? undefined : Number(value)))
          .min(0, 'El descuento debe ser positivo')
          .default(0),
        is_service: yup.boolean().optional(),
        created_at: yup.string().optional(),
        updated_at: yup.string().optional(),
      })
    )
    .min(1, 'Se requiere al menos un artículo'),
  status: yup.string().oneOf(['pending', 'paid'], 'Estado inválido'),
  sar_cai_id: yup.string().nullable().optional(),
});

export default function CreateInvoicePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoice_id');
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: companyId } = useQuery(['companyId'], () =>
    companyService.getCompanyId()
  );

  const { data: latestSarCai, isLoading } = useQuery(
    ['latestSarCai', companyId],
    () => invoiceService.getLatestSarCai(),
    {
      // Cache for 30 minutes
      staleTime: 30 * 60 * 1000,
      // Keep the data in cache for 24 hours
      cacheTime: 24 * 60 * 60 * 1000,
      // Don't refetch on window focus for this data as it rarely changes
      refetchOnWindowFocus: false,
      // Only run the query when we have a companyId
      enabled: !!companyId,
    }
  );

  const { data: lastInvoice } = useQuery(
    ['lastInvoice', companyId],
    () => invoiceService.getLastInvoice(),
    {
      // Cache for 10 minutes
      staleTime: 10 * 60 * 1000,
      // Keep the data in cache for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Don't refetch on window focus for this data as it rarely changes
      refetchOnWindowFocus: false,
      // Only run the query when we have a companyId
      enabled: !!companyId,
    }
  );

  const { data: latestInvoiceNumber } = useQuery(
    ['latestInvoiceNumberInRange', companyId],
    () => invoiceService.getLatestInvoiceNumberInSarCaiRange(),
    {
      enabled: !!companyId,
      // onSuccess: (data) => {
      //   if (data && !isEditing) {
      //     // setLastInvoiceNumber(data);
      //     const nextInvoiceNumber =
      //       invoiceService.generateNextInvoiceNumber(data);
      //     setValue('invoice_number', nextInvoiceNumber);
      //   }
      // },
    }
  );

  const methods = useForm<Invoice>({
    reValidateMode: 'onBlur',
    mode: 'onBlur',
    resolver: yupResolver(invoiceSchema) as Resolver<Invoice>,
    context: {
      isEditing: !!invoiceId,
      // isProforma: false, // Set this based on your form state
      latestInvoiceNumber,
      latestSarCai,
      lastInvoice,
    },
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
      exento: false,
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
      sar_cai_id: null,
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
        queryClient.invalidateQueries(['allInvoices', companyId]);
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
      queryClient.invalidateQueries(['allInvoices', companyId]);
      router.push('/home/invoices');
    } catch (error) {
      console.error('Error updating inventory:', error);
    }
  };

  const handleDeliveryCancel = () => {
    setIsDeliveryDialogOpen(false);
    queryClient.invalidateQueries(['allInvoices', companyId]);
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
        // onOpenChange={setIsDeliveryDialogOpen}
        // onOpenChange={handleDeliveryCancel}
        onConfirm={handleDeliveryConfirm}
        onCancel={handleDeliveryCancel}
      />
    </FormProvider>
  );
}
