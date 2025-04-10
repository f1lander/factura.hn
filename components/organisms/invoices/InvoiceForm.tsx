'use client';

import AsyncSelect from 'react-select/async';
import React, { useState, useEffect } from 'react';
import { InputMask } from '@react-input/mask';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

import { Input } from '@/components/ui/input';

import { DatePicker } from '@/components/ui/date-picker';
import { CheckIcon, HelpCircle, PlusCircleIcon, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Invoice,
  InvoiceItem,
  invoiceService,
} from '@/lib/supabase/services/invoice';
import { numberToWords } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { Customer, customerService } from '@/lib/supabase/services/customer';
import { getStatusBadge } from '@/components/molecules/InvoicesTable';
import { Label } from '@/components/ui/label';
import { CustomerForm } from '@/components/molecules/CustomerForm';
import ProductSelect from '@/components/molecules/invoiceProductInputs/ProductSelect';
import QuantityInput from '@/components/molecules/invoiceProductInputs/QuantityInput';
import DiscountInput from '@/components/molecules/invoiceProductInputs/DiscountInput';
import UnitCostInput from '@/components/molecules/invoiceProductInputs/UnitCostInput';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/lib/supabase/services/product';
import { Checkbox } from '@/components/ui/checkbox';
import { companyService } from '@/lib/supabase/services/company';
import { differenceInCalendarDays } from 'date-fns';
import { PaymentMethodSelect } from '@/components/molecules/PaymentMethodSelect';
import { TaxType } from '@/lib/supabase/services/product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as R from 'ramda';
import { NewInvoiceLoadingSkeleton } from './NewInvoiceLoadingSkeleton';

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
  const invoiceNumber = watch('invoice_number');
  const isProforma = watch('is_proforma');

  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(
    null
  );

  const { data: universalcustomer } = useQuery(
    ['universalcustomers'],
    async () => {
      const customers = await customerService.getUniversalCustomers();
      return R.head(customers);
      // return customers.map((retrievedCustomer) => ({
      //   value: retrievedCustomer.id,
      //   label: retrievedCustomer.name,
      //   ...retrievedCustomer,
      // }));
    }
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

  const { data: companyId } = useQuery(['companyId'], () =>
    companyService.getCompanyId()
  );

  const { data: latestInvoiceNumber } = useQuery(
    ['latestInvoiceNumberInRange', companyId],
    () => invoiceService.getLatestInvoiceNumberInSarCaiRange(),
    {
      enabled: !!companyId,
      onSuccess: (data) => {
        if (data?.latest_invoice_number && !isEditing) {
          // setLastInvoiceNumber(data);
          const nextInvoiceNumber = data?.error
            ? data?.latest_invoice_number
            : invoiceService.generateNextInvoiceNumber(
                data?.latest_invoice_number
              );
          setValue('invoice_number', nextInvoiceNumber);
        }
      },
    }
  );

  const { data: products, isLoading: areProductsLoading } = useQuery(
    ['products', companyId],
    () => productService.getProductsByCompany(),
    { enabled: !!companyId }
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
      onSuccess: (data) => {
        if (data && !isEditing && !invoiceNumber) {
          setValue('invoice_number', data.range_invoice1);
        }
      },
    }
  );

  // Example check that could be added to a dashboard component
  useEffect(() => {
    if (!latestSarCai && !isLoading) {
      toast({
        title: 'No tiene CAI configurado',
        description:
          'Por favor, configure un CAI para poder cumplir con las regulaciones del SAR.',
        duration: 10000,
        className: 'border-border border-red-500 text-red-700',
        variant: 'default',
      });
      return;
    }

    if (latestSarCai) {
      const limitDate = new Date(latestSarCai.limit_date);
      const today = new Date();
      const daysUntilExpiration = differenceInCalendarDays(limitDate, today);

      const severity = daysUntilExpiration <= 1 ? 'destructive' : 'default';

      const title =
        daysUntilExpiration <= 1 ? 'CAI Vencido' : 'CAI Vence pronto';
      const message =
        daysUntilExpiration <= 1
          ? 'Su CAI está vencido. Por favor, actualice su CAI.'
          : daysUntilExpiration <= 30
          ? `Su CAI actual vencerá en ${daysUntilExpiration} días.`
          : '';

      if (daysUntilExpiration <= 30) {
        toast({
          title,
          description: message,
          duration: 10000,
          variant: severity,
        });
      }
    }
  }, [latestSarCai, isLoading]);

  const [isAddClientDialogOpen, setIsAddClientDialogOpen] =
    useState<boolean>(false);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'invoice_items',
  });

  const customerId = watch('customer_id');

  const {
    data: selectedCustomer,
    isLoading: isLoadingCustomer,
    isFetching: isFetchingCustomer,
  } = useQuery(
    ['customer', customerId],
    async () => {
      const customer = await customerService.getCustomerById(
        customerId as string
      );

      return customer;
    },
    {
      enabled: !!customerId,
      placeholderData: universalcustomer,
    }
  );

  useEffect(() => {
    if (
      !isLoadingCustomer &&
      !isFetchingCustomer &&
      selectedCustomer &&
      customerId !== selectedCustomer?.id
    ) {
      setValue('customer_id', selectedCustomer?.id);
      setValue('customers', {
        name: selectedCustomer?.name!,
        rtn: selectedCustomer?.rtn!,
        email: selectedCustomer?.email!,
      });
    }
  }, [isLoadingCustomer, isFetchingCustomer, selectedCustomer, setValue]);

  // Add effect to handle invoice_number when isProforma changes
  useEffect(() => {
    if (isProforma) {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');
      const proformaNumber = `PROFORM-${year}${month}${day}-${random}`;
      setValue('invoice_number', proformaNumber);
      setValue('proforma_number', proformaNumber);
    } else if (latestInvoiceNumber?.latest_invoice_number) {
      setValue(
        'invoice_number',
        latestInvoiceNumber?.error
          ? latestInvoiceNumber?.latest_invoice_number
          : invoiceService.generateNextInvoiceNumber(
              latestInvoiceNumber?.latest_invoice_number
            )
      );
    }
  }, [isProforma, setValue, latestInvoiceNumber]);

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
  const isInvoiceModeOnly = !latestSarCai && !isLoading;

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

    // Calculate taxes based on individual product tax types
    const taxExento = watchInvoiceItems.reduce((sum, item) => {
      if (item.tax_type === TaxType.EXENTO) {
        return sum + (item.quantity * item.unit_cost - item.discount);
      }
      return sum;
    }, 0);

    const taxExonerado = watchInvoiceItems.reduce((sum, item) => {
      if (item.tax_type === TaxType.EXONERADO) {
        return sum + (item.quantity * item.unit_cost - item.discount);
      }
      return sum;
    }, 0);

    const taxGravado15 = watchInvoiceItems.reduce((sum, item) => {
      if (item.tax_type === TaxType.GRAVADO_15) {
        return sum + (item.quantity * item.unit_cost - item.discount);
      }
      return sum;
    }, 0);

    const taxGravado18 = watchInvoiceItems.reduce((sum, item) => {
      if (item.tax_type === TaxType.GRAVADO_18) {
        return sum + (item.quantity * item.unit_cost - item.discount);
      }
      return sum;
    }, 0);

    const tax = taxGravado15 * 0.15 + taxGravado18 * 0.18;
    const total = subtotal + tax;

    setValue('subtotal', subtotal);
    setValue('tax', tax);
    setValue('tax_exento', taxExento);
    setValue('tax_exonerado', taxExonerado);
    setValue('tax_gravado_15', taxGravado15);
    setValue('tax_gravado_18', taxGravado18);
    setValue('total', total);
    setValue('numbers_to_letters', numberToWords(total));
  }, [watchInvoiceItems, setValue]);

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

  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const renderEditableContent = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className='grid gap-4'>
          <div className='flex items-center justify-end lg:justify-between gap-4'>
            <Button
              className='items-center gap-2 hidden lg:flex bg-facturaBlue text-white'
              type='submit'
              disabled={isGenerateInvoiceButtonDisabled}
            >
              {isEditing ? 'Actualizar Factura' : 'Generar Factura'}
              <CheckIcon className='ml-2' />
            </Button>
            <Button
              variant='default'
              type='button'
              size='sm'
              className='bg-facturaBlue text-white w-full lg:w-auto'
              onClick={() => {
                setIsResetDialogOpen(true);
              }}
            >
              <PlusCircleIcon className='h-4 w-4 mr-2' />
              Nueva Factura
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
                  value={{
                    value: selectedCustomer?.id,
                    label: selectedCustomer?.name,
                    ...selectedCustomer,
                  }}
                  onChange={(value) => {
                    if (value !== null && value !== undefined)
                      setValue('customers', {
                        name: value.name!,
                        rtn: value.rtn!,
                        email: value.email!,
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
                      <Input
                        value={latestInvoiceNumber?.latest_invoice_number || ''}
                        disabled
                      />
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
                        {...register('invoice_number')}
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
                    <Label className='whitespace-nowrap flex items-center gap-2'>
                      Número de Proforma
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className='h-4 w-4 text-muted-foreground cursor-help' />
                          </TooltipTrigger>
                          <TooltipContent className='w-80'>
                            <p>
                              El formato por defecto es PROFORM-YYYYMMDD-XXX:
                            </p>
                            <ul className='list-disc list-inside'>
                              <li>YYYY: año actual</li>
                              <li>MM: mes (01-12)</li>
                              <li>DD: día (01-31)</li>
                              <li>XXX: número único (000-999)</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input
                      className='flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                      {...register('proforma_number')}
                      placeholder='PROFORM-YYYYMMDD-XXX'
                      defaultValue={watch('invoice_number') || ''}
                    />
                  </div>
                </div>
              )}
              {companyId && (
                <Controller
                  name='payment_method'
                  control={control}
                  render={({ field }) => (
                    <div className='flex flex-col gap-2'>
                      <Label className='whitespace-nowrap'>
                        Metodo de Pago
                      </Label>
                      <PaymentMethodSelect
                        key={field.value?.id}
                        companyId={companyId}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                      />
                    </div>
                  )}
                />
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
                className='p-4 flex flex-row items-center justify-between cursor-pointer'
              >
                <div className='flex flex-col gap-2'>
                  <CardTitle className='flex items-center text-sm font-medium gap-2'>
                    {watchInvoiceItems[index]?.is_service
                      ? 'Servicio'
                      : 'Producto'}{' '}
                    #{index + 1}
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
                  </CardTitle>
                  {expandedCardIndex !== index && (
                    <div className='flex items-center gap-2 flex-wrap'>
                      <Badge
                        variant='outline'
                        className='text-slate-700 truncate w-full'
                      >
                        {watchInvoiceItems[index].description ||
                          'Sin descripción'}
                      </Badge>
                      <div className='flex gap-2'>
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
                    </div>
                  )}
                </div>
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
                        <Label>Precio Unitario L.</Label>
                        {/* <UnitCostInput index={index} control={control} /> */}
                        <Badge
                          variant='outline'
                          className='w-full px-3 py-0 pr-0 flex items-center justify-between'
                        >
                          <span>L.</span>
                          <Controller
                            name={`invoice_items.${index}.unit_cost`}
                            control={control}
                            defaultValue={0}
                            render={({ field }) => (
                              <UnitCostInput
                                index={index}
                                control={control}
                                className='border-none bg-transparent w-full shadow-none'
                              />
                            )}
                          />
                        </Badge>
                      </div>

                      <div className='space-y-2'>
                        <Label>Descuento</Label>
                        <DiscountInput index={index} control={control} />
                      </div>

                      <div className='space-y-2'>
                        <Label>Tipo de Impuesto</Label>
                        <Controller
                          name={`invoice_items.${index}.tax_type`}
                          control={control}
                          defaultValue={TaxType.GRAVADO_15}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Selecciona el tipo de impuesto' />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={TaxType.EXENTO}>
                                  0% (Exento)
                                </SelectItem>
                                <SelectItem value={TaxType.EXONERADO}>
                                  0% (Exonerado)
                                </SelectItem>
                                <SelectItem value={TaxType.GRAVADO_15}>
                                  15%
                                </SelectItem>
                                <SelectItem value={TaxType.GRAVADO_18}>
                                  18%
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
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
        <DialogContent
          className='w-[90%] overflow-auto max-h-lvh'
          id='contenido del dialogo papa'
        >
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
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className='w-[90%] lg:w-[425px]'>
          <DialogHeader>
            <DialogTitle>¿Crear nueva factura?</DialogTitle>
            <DialogDescription>
              Esta acción limpiará todos los datos de la factura actual. Los
              cambios no guardados se perderán.
            </DialogDescription>
          </DialogHeader>
          <div className='flex justify-end gap-3 mt-4'>
            <Button
              variant='outline'
              onClick={() => setIsResetDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                reset();
                if (isProforma) {
                  const date = new Date();
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  const random = Math.floor(Math.random() * 1000)
                    .toString()
                    .padStart(3, '0');
                  const proformaNumber = `PROFORM-${year}${month}${day}-${random}`;
                  setValue('invoice_number', proformaNumber);
                  setValue('proforma_number', proformaNumber);
                } else if (latestInvoiceNumber) {
                  setValue(
                    'invoice_number',
                    latestInvoiceNumber?.error
                      ? (latestInvoiceNumber?.latest_invoice_number as string)
                      : invoiceService.generateNextInvoiceNumber(
                          latestInvoiceNumber?.latest_invoice_number as string
                        )
                  );
                }
                setIsResetDialogOpen(false);
              }}
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (areProductsLoading) {
    return <NewInvoiceLoadingSkeleton />;
  }

  return (
    <Card className='card-invoice border-none shadow-none rounded-sm flex flex-col min-h-[90vh]'>
      <CardHeader className='flex border flex-col items-end justify-between bg-muted/50 shrink-0 gap-2'>
        <div className='flex flex-col lg:flex-row items-start w-full justify-between bg-muted/50 shrink-0 gap-3'>
          <div className='grid gap-0.5'>
            <CardTitle className='hidden lg:flex group items-center gap-2 text-lg'>
              {isEditing ? 'Editar Factura' : 'Crear Factura'}
            </CardTitle>
            <CardDescription className='text-base font-semibold'>
              {isEditing
                ? `Editando factura: ${invoice?.invoice_number}`
                : `Fecha: ${new Date(watch('date')).toLocaleDateString()}`}
            </CardDescription>
          </div>
          <div className='flex lg:flex-col gap-4'>
            <div className='flex items-center space-x-2'>
              <Controller
                name='is_proforma'
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id='is_proforma'
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isEditing || isInvoiceModeOnly}
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
                {new Date(watch('updated_at')).toLocaleString('es-HN')}
              </time>
            </>
          ) : (
            <>
              Factura creada:{' '}
              <time dateTime={watch('created_at')} suppressHydrationWarning>
                {new Date(watch('created_at')).toLocaleString('es-HN')}
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
