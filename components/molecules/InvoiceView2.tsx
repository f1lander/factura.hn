'use client';
import React, { useState, useEffect } from 'react';
import { InputMask } from '@react-input/mask';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  useForm,
  useFieldArray,
  Controller,
  Control,
  UseFormSetValue,
} from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  ChevronDown,
  ChevronUp,
  DownloadIcon,
  EditIcon,
  Hash,
  Package,
  Percent,
  ShoppingCart,
  Trash2,
  EyeIcon,
  X,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  invoiceService,
} from '@/lib/supabase/services/invoice';
import { Product } from '@/lib/supabase/services/product';
import { getSignedLogoUrl, numberToWords } from '@/lib/utils';
import { getStatusBadge } from './InvoicesTable';
import { renderPdf, getSignedPdfUrl } from '@/app/do-functions';
import { toast } from '@/components/ui/use-toast';
import { Label } from '../ui/label';
import { useCustomersStore } from '@/store/customersStore';
import { useProductsStore } from '@/store/productsStore';
import { useCompanyStore } from '@/store/companyStore';
import { CustomerForm } from './CustomerForm';
import { customerService } from '@/lib/supabase/services/customer';
import { useInvoicesStore } from '@/store/invoicesStore';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { sarCaiService } from '@/lib/supabase/services/sar_cai';
import { useQuery } from '@tanstack/react-query';
import { companyService } from '@/lib/supabase/services/company';
import { Company } from '@/lib/supabase/services/company';
import { Customer } from '@/lib/supabase/services/customer';
import dynamic from 'next/dynamic';

const InvoiceViewPdf = dynamic(
  () =>
    import('@/components/molecules/InvoiceViewPdf').then((mod) => mod.default),
  {
    loading: () => <div>Loading...</div>,
    ssr: false,
  }
);

interface InvoiceViewProps {
  invoice?: Invoice;
  isEditable: boolean;
  onSave: (invoice: Invoice) => void;
}

const InvoiceView2: React.FC<InvoiceViewProps> = ({
  invoice,
  isEditable,
  onSave,
}) => {
  const { customers, syncCustomers } = useCustomersStore();
  const { products } = useProductsStore();
  const { company } = useCompanyStore();
  const { allInvoices } = useInvoicesStore();
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<
    string | undefined
  >();
  const [lastInvoiceExists, setLastInvoiceExists] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] =
    useState<boolean>(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [companyData, setCompanyData] = useState<Company | null>(null);

  useEffect(() => {
    if (allInvoices.at(-1) !== undefined) {
      setLastInvoiceExists(true);
    } else {
      setLastInvoiceExists(false);
    }
  }, [setLastInvoiceExists, allInvoices]);

  const [expandedRows, setExpandedRows] = useState<any>({});

  const {
    data: companyLogo,
    isLoading,
    isFetching,
  } = useQuery(
    ['companyLogo', company?.logo_url],
    () => getSignedLogoUrl(company?.logo_url),
    {
      enabled: !!company?.logo_url,
    }
  );

  // Query to fetch SAR CAI data
  const { data: sarCaiData, isLoading: isSarCaiLoading } = useQuery({
    queryKey: ['sarCai', invoice?.sar_cai_id],
    queryFn: () => sarCaiService.getSarCaiById(invoice?.sar_cai_id ?? ''),
    enabled: !!invoice?.sar_cai_id,
  });

  // Add this useEffect to fetch company data
  useEffect(() => {
    const fetchCompanyData = async () => {
      const companyData = await companyService.getCompanyById();
      if (companyData) {
        setCompanyData(companyData);
      }
    };

    fetchCompanyData();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleFormSubmit = async (data: Partial<Customer>) => {
    try {
      await customerService.createCustomer(data as Customer);
      syncCustomers();
      setIsAddClientDialogOpen(false);
      toast({
        title: 'Cliente creado',
        description: 'El cliente se ha guardado exitosamente.',
      });
    } catch (err) {
      console.error('Error al guardar el cliente:', err);
      // setError("No se pudo guardar el cliente. Por favor, intente de nuevo.");
      toast({
        title: 'Error',
        description:
          'No se pudo guardar el cliente. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      let s3Url = invoice?.s3_url;
      let s3Key = invoice?.s3_key;
      if (!s3Key && !s3Url) {
        if (!company) {
          throw new Error('No se pudo obtener la información de la empresa');
        }

        const logoUrl = await getSignedLogoUrl(company?.logo_url);

        console.log('Generating PDF for invoice:', invoice);
        console.log('logoUrl:', logoUrl);
        const invoiceDate = format(invoice?.date ?? new Date(), 'dd/MM/yyyy');
        const limitDate = format(
          sarCaiData?.limit_date ?? new Date(),
          'dd/MM/yyyy'
        );
        const renderResult = await renderPdf({
          data: {
            date: invoiceDate,
            exento: invoice?.exento,
            invoice_number: invoice?.invoice_number,
            rtn: invoice?.customers.rtn,
            company: invoice?.customers.name,
            proforma: invoice?.is_proforma,
            proforma_number: invoice?.proforma_number,
            enabled: true,
            email: invoice?.customers.email,
            items: invoice?.invoice_items.map((item) => ({
              description: item.description,
              qty: item.quantity,
              cost: item.unit_cost,
              discount: item.discount,
            })),
          },
          company_info: {
            id: company?.id,
            name: company?.name,
            rtn: company?.rtn,
            address0: company?.address0,
            address1: company?.address1,
            address2: company?.address2,
            phone: company?.phone,
            cai: sarCaiData?.cai,
            limitDate,
            rangeInvoice1: sarCaiData?.range_invoice1,
            rangeInvoice2: sarCaiData?.range_invoice2,
            email: company?.email,
            logo_url: logoUrl,
          },
          template_url: company?.template_url
            ? `https://factura-hn.nyc3.digitaloceanspaces.com/templates/${company?.template_url}`
            : process.env.NEXT_PUBLIC_TEMPLATE_URL,
        });

        s3Key = renderResult.s3_key;
        s3Url = renderResult.s3_url;

        // Update the invoice with the new S3 data
        if (invoice && invoice.id) {
          const updatedInvoice = await invoiceService.updateInvoice(
            invoice.id,
            {
              s3_url: s3Url,
              s3_key: s3Key,
            }
          );

          console.log('Updated invoice:', updatedInvoice);
        } else {
          throw new Error('El ID de la factura no es válido');
        }
      }

      if (s3Url && s3Key) {
        // Get the presigned URL
        const presignedUrlData = await getSignedPdfUrl({
          s3_url: s3Url,
          s3_key: s3Key,
        });

        const { presigned_url } = JSON.parse(presignedUrlData);
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = presigned_url;
        link.download = `${invoice?.invoice_number}-${s3Key}.pdf`; // Set a default filename
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Clean up
        document.body.removeChild(link);

        toast({
          title: 'Success',
          description: 'Tu factura se descargó correctamente.',
          duration: 3000,
        });
      } else {
        throw new Error('Ocurrio un error al obtener la URL de la factura');
      }
    } catch (error) {
      console.error('Error descargando la factura PDF:', error);
      // You might want to show an error message to the user here
      toast({
        title: 'Error',
        description: 'Error descargando la factura PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
    setError,
  } = useForm<Invoice>({
    defaultValues: invoice || {
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
  const router = useRouter();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invoice_items',
  });
  const noProductsAdded: boolean = getValues('invoice_items').length === 0;

  const watchInvoiceItems = watch('invoice_items');

  // this is what's consuming so much bandwidth
  useEffect(() => {
    const fetchData = async () => {
      // Fetch the last invoice number
      const lastInvoice = await invoiceService.getLastInvoice();
      if (lastInvoice) {
        setLastInvoiceNumber(lastInvoice);
      } else {
        // If no last invoice, use the range_invoice1 from company
        setLastInvoiceNumber(company?.range_invoice1);
      }
    };

    fetchData();
    // como esto no ha cambiado, entonces no se ejecuta
  }, [company]);

  useEffect(() => {
    if (lastInvoiceNumber && !invoice) {
      if (lastInvoiceExists) {
        const nextInvoiceNumber = generateNextInvoiceNumber(lastInvoiceNumber);
        setValue('invoice_number', nextInvoiceNumber);
      } else if (company !== null && company.range_invoice1 !== undefined) {
        setValue('invoice_number', company.range_invoice1);
      }
    }
  }, [lastInvoiceNumber, invoice, setValue, company, lastInvoiceExists]);

  useEffect(() => {
    const subtotal = watchInvoiceItems.reduce(
      (sum, item) => sum + (item.quantity * item.unit_cost - item.discount),
      0
    );
    const tax = invoice?.exento ? 0 : subtotal * 0.15; // Assuming 15% tax rate if not exento
    const total = subtotal + tax;

    setValue('subtotal', subtotal);
    setValue('tax', tax);
    setValue('total', total);
    setValue('numbers_to_letters', numberToWords(total));
  }, [watchInvoiceItems, setValue]);

  useEffect(() => {
    const customerId = watch('customer_id');
    if (customerId) {
      const selectedCustomer = customers.find(
        (c: Customer) => c.id === customerId
      );
      if (selectedCustomer) {
        setValue('customers', {
          name: selectedCustomer.name,
          rtn: selectedCustomer.rtn,
          email: selectedCustomer.email,
        });
      }
    }
  }, [watch('customer_id'), customers, setValue]);

  const generateNextInvoiceNumber = (lastNumber: string) => {
    const parts = lastNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const nextNumber = (parseInt(lastPart, 10) + 1).toString().padStart(8, '0');
    parts[parts.length - 1] = nextNumber;
    return parts.join('-');
  };

  const onSubmit = (data: Invoice) => {
    // return console.log(data);
    const { subtotal, total, tax } = invoiceService.computeInvoiceData(
      data.invoice_items
    );
    data.subtotal = subtotal;
    data.total = total;
    data.tax = tax;
    if (data.invoice_items.length < 1)
      setError('invoice_items', {
        type: 'required',
        message: 'At least one invoice',
      });
    onSave(data);
  };

  const validateInvoiceNumber = (value: string) => {
    const previousInvoiceNumber = lastInvoiceNumber as string;
    const nextInvoiceNumber = value;
    const regex = /^\d{3}-\d{3}-\d{2}-\d{8}$/;
    if (!regex.test(value)) {
      return 'El número de factura debe tener el formato 000-000-00-00000000';
    }
    if (!invoiceService.isInvoiceNumberValid(value, company!.range_invoice2!))
      return 'El número de factura está fuera del rango de facturación actual';
    const nextAndPreviousComparison = invoiceService.compareInvoiceNumbers(
      nextInvoiceNumber,
      previousInvoiceNumber
    );
    if (!lastInvoiceExists) {
      const nextGreaterOrEqualThanPrevious =
        nextAndPreviousComparison === 'first greater than second' ||
        nextAndPreviousComparison === 'equal';
      if (!nextGreaterOrEqualThanPrevious) {
        return 'El siguiente número de factura no puede ser menor que el anterior';
      }
    }
    if (lastInvoiceExists) {
      const nextGreaterThanPrevious =
        nextAndPreviousComparison === 'first greater than second';
      if (!nextGreaterThanPrevious)
        return 'El siguiente número de factura debe ser mayor que el anterior';
    }
    return true;
  };

  const renderEditableContent = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='grid gap-4'>
          <Controller
            name='customer_id'
            control={control}
            rules={{ required: 'Debes asociar un cliente a tu factura' }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder='Seleccione cliente' />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: Customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Button
            type='button'
            className='md:w-1/2'
            onClick={() => setIsAddClientDialogOpen(true)}
          >
            Añadir cliente
          </Button>
          {errors.customer_id && (
            <p className='text-red-500 text-sm'>{errors.customer_id.message}</p>
          )}
          <Controller
            name='date'
            control={control}
            render={({ field }) => (
              <DatePicker
                onChange={(date) => field.onChange(date?.toISOString())}
              />
            )}
          />
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex-1'>
              <div className='flex flex-col gap-2'>
                <Label className='whitespace-nowrap'>Última factura</Label>
                <Input value={lastInvoiceNumber} disabled />
              </div>
            </div>
            <div className='flex-1'>
              <div className='flex flex-col gap-2'>
                <Label className='whitespace-nowrap'>Nueva factura</Label>
                {/* <Input */}
                {/*   id="name" */}
                {/*   {...register("invoice_number", { */}
                {/*     required: "Este campo es requerido", */}
                {/*     validate: validateInvoiceNumber, */}
                {/*   })} */}
                {/* /> */}
                <InputMask
                  className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                  mask='___-___-__-________'
                  replacement={{ _: /\d/ }}
                  {...register('invoice_number', {
                    required: 'Este campo es requerido',
                    validate: validateInvoiceNumber,
                  })}
                  placeholder='000-000-00-00000000'
                />
                {errors.invoice_number && (
                  <p className='text-red-500 text-sm'>
                    {errors.invoice_number.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <Separator className='my-4' />
        <div className='grid gap-4'>
          <div className='hidden sm:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Descuento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((item, index) => (
                  <>
                    <TableRow key={item.id}>
                      <TableCell>
                        <ProductSelect
                          index={index}
                          products={products}
                          control={control}
                          setValue={setValue}
                        />
                      </TableCell>
                      <TableCell>
                        <DescriptionInput index={index} control={control} />
                      </TableCell>
                      <TableCell>
                        <QuantityInput index={index} control={control} />
                      </TableCell>
                      <TableCell>
                        <UnitCostInput index={index} control={control} />
                      </TableCell>
                      <TableCell>
                        <DiscountInput index={index} control={control} />
                      </TableCell>
                      <TableCell>
                        {`Lps. ${calculateItemTotal(index, watchInvoiceItems)}`}
                      </TableCell>
                      <TableCell>
                        <Button
                          type='button'
                          variant='destructive'
                          size='icon'
                          onClick={() => remove(index)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='sm:hidden'>
            {fields.map((item, index) => (
              <div key={item.id} className='mb-4 p-4 border rounded'>
                <ProductSelect
                  index={index}
                  products={products}
                  control={control}
                  setValue={setValue}
                />
                <DescriptionInput index={index} control={control} />
                <QuantityInput index={index} control={control} />
                <UnitCostInput index={index} control={control} />
                <DiscountInput index={index} control={control} />
                <div className='mt-2'>
                  {`Total: Lps. ${calculateItemTotal(
                    index,
                    watchInvoiceItems
                  )}`}
                </div>
                <Button
                  type='button'
                  variant='destructive'
                  size='sm'
                  onClick={() => remove(index)}
                  className='mt-2'
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
          <Button
            type='button'
            onClick={() =>
              append({
                id: '',
                invoice_id: '',
                product_id: '',
                description: '',
                quantity: 1,
                unit_cost: 0,
                discount: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
            }
          >
            Agregar Producto o Servicio
          </Button>
        </div>
        {/* Inhabilita el botón si el formulario no se ha tocado y todas las entradas aún son inválidas */}
        <Button
          type='submit'
          className='mt-4'
          // disabled={noProductsAdded && (!isDirty || !isValid)}
          disabled={noProductsAdded}
        >
          Generar Factura
        </Button>
      </form>
      <Dialog
        open={isAddClientDialogOpen}
        onOpenChange={setIsAddClientDialogOpen}
      >
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent className='w-[90%]' id='contenido del dialogo papa'>
          <div className='transition-all duration-300 ease-in-out'>
            <CustomerForm
              customer={undefined}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsAddClientDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  const handleEditInvoice = () => {
    router.push(`/home/invoices/create-invoice?invoice_id=${invoice?.id}`);
  };

  const handleViewPdf = () => {
    setShowPdfViewer(true);
  };

  const renderReadOnlyContent = () => (
    <>
      <div className='grid gap-3'>
        <div className='font-semibold'>Informacion del Cliente</div>
        <dl className='grid gap-1'>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>Cliente:</dt>
            <dd>{watch('customers.name')}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>RTN:</dt>
            <dd>{watch('customers.rtn')}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>Correo:</dt>
            <dd>{watch('customers.email')}</dd>
          </div>
        </dl>
      </div>
      <Separator className='my-4' />
      <div className='grid gap-3'>
        <div className='font-semibold'>Detalles de la factura</div>

        {/* Desktop/Tablet View */}
        <div className='hidden sm:block'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className='text-right'>Cantidad</TableHead>
                <TableHead className='text-right'>Precio</TableHead>
                <TableHead className='text-right'>Descuento</TableHead>
                <TableHead className='text-right'>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watch('invoice_items').map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className='text-right'>{item.quantity}</TableCell>
                  <TableCell className='text-right'>
                    {`Lps. ${item.unit_cost.toLocaleString('en')}`}
                  </TableCell>
                  <TableCell className='text-right'>
                    {`Lps. ${item.discount.toLocaleString('en')}`}
                  </TableCell>
                  <TableCell className='text-right'>
                    {`Lps. ${(
                      item.quantity * item.unit_cost -
                      item.discount
                    ).toLocaleString('en')}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View with Collapsible Rows */}
        <div className='sm:hidden divide-y divide-gray-200'>
          {watch('invoice_items').map((item) => (
            <div key={item.id} className='bg-white'>
              <div
                className='py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200'
                onClick={() => toggleRow(item.id)}
              >
                {/* Description with icon */}
                <div className='flex items-start gap-3 mb-3'>
                  <Package className='w-5 h-5 text-blue-500 mt-1 flex-shrink-0' />
                  <div className='text-sm text-gray-900 font-medium leading-snug'>
                    {item.description}
                  </div>
                </div>

                {/* Quantity x Price and Total */}
                <div className='flex justify-between items-center mb-2 pl-8'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <ShoppingCart className='w-4 h-4' />
                    <span>
                      {item.quantity} x{' '}
                      {`Lps. ${item.unit_cost.toLocaleString('en')}`}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center text-green-600'>
                      <p className='font-semibold'>Lps.</p>
                      <span className='font-medium'>
                        {`${(
                          item.quantity * item.unit_cost -
                          item.discount
                        ).toLocaleString('en')}`}
                      </span>
                    </div>
                    {expandedRows[item.id] ? (
                      <ChevronUp className='w-5 h-5 text-gray-400 ml-2' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-gray-400 ml-2' />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRows[item.id] && (
                  <div className='mt-3 pt-3 border-t border-gray-200 text-sm pl-8'>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2'>
                        <Hash className='w-4 h-4 text-gray-400' />
                        <span className='text-gray-500'>ID:</span>
                        <span className='font-medium text-gray-700'>
                          {item.product_id}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Percent className='w-4 h-4 text-orange-500' />
                        <span className='text-gray-500'>Descuento:</span>
                        <span className='font-medium text-orange-600'>
                          {`Lps. ${item.discount.toLocaleString('en')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Separator className='my-4' />
      <div className='grid gap-4'>
        <div className='grid gap-3'>
          <div className='font-semibold'>Resumen de la Factura</div>
          <dl className='grid gap-1'>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Subtotal:</dt>
              <dd>{`Lps. ${watch('subtotal').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Exonerado:</dt>
              <dd>{`Lps. ${watch('tax_exonerado').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Exento:</dt>
              <dd>{`Lps. ${watch('tax_exento').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Gravado 15%:</dt>
              <dd>{`Lps. ${watch('tax_gravado_15').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>Gravado 18%:</dt>
              <dd>{`Lps. ${watch('tax_gravado_18').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>ISV 15%:</dt>
              <dd>{`Lps. ${watch('tax').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between'>
              <dt className='text-muted-foreground'>ISV 18%:</dt>
              <dd>{`Lps. ${watch('tax_18').toLocaleString('en')}`}</dd>
            </div>
            <div className='flex items-center justify-between font-semibold'>
              <dt>Total:</dt>
              <dd>{`Lps. ${watch('total').toLocaleString('en')}`}</dd>
            </div>
          </dl>
        </div>
      </div>
      <Separator className='my-4' />
      <div>
        <div className='font-semibold'>Notas</div>
        <p className='mt-2 text-muted-foreground'>
          {watch('numbers_to_letters')}
        </p>
      </div>
    </>
  );

  if (isLoading || isFetching || isSarCaiLoading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary' />
      </div>
    );
  }

  return (
    <>
      <div className='flex gap-2 w-full justify-end'>
        {!isEditable && (
          <div className='flex gap-2 mb-1'>
            {invoice?.status === 'pending' && !invoice?.delivered_date && (
              <Button
                className='bg-yellow-500'
                onClick={handleEditInvoice}
                variant='outline'
                size='sm'
              >
                Editar <EditIcon className='h-4 w-4 ml-2' />
              </Button>
            )}
            {!showPdfViewer && (
              <>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleViewPdf}
                  size='sm'
                  className='flex items-center gap-2'
                >
                  <EyeIcon />
                  PDF
                </Button>
                {/* <Button
                  className='bg-slate-800'
                  onClick={handleDownloadPdf}
                  disabled={isDownloading || isSarCaiLoading}
                  size='sm'
                >
                  {isDownloading ? 'Descargando...' : 'PDF'}{' '}
                  <DownloadIcon className='h-4 w-4 ml-2' />
                </Button> */}
              </>
            )}
            {showPdfViewer && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowPdfViewer(false)}
              >
                <X className='h-4 w-4 mr-2' /> Cerrar
              </Button>
            )}
          </div>
        )}
      </div>
      {!showPdfViewer && (
        <Card className='card-invoice overflow-hidden shadow-none rounded-sm px-0'>
          <CardHeader className='flex flex-col md:flex-row items-start justify-between bg-muted/50'>
            <div className='flex flex-row items-stretch justify-between w-full'>
              <div className='flex-1 grid gap-0.5'>
                <CardTitle className='group flex items-center gap-2 text-lg'>
                  {invoice?.is_proforma
                    ? `Recibo / Proforma ${invoice?.proforma_number}`
                    : isEditable
                    ? 'Crear Factura'
                    : `Número de Factura ${invoice?.invoice_number}`}
                </CardTitle>
                <CardDescription>
                  Fecha:{' '}
                  {isEditable
                    ? new Date().toLocaleDateString()
                    : new Date(invoice?.date || '').toLocaleDateString()}
                </CardDescription>
              </div>
              {companyLogo !== null && (
                <div className='relative h-[100px] aspect-video z-0'>
                  <Image
                    src={companyLogo!}
                    alt='company-logo'
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className='p-6 text-sm'>
            {isEditable ? renderEditableContent() : renderReadOnlyContent()}
          </CardContent>
          <CardFooter className='flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3'>
            <div className='text-xs text-muted-foreground'>
              Factura creada:{' '}
              <time dateTime={watch('created_at')} suppressHydrationWarning>
                {new Date(watch('created_at')).toLocaleString()}
              </time>
            </div>
            <div>
              <Badge variant={watch('is_proforma') ? 'outline' : 'secondary'}>
                {watch('is_proforma') ? 'Proforma' : 'Factura'}
              </Badge>
              <Badge variant={watch('is_proforma') ? 'outline' : 'secondary'}>
                {getStatusBadge(watch('status'), !!watch('delivered_date'))}
              </Badge>
            </div>
          </CardFooter>
        </Card>
      )}
      {showPdfViewer && invoice && (
        <div className='p-4 h-full'>
          <InvoiceViewPdf
            invoice={invoice}
            company={companyData || undefined}
          />
        </div>
      )}
    </>
  );
};

// Helper components
const ProductSelect = ({
  index,
  products,
  control,
  setValue,
}: {
  index: number;
  products: Product[];
  control: Control<Invoice, any>;
  setValue: UseFormSetValue<Invoice>;
}) => (
  <Controller
    name={`invoice_items.${index}.product_id`}
    control={control}
    rules={{ required: 'Debes agregar un producto' }}
    render={({ field }) => (
      <Select
        onValueChange={(value) => {
          field.onChange(value);
          const selectedProduct = products.find((p) => p.id === value);
          if (selectedProduct) {
            setValue(
              `invoice_items.${index}.unit_cost`,
              selectedProduct.unit_cost
            );
            setValue(
              `invoice_items.${index}.description`,
              selectedProduct.description
            );
          }
        }}
        value={field.value}
      >
        <SelectTrigger>
          <SelectValue placeholder='Seleccione producto' />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
);

const DescriptionInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.description`}
    control={control}
    render={({ field }) => (
      <Input {...field} placeholder='Descripción' className='mt-2' />
    )}
  />
);

type InputProps = {
  index: number;
  control: Control<Invoice>;
};

const QuantityInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.quantity`}
    control={control}
    rules={{ min: 1 }}
    render={({ field }) => (
      <Input
        type='number'
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder='Quantity'
        className='mt-2'
      />
    )}
  />
);

const UnitCostInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.unit_cost`}
    control={control}
    render={({ field }) => (
      <Input
        type='number'
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder='Unit Cost'
        className='mt-2'
      />
    )}
  />
);

const DiscountInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.discount`}
    control={control}
    render={({ field }) => (
      <Input
        type='number'
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder='Discount'
        className='mt-2'
      />
    )}
  />
);

const calculateItemTotal = (index: number, items: InvoiceItem[]) => {
  const item = items[index];
  return (item.quantity * item.unit_cost - item.discount).toLocaleString('en');
};

export default InvoiceView2;
