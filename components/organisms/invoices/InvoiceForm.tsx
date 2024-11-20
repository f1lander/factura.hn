"use client";
import React, { useState, useEffect } from "react";
import { InputMask } from "@react-input/mask";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  useFieldArray,
  Controller,
  useFormContext,
  useWatch,
} from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Trash2 } from "lucide-react";
import {
  Invoice,
  InvoiceItem,
  invoiceService,
} from "@/lib/supabase/services/invoice";
import { numberToWords } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { useCustomersStore } from "@/store/customersStore";
import { useProductsStore } from "@/store/productsStore";
import { useCompanyStore } from "@/store/companyStore";
import { Customer, customerService } from "@/lib/supabase/services/customer";
import { useInvoicesStore } from "@/store/invoicesStore";
import { getStatusBadge } from "@/components/molecules/InvoicesTable";
import { Label } from "@/components/ui/label";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import ProductSelect from "@/components/molecules/invoiceProductInputs/ProductSelect";
import DescriptionInput from "@/components/molecules/invoiceProductInputs/DescriptionInput";
import QuantityInput from "@/components/molecules/invoiceProductInputs/QuantityInput";
import DiscountInput from "@/components/molecules/invoiceProductInputs/DiscountInput";
import UnitCostInput from "@/components/molecules/invoiceProductInputs/UnitCostInput";

interface InvoiceFormProps {
  onSave: (invoice: Invoice) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ onSave }) => {
  const { customers, syncCustomers } = useCustomersStore();
  const { products } = useProductsStore();
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
  } = useFormContext<Invoice>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoice_items",
  });

  const customerId = watch("customer_id");

  useEffect(() => {
    if (allInvoices.at(-1) !== undefined) {
      setLastInvoiceExists(true);
    } else {
      setLastInvoiceExists(false);
    }
  }, [setLastInvoiceExists, allInvoices]);

  const handleAddCustomerFormSubmit = async (data: Partial<Customer>) => {
    try {
      await customerService.createCustomer(data as Customer);
      syncCustomers();
      setIsAddClientDialogOpen(false);
      toast({
        title: "Cliente creado",
        description: "El cliente se ha guardado exitosamente.",
      });
    } catch (err) {
      console.error("Error al guardar el cliente:", err);
      toast({
        title: "Error",
        description:
          "No se pudo guardar el cliente. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  const watchInvoiceItems = useWatch({
    name: "invoice_items",
    control,
  });

  const watchClient = watch("customers");

  const isGenerateInvoiceButtonDisabled =
    invoiceService.generateInvoiceButtonShouldBeDisabled(
      watchInvoiceItems,
      watchClient,
    );

  useEffect(() => {
    const subtotal = watchInvoiceItems.reduce(
      (sum, item) => sum + (item.quantity * item.unit_cost - item.discount),
      0,
    );
    const tax = subtotal * 0.15; // Assuming 15% tax rate
    const total = subtotal + tax;

    setValue("subtotal", subtotal);
    setValue("tax", tax);
    setValue("total", total);
    setValue("numbers_to_letters", numberToWords(total));
  }, [watchInvoiceItems, setValue]);

  /** Logic for setting the last and next invoice number */
  useEffect(() => {
    const lastInvoice = allInvoices.at(-1);
    let nextInvoiceNumber = "";
    if (lastInvoice) {
      setLastInvoiceNumber(lastInvoice.invoice_number);
      nextInvoiceNumber = invoiceService.generateNextInvoiceNumber(
        lastInvoice.invoice_number,
      );
      setValue("invoice_number", nextInvoiceNumber);
    } else if (company && company.range_invoice1) {
      setLastInvoiceNumber(company.range_invoice1);
      setValue("invoice_number", company.range_invoice1);
    }
  }, [company, allInvoices, setValue]);

  /** Logic for setting the customer */
  useEffect(() => {
    if (customerId) {
      const selectedCustomer = customers.find((c) => c.id === customerId);
      if (selectedCustomer) {
        setValue("customers", {
          name: selectedCustomer.name,
          rtn: selectedCustomer.rtn,
          email: selectedCustomer.email,
        });
      }
    }
  }, [customerId, customers, setValue]);

  const onSubmit = (data: Invoice) => {
    const { subtotal, total, tax } = invoiceService.computeInvoiceData(
      data.invoice_items,
    );
    data.subtotal = subtotal;
    data.total = total;
    data.tax = tax;
    if (data.invoice_items.length < 1)
      setError("invoice_items", {
        type: "required",
        message: "At least one invoice",
      });
    onSave(data);
  };

  const renderEditableContent = () => (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <Controller
            name="customer_id"
            control={control}
            rules={{ required: "Debes asociar un cliente a tu factura" }}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <Button
            type="button"
            className="md:w-1/2"
            onClick={() => setIsAddClientDialogOpen(true)}
          >
            Añadir cliente
          </Button>
          {errors.customer_id && (
            <p className="text-red-500 text-sm">{errors.customer_id.message}</p>
          )}
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                onChange={(date) => field.onChange(date?.toISOString())}
              />
            )}
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <Label className="whitespace-nowrap">Última factura</Label>
                <Input value={lastInvoiceNumber} disabled />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                <Label className="whitespace-nowrap">Nueva factura</Label>
                <InputMask
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  mask="___-___-__-________"
                  replacement={{ _: /\d/ }}
                  {...register("invoice_number", {
                    required: "Este campo es requerido",
                    validate: (value) => {
                      const previousInvoiceNumber = lastInvoiceNumber as string;
                      const nextInvoiceNumber = value;
                      const lastInvoiceRange = company!.range_invoice2!;
                      return invoiceService.validateNextInvoiceNumber(
                        previousInvoiceNumber,
                        nextInvoiceNumber,
                        lastInvoiceRange,
                        lastInvoiceExists,
                      );
                    },
                  })}
                  placeholder="000-000-00-00000000"
                />
                {errors.invoice_number && (
                  <p className="text-red-500 text-sm">
                    {errors.invoice_number.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <Button
          className="w-full"
          type="button"
          onClick={() => {
            append({
              id: "",
              invoice_id: "",
              product_id: "",
              description: "",
              quantity: 1,
              unit_cost: 0,
              discount: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            console.log(watchInvoiceItems);
          }}
        >
          Agregar Producto o Servicio
        </Button>
        <div className="grid gap-4">
          <div className="hidden sm:block">
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
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="sm:hidden">
            {fields.map((item, index) => (
              <div key={item.id} className="mb-4 p-4 border rounded">
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
                <div className="mt-2">
                  {`Total: Lps. ${calculateItemTotal(index, watchInvoiceItems)}`}
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => remove(index)}
                  className="mt-2"
                >
                  Quitar
                </Button>
              </div>
            ))}
          </div>
        </div>
        <Button
          type="submit"
          className="mt-4"
          disabled={isGenerateInvoiceButtonDisabled}
        >
          Generar Factura
        </Button>
      </form>
      <Dialog
        open={isAddClientDialogOpen}
        onOpenChange={setIsAddClientDialogOpen}
      >
        <DialogTrigger asChild></DialogTrigger>
        <DialogContent className="w-[90%]" id="contenido del dialogo papa">
          <div className="transition-all duration-300 ease-in-out">
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

  return (
    <Card className="card-invoice overflow-hidden border-none shadow-none rounded-sm h-scren">
      <CardHeader className="flex flex-row items-start justify-between bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            Crear Factura
          </CardTitle>
          <CardDescription>
            Fecha:{new Date().toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        {renderEditableContent()}
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Factura creada:{" "}
          <time dateTime={watch("created_at")} suppressHydrationWarning>
            {new Date(watch("created_at")).toLocaleString()}
          </time>
        </div>
        <div>
          <Badge variant={watch("is_proforma") ? "outline" : "secondary"}>
            {watch("is_proforma") ? "Proforma" : "Factura"}
          </Badge>
          <Badge variant={watch("is_proforma") ? "outline" : "secondary"}>
            {getStatusBadge(watch("status"))}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
};

const calculateItemTotal = (index: number, items: InvoiceItem[]) => {
  const item = items[index];
  /** There's a point where the item is undefined, so don't delete this line*/
  if (!item) return 0;
  return (item.quantity * item.unit_cost - item.discount).toFixed(2);
};

export default InvoiceForm;
