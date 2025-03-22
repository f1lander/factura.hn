import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Invoice, invoiceService } from '@/lib/supabase/services/invoice';
import { productService } from '@/lib/supabase/services/product';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface InventoryIssue {
  productId: string;
  name: string;
  sku: string;
  requested: number;
  available: number;
  isService?: boolean;
}

interface InvoiceStatus {
  id: string;
  number: string;
  status: 'processable' | 'delivered' | 'cancelled' | 'error';
  message?: string;
  inventoryIssues?: InventoryIssue[];
}

interface DeliveryConfirmDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm: (processableInvoiceIds?: string[]) => Promise<void>;
  onCancel: () => void;
  onContinueEditing?: () => void;
  invoice?: Invoice | null;
  invoiceIds?: string[];
}

// Helper function to check inventory for a single invoice
async function checkInventoryForInvoice(
  invoice: Invoice
): Promise<InventoryIssue[]> {
  const issues: InventoryIssue[] = [];

  // Get product IDs that are not services
  const productItems = invoice.invoice_items.filter((item) => !item.is_service);
  const productIds = productItems.map((item) => item.product_id);

  if (productIds.length === 0)
    return [
      {
        productId: '',
        name: 'No hay productos en esta factura, solo servicios',
        sku: 'N/A',
        requested: 0,
        available: 0,
        isService: true,
      },
    ];

  // Get current inventory for all products in the invoice
  const inventoryData = await productService.getProductsInventory(productIds);

  // Check each invoice item against inventory
  for (const item of productItems) {
    const product = inventoryData.find((p) => p.id === item.product_id);
    if (product && item.quantity > (product.quantity_in_stock ?? 0)) {
      issues.push({
        productId: item.product_id,
        name: product.description || 'Unknown Product',
        sku: product.sku || 'N/A',
        requested: item.quantity,
        available: product.quantity_in_stock ?? 0,
      });
    }
  }

  return issues;
}

export function DeliveryConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  onContinueEditing,
  invoice,
  invoiceIds = [],
}: DeliveryConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  // const [inventoryIssues, setInventoryIssues] = useState<InventoryIssue[]>([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState<InvoiceStatus[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [processableInvoiceIds, setProcessableInvoiceIds] = useState<string[]>(
    []
  );

  // Check inventory levels when dialog opens
  useEffect(() => {
    async function validateInventory() {
      if (!open) return;

      setIsValidating(true);
      const statuses: InvoiceStatus[] = [];
      const processable: string[] = [];

      try {
        // Handle single invoice case
        if (invoice) {
          const issues = await checkInventoryForInvoice(invoice);

          if (issues.length > 0) {
            statuses.push({
              id: invoice.id,
              number: invoice.invoice_number,
              status: 'error',
              inventoryIssues: issues,
            });
          } else {
            statuses.push({
              id: invoice.id,
              number: invoice.invoice_number,
              status: 'processable',
            });
            processable.push(invoice.id);
          }
        }
        // Handle multiple invoices case
        else if (invoiceIds.length > 0) {
          // Fetch all invoices data
          const invoicesData = await invoiceService.getInvoicesByIds(
            invoiceIds
          );

          // Process each invoice
          for (const inv of invoicesData) {
            if (!inv) continue;

            // Check if already delivered or cancelled
            if (inv.delivered_date) {
              statuses.push({
                id: inv.id,
                number: inv.invoice_number,
                status: 'delivered',
                message: 'Esta factura ya ha sido entregada',
              });
              continue;
            }

            if (inv.status === 'cancelled') {
              statuses.push({
                id: inv.id,
                number: inv.invoice_number,
                status: 'cancelled',
                message: 'Esta factura está cancelada',
              });
              continue;
            }

            if (inv.status !== 'paid' && inv.status !== 'pending') {
              statuses.push({
                id: inv.id,
                number: inv.invoice_number,
                status: 'error',
                message:
                  'La factura debe estar pagada o pendiente para ser entregada',
              });
              continue;
            }

            // Check inventory for valid invoices
            const issues = await checkInventoryForInvoice(inv);

            if (issues.length > 0) {
              statuses.push({
                id: inv.id,
                number: inv.invoice_number,
                status: 'error',
                inventoryIssues: issues,
              });
            } else {
              statuses.push({
                id: inv.id,
                number: inv.invoice_number,
                status: 'processable',
              });
              processable.push(inv.id);
            }
          }
        }
      } catch (error) {
        console.error('Error validating inventory:', error);
      } finally {
        setInvoiceStatuses(statuses);
        setProcessableInvoiceIds(processable);
        setIsValidating(false);
      }
    }
    //   // Get current inventory for all products in the invoice
    //   const productIds = invoice.invoice_items.map((item) => item.product_id);
    //   const inventoryData = await productService.getProductsInventory(
    //     productIds
    //   );

    //   // Check each invoice item against inventory
    //   for (const item of invoice.invoice_items) {
    //     const product = inventoryData.find((p) => p.id === item.product_id);
    //     if (product && item.quantity > (product.quantity_in_stock ?? 0)) {
    //       issues.push({
    //         productId: item.product_id,
    //         name: product.description || 'Unknown Product',
    //         sku: product.sku || 'N/A',
    //         requested: item.quantity,
    //         available: product.quantity_in_stock ?? 0,
    //       });
    //     }
    //   }

    //   setInventoryIssues(issues);
    //   setIsValidating(false);
    // }

    validateInventory();
  }, [open, invoice]);

  const handleConfirm = async () => {
    if (processableInvoiceIds.length === 0) return;

    setIsLoading(true);
    try {
      await onConfirm(processableInvoiceIds);
      onOpenChange?.(false);
    } finally {
      setIsLoading(false);
    }
    // if (inventoryIssues.length > 0) return;

    // setIsLoading(true);
    // try {
    //   await onConfirm();
    //   onOpenChange?.(false);
    // } finally {
    //   setIsLoading(false);
    // }
  };

  // const hasInventoryIssues = inventoryIssues.length > 0;
  const hasProcessableInvoices = processableInvoiceIds.length > 0;
  const hasNonProcessableInvoices = invoiceStatuses.some(
    (s) => s.status !== 'processable'
  );

  return (
    <Dialog open={open}>
      <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {hasNonProcessableInvoices && onContinueEditing
              ? 'Factura generada sin suficiente inventario'
              : 'Confirmar Entrega'}
          </DialogTitle>
          <DialogDescription>
            {hasNonProcessableInvoices &&
              onContinueEditing &&
              'Tu factura fue generada pero necesitas actualizar tu inventario para confirmar la entrega'}
            {hasProcessableInvoices &&
              invoiceIds.length > 0 &&
              `Estás a punto de marcar ${processableInvoiceIds.length} de ${invoiceIds.length} facturas como entregadas.`}
            {hasProcessableInvoices &&
              invoiceIds.length > 0 &&
              '¿Estás seguro que deseas marcar esta factura como entregada? Esta acción reducirá el inventario de los productos.'}
          </DialogDescription>
        </DialogHeader>

        {isValidating ? (
          <div className='flex justify-center py-4'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : (
          <>
            {hasNonProcessableInvoices && (
              <Alert variant='destructive' className='mt-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertTitle>Problemas con algunas facturas</AlertTitle>
                <AlertDescription>
                  <p className='mb-2'>
                    Las siguientes facturas no pueden ser procesadas:
                  </p>

                  <Accordion type='single' collapsible className='w-full'>
                    {invoiceStatuses
                      .filter((s) => s.status !== 'processable')
                      .map((status) => (
                        <AccordionItem key={status.id} value={status.id}>
                          <AccordionTrigger className='text-sm'>
                            <div className='flex items-center gap-2'>
                              {status.status === 'delivered' && (
                                <CheckCircle className='h-4 w-4 text-green-500' />
                              )}
                              {status.status === 'cancelled' && (
                                <XCircle className='h-4 w-4 text-red-500' />
                              )}
                              {status.status === 'error' && (
                                <AlertCircle className='h-4 w-4 text-red-500' />
                              )}
                              <span>Factura {status.number}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {status.message && (
                              <p className='mb-2'>{status.message}</p>
                            )}

                            {status.inventoryIssues &&
                              status.inventoryIssues.length > 0 && (
                                <>
                                  <p className='mb-1'>
                                    Problemas de inventario:
                                  </p>
                                  <ul className='list-disc pl-5 space-y-1'>
                                    {status.inventoryIssues.map(
                                      (issue, idx) => (
                                        <li
                                          key={`${status.id}-${issue.productId}-${idx}`}
                                        >
                                          <span className='font-medium'>
                                            {issue.sku}
                                          </span>{' '}
                                          - {issue.name}
                                          {!issue.isService && (
                                            <>
                                              :
                                              <span className='text-red-600 font-medium'>
                                                {' '}
                                                Solicitado: {issue.requested},
                                                Disponible: {issue.available}
                                              </span>
                                            </>
                                          )}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </>
                              )}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                  </Accordion>
                </AlertDescription>
              </Alert>
            )}

            {hasProcessableInvoices && (
              <Alert
                variant='default'
                className='mt-4 border-green-200 bg-green-50'
              >
                <CheckCircle className='h-4 w-4 text-green-500' />
                <AlertTitle>Facturas listas para entrega</AlertTitle>
                <AlertDescription>
                  <p className='mb-2'>
                    Las siguientes facturas serán marcadas como entregadas:
                  </p>
                  <ul className='list-disc pl-5'>
                    {invoiceStatuses
                      .filter((s) => s.status === 'processable')
                      .map((status) => (
                        <li key={status.id}>Factura {status.number}</li>
                      ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={
              hasNonProcessableInvoices && onContinueEditing
                ? onContinueEditing
                : onCancel
            }
          >
            {!hasNonProcessableInvoices
              ? 'No Entregado'
              : `Editar Factura${invoiceIds.length > 1 ? 's' : ''}`}
          </Button>
          <Button
            onClick={hasProcessableInvoices ? handleConfirm : onCancel}
            disabled={isLoading || isValidating}
          >
            {isLoading && 'Procesando...'}
            {!isLoading && hasProcessableInvoices && 'Confirmar Entrega'}
            {!isLoading &&
              hasNonProcessableInvoices &&
              !hasProcessableInvoices &&
              '¡Entendido!'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // return (
  //   <Dialog open={open} onOpenChange={onOpenChange}>
  //     <DialogContent className='max-h-[85vh] overflow-y-auto'>
  //       <DialogHeader>
  //         <DialogTitle>Confirmar entrega de productos</DialogTitle>
  //         <DialogDescription>
  //           ¿Estás seguro que deseas marcar esta factura como entregada? Esta
  //           acción reducirá el inventario de los productos.
  //           {/* ¿Los productos de esta factura ya han sido entregados al cliente? */}
  //         </DialogDescription>
  //       </DialogHeader>
  //       {isValidating ? (
  //         <div className='flex justify-center py-4'>
  //           <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
  //         </div>
  //       ) : hasInventoryIssues ? (
  //         <Alert variant='destructive' className='mt-4'>
  //           <AlertCircle className='h-4 w-4' />
  //           <AlertTitle>Error de Inventario</AlertTitle>
  //           <AlertDescription className='overflow-x-hidden'>
  //             <p className='mb-2'>
  //               No hay suficiente inventario para los siguientes productos:
  //             </p>
  //             <ul className='list-disc pl-5 space-y-1'>
  //               {inventoryIssues.map((issue) => (
  //                 <li key={issue.productId}>
  //                   <span className='font-medium'>{issue.sku}</span> -{' '}
  //                   {issue.name}:
  //                   <span className='text-red-600 font-medium'>
  //                     {' '}
  //                     Solicitado: {issue.requested}, Disponible:{' '}
  //                     {issue.available}
  //                   </span>
  //                 </li>
  //               ))}
  //             </ul>
  //             <p className='mt-2'>
  //               Por favor actualice el inventario o modifique las cantidades en
  //               la factura.
  //             </p>
  //           </AlertDescription>
  //         </Alert>
  //       ) : null}
  //       <DialogFooter>
  //         <Button variant='outline' onClick={onCancel}>
  //           Cancelar
  //           {/* No, solo guardar */}
  //         </Button>
  //         <Button
  //           onClick={handleConfirm}
  //           disabled={isLoading || hasInventoryIssues || isValidating}
  //         >
  //           {isLoading ? 'Procesando...' : 'Confirmar Entrega'}
  //         </Button>
  //         {/* <Button onClick={onConfirm}>Sí, actualizar inventario</Button> */}
  //       </DialogFooter>
  //     </DialogContent>
  //   </Dialog>
  // );
}
