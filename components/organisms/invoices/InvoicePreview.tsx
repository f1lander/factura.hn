"use client";
import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Invoice } from "@/lib/supabase/services/invoice";
import { getStatusBadge } from "@/components/molecules/InvoicesTable";

const InvoicePreview: React.FC = () => {
  const { watch, control } = useFormContext<Invoice>();
  const values = useWatch({ control });

  const renderReadOnlyContent = () => (
    <>
      <div className="grid gap-3">
        <div className="font-semibold">Informacion del Cliente</div>
        <dl className="grid gap-1">
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">Cliente:</dt>
            <dd>{values.customers?.name}</dd>
          </div>
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">RTN:</dt>
            <dd>{values.customers?.rtn}</dd>
          </div>
          <div className="flex items-center gap-4">
            <dt className="text-muted-foreground">Correo:</dt>
            <dd>{values.customers?.email}</dd>
          </div>
        </dl>
      </div>
      <Separator className="my-4" />
      <div className="grid gap-3">
        <div className="font-semibold">Detalles de la factura</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
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
                  {`Lps. ${item.unit_cost.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-right">
                  {`Lps. ${item.discount.toFixed(2)}`}
                </TableCell>
                <TableCell className="text-right">
                  {`Lps. ${(item.quantity * item.unit_cost - item.discount).toFixed(2)}`}
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
              <dd>{`Lps. ${watch("subtotal").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Exonerado:</dt>
              <dd>{`Lps. ${watch("tax_exonerado").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Exento:</dt>
              <dd>{`Lps. ${watch("tax_exento").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Gravado 15%:</dt>
              <dd>{`Lps. ${watch("tax_gravado_15").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Gravado 18%:</dt>
              <dd>{`Lps. ${watch("tax_gravado_18").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">ISV 15%:</dt>
              <dd>{`Lps. ${watch("tax").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">ISV 18%:</dt>
              <dd>{`Lps. ${watch("tax_18").toFixed(2)}`}</dd>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <dt>Total:</dt>
              <dd>{`Lps. ${watch("total").toFixed(2)}`}</dd>
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
      <CardHeader className="flex flex-row items-start justify-between bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            Número de factura {watch("invoice_number")}
          </CardTitle>
          <CardDescription>
            Fecha: {new Date().toLocaleString()}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        {renderReadOnlyContent()}
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

export default InvoicePreview;
