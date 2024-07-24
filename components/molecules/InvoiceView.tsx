import React from "react";
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

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Copy, MoreVertical, Printer } from "lucide-react";
import { Invoice, InvoiceItem } from "@/lib/supabase/services/invoice";
import { Customer } from "@/lib/supabase/services/customer";

interface InvoiceViewProps {
  invoice: Invoice;
}

const InvoiceView: React.FC<InvoiceViewProps> = ({ invoice }) => {
  if (!invoice) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            Factura {invoice.invoice_number}
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copiar número de factura</span>
            </Button>
          </CardTitle>
          <CardDescription>
            Fecha: {new Date(invoice.date).toLocaleDateString()}
          </CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Printer className="h-3.5 w-3.5" />
            <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
              Imprimir Factura
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Más opciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Enviar por correo</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Anular factura</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Información del Cliente</div>
          <dl className="grid gap-1">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Cliente:</dt>
              <dd>{invoice.customers.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">RTN:</dt>
              <dd>{invoice.customers.rtn}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Email:</dt>
              <dd>{invoice.customers.email}</dd>
            </div>
          </dl>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="font-semibold">Detalles de la Factura</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Precio Unitario</TableHead>
                <TableHead className="text-right">Descuento</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.invoice_items.map((item) => (
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
                    $
                    {(item.quantity * item.unit_cost - item.discount).toFixed(
                      2
                    )}
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
                <dd>${invoice.subtotal.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Exonerado:</dt>
                <dd>${invoice.tax_exonerado.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Exento:</dt>
                <dd>${invoice.tax_exento.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Gravado 15%:</dt>
                <dd>${invoice.tax_gravado_15.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Gravado 18%:</dt>
                <dd>${invoice.tax_gravado_18.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">ISV 15%:</dt>
                <dd>${invoice.tax.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">ISV 18%:</dt>
                <dd>${invoice.tax_18.toFixed(2)}</dd>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <dt>Total:</dt>
                <dd>${invoice.total.toFixed(2)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <Separator className="my-4" />
        <div>
          <div className="font-semibold">Notas</div>
          <p className="mt-2 text-muted-foreground">
            {invoice.numbers_to_letters}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Creada:{" "}
          <time dateTime={invoice.created_at.toString()}>
            {new Date(invoice.created_at).toLocaleString()}
          </time>
        </div>
        <Badge variant={invoice.is_proforma ? "outline" : "secondary"}>
          {invoice.is_proforma ? "Proforma" : "Factura"}
        </Badge>
      </CardFooter>
    </Card>
  );
};

export default InvoiceView;
