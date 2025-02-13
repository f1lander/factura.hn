'use client';

import AsyncSelect from 'react-select/async';
// import OptionsOrGroups from "react-select/async";
// import GroupBase from "react-select/async";
import React, { useState, useEffect } from 'react';
import { InputMask } from '@react-input/mask';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import {
  useFieldArray,
  Controller,
  useFormContext,
  useWatch,
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
  CheckIcon,
  FileSlidersIcon,
  PlusCircleIcon,
  Trash2,
} from 'lucide-react';
import {
  Invoice,
  InvoiceItem,
  invoiceService,
} from '@/lib/supabase/services/invoice';
import { numberToWords } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useCompanyStore } from '@/store/companyStore';
import { Customer, customerService } from '@/lib/supabase/services/customer';
import { useInvoicesStore } from '@/store/invoicesStore';
import { getStatusBadge } from '@/components/molecules/InvoicesTable';
import { Label } from '@/components/ui/label';
import { CustomerForm } from '@/components/molecules/CustomerForm';
import ProductSelect from '@/components/molecules/invoiceProductInputs/ProductSelect';
import DescriptionInput from '@/components/molecules/invoiceProductInputs/DescriptionInput';
import QuantityInput from '@/components/molecules/invoiceProductInputs/QuantityInput';
import DiscountInput from '@/components/molecules/invoiceProductInputs/DiscountInput';
import UnitCostInput from '@/components/molecules/invoiceProductInputs/UnitCostInput';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/lib/supabase/services/product';
import { Checkbox } from '@/components/ui/checkbox';

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
  isEditing?: boolean;
  invoice?: Invoice | null;
}

interface CustomerOption {
  value: string | number;
  label: string;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSave,
  isEditing,
  invoice,
}) => {
  const queryClient = useQueryClient();

  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(
    null
  );

  /** Here we retrieve the list of customers */
  const loadOptions = async (inputValue: string) => {
    if (!inputValue) return [];
    const retrievedCustomers =
      await customerService.getCustomersByCompanyAndCustomerName(inputValue);
    return retrievedCustomers.map((retrievedCustomer) => ({
      value: retrievedCustomer.id,
      label: retrievedCustomer.name,
      ...retrievedCustomer,
    }));
  };
  const noOptionsMessage = (inputValue: { inputValue: string }) => {
    return inputValue.inputValue
      ? 'No se encontraron clientes'
      : 'Escribe algo para buscar a un cliente';
  };

  // const { data: customers, isLoading: areCustomersLoading } = useQuery(
  //   ["customers"], // unique query key
  //   () => customerService.getCustomersByCompany(), // the function for fetching
  //   {
  //     staleTime: 300000,
  //     cacheTime: 600000,
  //     refetchOnWindowFocus: true,
  //   }
  // );
  const { data: products, isLoading: areProductsLoading } = useQuery(
    ['products'],
    () => productService.getProductsByCompany(),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    }
  );
  // const { products } = useProductsStore();
  const { company } = useCompanyStore();
  const { allInvoices } = useInvoicesStore();

  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<
    string | undefined
  >();
  const [lastInvoiceExists, setLastInvoiceExists] = useState<boolean>(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] =
    useState<boolean>(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    reset,
  } = useFormContext<Invoice>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invoice_items',
  });

  const customerId = watch('customer_id');
  const isProforma = watch('is_proforma');
  const isExento = watch('exento');

  // Initialize form with invoice data when editing
  useEffect(() => {
    if (isEditing && invoice) {
      reset(invoice);
      setLastInvoiceNumber(invoice.invoice_number);
    }
  }, [isEditing, invoice, reset]);

  useEffect(() => {
    if (
      allInvoices.filter((item) => item.status !== 'cancelled').at(-1) !==
      undefined
    ) {
      setLastInvoiceExists(true);
    } else {
      setLastInvoiceExists(false);
    }
  }, [setLastInvoiceExists, allInvoices]);

  const handleAddCustomerFormSubmit = async (data: Partial<Customer>) => {
    try {
      await customerService.createCustomer(data as Customer);
      setIsAddClientDialogOpen(false);
      toast({
        title: 'Cliente creado',
        description: 'El cliente se ha guardado exitosamente.',
      });
      queryClient.invalidateQueries(['customers']);
    } catch (err) {
      console.error('Error al guardar el cliente:', err);
      toast({
        title: 'Error',
        description:
          'No se pudo guardar el cliente. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const watchInvoiceItems = useWatch({
    name: 'invoice_items',
    control,
  });

  const watchClient = watch('customers');

  const isGenerateInvoiceButtonDisabled =
    invoiceService.generateInvoiceButtonShouldBeDisabled(
      isProforma,
      watchInvoiceItems,
      watchClient
    );

  useEffect(() => {
    const subtotal = watchInvoiceItems.reduce(
      (sum, item) => sum + (item.quantity * item.unit_cost - item.discount),
      0
    );
    const tax = isExento ? 0 : subtotal * 0.15; // Modified this line
    const total = subtotal + tax;

    setValue('subtotal', subtotal);
    setValue('tax', tax);
    setValue('total', total);
    setValue('numbers_to_letters', numberToWords(total));
    setValue('tax_exento', isExento ? subtotal : 0);
  }, [watchInvoiceItems, setValue, isExento]);

  /** Logic for setting the last and next invoice number */
  useEffect(() => {
    if (!isEditing) {
      const lastInvoice = allInvoices
        .filter((item) => item.status !== 'cancelled')
        .at(-1);
      let nextInvoiceNumber = '';
      if (lastInvoice) {
        setLastInvoiceNumber(lastInvoice.invoice_number);
        nextInvoiceNumber = invoiceService.generateNextInvoiceNumber(
          lastInvoice.invoice_number
        );
        setValue('invoice_number', nextInvoiceNumber);
      } else if (company && company.range_invoice1) {
        setLastInvoiceNumber(company.range_invoice1);
        setValue('invoice_number', company.range_invoice1);
      }
    }
  }, [company, allInvoices, setValue, isEditing]);

  /** Logic for setting the customer */
  // we're not going to need this since we'll retrieve this from the server, not from a list
  // useEffect(() => {
  //   if (customerId) {
  //     const selectedCustomer = customers!?.find((c) => c.id === customerId);
  //     if (selectedCustomer) {
  //       setValue("customers", {
  //         name: selectedCustomer.name,
  //         rtn: selectedCustomer.rtn,
  //         email: selectedCustomer.email,
  //       });
  //     }
  //   }
  // }, [customerId, customers, setValue]);

  const onSubmit = (data: Invoice) => {
    if (data.invoice_items.length < 1)
      setError('invoice_items', {
        type: 'required',
        message: 'At least one invoice',
      });
    onSave(data);
  };

  const handleAddProduct = () => {
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
    });
    setExpandedCardIndex(fields.length); // Set the new card as expanded
  };

  const renderEditableContent = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='grid gap-4'>
          <div className='flex items-center justify-between gap-4 py-4'>
            <Button
              className='bg-[#00A1D4] text-white'
              type='submit'
              disabled={isGenerateInvoiceButtonDisabled}
            >
              {isEditing ? 'Actualizar Factura' : 'Generar Factura'}{' '}
              <CheckIcon className='ml-2' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='bg-slate-600 text-white'
              onClick={() => {
                reset();
                if (lastInvoiceNumber) {
                  setValue(
                    'invoice_number',
                    invoiceService.generateNextInvoiceNumber(lastInvoiceNumber)
                  );
                }
              }}
            >
              Limpiar
            </Button>
          </div>
          <div className='flex gap-4'>
            <Controller
              name='customer_id'
              control={control}
              rules={{ required: 'Debes asociar un cliente a tu factura' }}
              render={({ field }) => (
                <AsyncSelect
                  className='w-full'
                  loadOptions={loadOptions}
                  noOptionsMessage={noOptionsMessage}
                  placeholder='Buscar cliente'
                  onChange={(value) => {
                    if (value !== null)
                      setValue('customers', {
                        name: value.name,
                        rtn: value.rtn,
                        email: value.email,
                      });
                    field.onChange(value?.id);
                  }}
                />
              )}
            />
            <Button
              className='md:w-1/4'
              variant='secondary'
              type='button'
              onClick={() => setIsAddClientDialogOpen(true)}
            >
              Cliente <PlusCircleIcon className='h-4 w-4 ml-2 text-[#00A1D4]' />
            </Button>
            {errors.customer_id && (
              <p className='text-red-500 text-sm'>
                {errors.customer_id.message}
              </p>
            )}
          </div>
          <Controller
            name='date'
            control={control}
            defaultValue={new Date().toISOString()}
            render={({ field }) => (
              <DatePicker
                onChange={(date) => field.onChange(date?.toISOString())}
                value={new Date(field.value)}
              />
            )}
          />
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='flex flex-col sm:flex-row gap-4'>
              {!isProforma ? (
                <>
                  <div className='flex-1'>
                    <div className='flex flex-col gap-2'>
                      <Label className='whitespace-nowrap'>
                        {isEditing ? 'Número actual' : 'Última factura'}
                      </Label>
                      <Input value={lastInvoiceNumber} disabled />
                    </div>
                  </div>

                  <div className='flex-1'>
                    <div className='flex flex-col gap-2'>
                      <Label className='whitespace-nowrap'>
                        {isEditing ? 'Mantener número' : 'Nueva factura'}
                      </Label>
                      <InputMask
                        className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                        mask='___-___-__-________'
                        replacement={{ _: /\d/ }}
                        {...register('invoice_number', {
                          required: 'Este campo es requerido',
                          validate: (value) => {
                            if (isEditing || isProforma) return true; // Skip validation when editing
                            const previousInvoiceNumber =
                              lastInvoiceNumber as string;
                            const nextInvoiceNumber = value;
                            const lastInvoiceRange = company!.range_invoice2!;
                            return invoiceService.validateNextInvoiceNumber(
                              previousInvoiceNumber,
                              nextInvoiceNumber,
                              lastInvoiceRange,
                              lastInvoiceExists
                            );
                          },
                        })}
                        placeholder='000-000-00-00000000'
                        disabled={isEditing || isProforma}
                      />

                      {errors.invoice_number && (
                        <p className='text-red-500 text-sm'>
                          {errors.invoice_number.message}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex-1'>
                  <div className='flex flex-col gap-2'>
                    <Label className='whitespace-nowrap'>
                      Número de Recibo/Proforma
                    </Label>
                    <Input
                      {...register('proforma_number', {
                        required: 'Este campo es requerido',
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <Separator className='my-4' />
        <Button
          className='w-full mb-4'
          variant='secondary'
          type='button'
          onClick={handleAddProduct}
        >
          Agregar item{' '}
          <PlusCircleIcon className='h-4 w-4 ml-2 text-[#00A1D4]' />
        </Button>
        <div className='w-full gap-1.5 flex flex-col-reverse'>
          {fields.map((item, index) => (
            <Card
              key={`${item.id || index}`}
              className='shadow-sm hover:shadow-md transition-shadow'
            >
              <CardHeader
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedCardIndex(
                    expandedCardIndex === index ? null : index
                  );
                }}
                className='p-4 flex flex-row items-center justify-between space-y-0 cursor-pointer'
              >
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Producto #{index + 1}
                  </CardTitle>
                  {expandedCardIndex !== index && (
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Badge
                        variant='outline'
                        className='text-slate-700 truncate max-w-[200px]'
                      >
                        {watchInvoiceItems[index].description ||
                          'Sin descripción'}
                      </Badge>
                      <Badge variant='secondary' className='text-slate-600'>
                        Cantidad: {watchInvoiceItems[index].quantity}
                      </Badge>
                      <Badge
                        variant='default'
                        className='bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      >
                        L. {calculateItemTotal(index, watchInvoiceItems)}
                      </Badge>
                    </div>
                  )}
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(index);
                  }}
                  className='text-rose-700 hover:text-rose-800 hover:bg-rose-50'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </CardHeader>
              {expandedCardIndex === index && (
                <>
                  <CardContent className='p-4 pt-0 grid gap-4'>
                    <div className='space-y-2'>
                      <Label>Producto</Label>
                      <ProductSelect
                        index={index}
                        products={products!}
                        placeholder={fields[index]?.description}
                        control={control}
                        setValue={setValue}
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label>Cantidad</Label>
                        <QuantityInput index={index} control={control} />
                      </div>

                      <div className='space-y-2'>
                        <Label>Precio Unitario</Label>
                        <Badge
                          variant='outline'
                          className='w-full py-2 px-3 flex items-center justify-between'
                        >
                          <span>L.</span>
                          <Controller
                            name={`invoice_items.${index}.unit_cost`}
                            control={control}
                            defaultValue={0}
                            render={({ field }) => (
                              <div className='w-24 text-right'>
                                {field.value.toFixed(2)}
                              </div>
                            )}
                          />
                        </Badge>
                      </div>

                      <div className='space-y-2'>
                        <Label>Descuento</Label>
                        <DiscountInput index={index} control={control} />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className='p-4 bg-muted/50'>
                    <div className='text-sm font-medium'>
                      Total: Lps. {calculateItemTotal(index, watchInvoiceItems)}
                    </div>
                  </CardFooter>
                </>
              )}
            </Card>
          ))}
        </div>
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
              onSubmit={handleAddCustomerFormSubmit}
              onCancel={() => {
                setIsAddClientDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (areProductsLoading) {
    return <div>Cargando productos...</div>;
  }

  return (
    <Card className='card-invoice border-none shadow-none rounded-sm flex flex-col h-[90vh]'>
      <CardHeader className='flex flex-row items-start justify-between bg-muted/50 shrink-0'>
        <div className='grid gap-0.5'>
          <CardTitle className='group flex items-center gap-2 text-lg'>
            {isEditing ? 'Editar Factura' : 'Crear Factura'}
            {isProforma && <Badge variant='default'>Proforma</Badge>}
            {isExento && <Badge className='bg-rose-700'>Exenta</Badge>}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? `Editando factura: ${invoice?.invoice_number}`
              : `Fecha: ${new Date(watch('date')).toLocaleDateString()}`}
          </CardDescription>
        </div>
        <div className='grid gap-4'>
          <div className='flex items-center space-x-2'>
            <Controller
              name='is_proforma'
              control={control}
              render={({ field }) => (
                <Checkbox
                  id='is_proforma'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isEditing}
                />
              )}
            />
            <label
              htmlFor='is_proforma'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Factura Proforma
            </label>
          </div>
          <div className='flex items-center space-x-2'>
            <Controller
              name='exento'
              control={control}
              render={({ field }) => (
                <Checkbox
                  id='is_exento'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label
              htmlFor='is_exento'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
            >
              Exenta
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent className='p-6 text-sm flex-1'>
        {renderEditableContent()}
      </CardContent>
      <CardFooter className='flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3 shrink-0'>
        <div className='text-xs text-muted-foreground'>
          {isEditing ? (
            <>
              Última modificación:{' '}
              <time dateTime={watch('updated_at')} suppressHydrationWarning>
                {new Date(watch('updated_at')).toLocaleString()}
              </time>
            </>
          ) : (
            <>
              Factura creada:{' '}
              <time dateTime={watch('created_at')} suppressHydrationWarning>
                {new Date(watch('created_at')).toLocaleString()}
              </time>
            </>
          )}
        </div>
        <div className='flex gap-4'>
          <Badge variant={watch('is_proforma') ? 'outline' : 'secondary'}>
            {watch('is_proforma') ? 'Proforma' : 'Factura'}
          </Badge>

          {getStatusBadge(watch('status'))}
        </div>
      </CardFooter>
    </Card>
  );
};

const calculateItemTotal = (index: number, items: InvoiceItem[]) => {
  const item = items[index];
  if (!item) return 0;
  return (item.quantity * item.unit_cost - item.discount).toLocaleString('en');
};

export default InvoiceForm;
