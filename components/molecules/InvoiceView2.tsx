import React, { useState, useEffect } from "react";
import {
  useForm,
  useFieldArray,
  Controller,
  Control,
  UseFormSetValue,
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
import { Invoice, InvoiceItem, invoiceService } from "@/lib/supabase/services/invoice";
import { Customer, customerService } from "@/lib/supabase/services/customer";
import { Product, productService } from "@/lib/supabase/services/product";
import { Company, companyService } from "@/lib/supabase/services/company";
import { numberToWords } from "@/lib/utils";
import { getStatusBadge } from "./InvoicesTable";

interface InvoiceViewProps {
  invoice?: Invoice;
  isEditable: boolean;
  onSave: (invoice: Invoice) => void;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({
  invoice,
  isEditable,
  onSave,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue } = useForm<Invoice>({
    defaultValues: invoice || {
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
      status: 'pending'
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "invoice_items",
  });

  const watchInvoiceItems = watch("invoice_items");

  useEffect(() => {
    const fetchData = async () => {
      const fetchedCompany = await companyService.getCompany();
      if (fetchedCompany) {
        setCompany(fetchedCompany);
        setValue("company_id", fetchedCompany.id);

        const fetchedCustomers = await customerService.getCustomersByCompany(
          fetchedCompany.id
        );
        const fetchedProducts = await productService.getProductsByCompany(
          fetchedCompany.id
        );
        setCustomers(fetchedCustomers);
        setProducts(fetchedProducts);

        // Fetch the last invoice number
        const lastInvoice = await invoiceService.getLastInvoice(fetchedCompany.id);
        if (lastInvoice) {
          setLastInvoiceNumber(lastInvoice);
        } else {
          // If no last invoice, use the range_invoice1 from company
          setLastInvoiceNumber(fetchedCompany.range_invoice1);
        }
      }
    };

    fetchData();
  }, [setValue]);

  useEffect(() => {
    if (lastInvoiceNumber && !invoice) {
      const nextInvoiceNumber = generateNextInvoiceNumber(lastInvoiceNumber);
      setValue("invoice_number", nextInvoiceNumber);
    }
  }, [lastInvoiceNumber, invoice, setValue]);

  useEffect(() => {
    const subtotal = watchInvoiceItems.reduce(
      (sum, item) => sum + (item.quantity * item.unit_cost - item.discount),
      0
    );
    const tax = subtotal * 0.15; // Assuming 15% tax rate
    const total = subtotal + tax;

    setValue("subtotal", subtotal);
    setValue("tax", tax);
    setValue("total", total);
    setValue("numbers_to_letters", numberToWords(total));
  }, [watchInvoiceItems, setValue]);

  useEffect(() => {
    const customerId = watch("customer_id");
    if (customerId) {
      const selectedCustomer = customers.find(c => c.id === customerId);
      if (selectedCustomer) {
        setValue("customers", {
          name: selectedCustomer.name,
          rtn: selectedCustomer.rtn,
          email: selectedCustomer.email
        });
      }
    }
  }, [watch("customer_id"), customers, setValue]);

  const generateNextInvoiceNumber = (lastNumber: string) => {
    const parts = lastNumber.split('-');
    const lastPart = parts[parts.length - 1];
    const nextNumber = (parseInt(lastPart, 10) + 1).toString().padStart(8, '0');
    parts[parts.length - 1] = nextNumber;
    return parts.join('-');
  };

  const onSubmit = (data: Invoice) => {
    onSave(data);
  };

  const renderEditableContent = () => (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4">
        <Controller
          name="customer_id"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select a customer" />
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
        <Controller
          name="date"
          control={control}
          render={({ field }) => (
            <DatePicker
              onChange={(date) => field.onChange(date?.toISOString())}
            />
          )}
        />
        <Controller
          name="invoice_number"
          control={control}
          render={({ field }) => (
            <Input {...field} placeholder="Número de Factura" disabled />
          )}
        />
      </div>
      <Separator className="my-4" />
      <div className="grid gap-4">
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((item, index) => (
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
                    ${calculateItemTotal(index, watchInvoiceItems)}
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
                Total: ${calculateItemTotal(index, watchInvoiceItems)}
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
                className="mt-2"
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          onClick={() =>
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
            })
          }
        >
          Agregar Producto o Servicio
        </Button>
      </div>
      <Button type="submit" className="mt-4" disabled={!customers}>
        Generar Factura
      </Button>
    </form>
  );

  const renderReadOnlyContent = () => (
    <>
      <div className="grid gap-3">
        <div className="font-semibold">Informacion del Cliente</div>
        <dl className="grid gap-1">
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">Cliente:</dt>
            <dd>{watch("customers.name")}</dd>
          </div>
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">RTN:</dt>
            <dd>{watch("customers.rtn")}</dd>
          </div>
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">Correo:</dt>
            <dd>{watch("customers.email")}</dd>
          </div>
        </dl>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-3">
        <div className="font-semibold">Detalles de la factura</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Descuento</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {watch("invoice_items").map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
                <TableCell className="text-right">
                  ${item.unit_cost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${item.discount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  ${(item.quantity * item.unit_cost - item.discount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-4">
        <div className="grid gap-3">
          <div className="font-semibold">Resumen de la Factura</div>
          <dl className="grid gap-1">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Subtotal:</dt>
              <dd>${watch("subtotal").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Exonerado:</dt>
              <dd>${watch("tax_exonerado").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Exento:</dt>
              <dd>${watch("tax_exento").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Gravado 15%:</dt>
              <dd>${watch("tax_gravado_15").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Gravado 18%:</dt>
              <dd>${watch("tax_gravado_18").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">ISV 15%:</dt>
              <dd>${watch("tax").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">ISV 18%:</dt>
              <dd>${watch("tax_18").toFixed(2)}</dd>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <dt>Total:</dt>
              <dd>${watch("total").toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>
      <Separator className="my-4" />
      <div>
        <div className="font-semibold">Notas</div>
        <p className="mt-2 text-muted-foreground">
          {watch("numbers_to_letters")}
        </p>
      </div>
    </>
  );

  return (
    <Card className="card-invoice overflow-hidden border-none shadow-none rounded-sm">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            {isEditable ? "Crear Factura" : `Número de Factura ${watch("invoice_number")}`}
          </CardTitle>
          <CardDescription>
            Fecha: {new Date(watch("date")).toLocaleDateString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        {isEditable ? renderEditableContent() : renderReadOnlyContent()}
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Factura creada:{" "}
          <time dateTime={watch("created_at")}>
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
          <SelectValue placeholder="Select a product" />
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
      <Input {...field} placeholder="Description" className="mt-2" />
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
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder="Quantity"
        className="mt-2"
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
        type="number"
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder="Unit Cost"
        className="mt-2"
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
        type="number"
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder="Discount"
        className="mt-2"
      />
    )}
  />
);

const calculateItemTotal = (index: number, items: InvoiceItem[]) => {
  const item = items[index];
  return (item.quantity * item.unit_cost - item.discount).toFixed(2);
};

export default InvoiceView;
