'use client';
import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Invoice } from '@/lib/supabase/services/invoice';
import { getStatusBadge } from '@/components/molecules/InvoicesTable';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useCompanyStore } from '@/store/companyStore';
import supabase from '@/lib/supabase/client';
import { getSignedLogoUrl } from '@/lib/utils';

const InvoicePreview: React.FC = () => {
  const { company } = useCompanyStore();
  const { watch, control } = useFormContext<Invoice>();
  const values = useWatch({ control });
  const [expandedRows, setExpandedRows] = useState<any>({});
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  useEffect(() => {
    if (company?.logo_url) {
      getSignedLogoUrl(company?.logo_url).then((base64image) => {
        setCompanyLogo(base64image);
      });
    }
  }, [company]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev: any) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const renderReadOnlyContent = () => (
    <>
      <div className='grid gap-3'>
        <div className='font-semibold'>Informacion del Cliente</div>
        <dl className='grid gap-1'>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>Cliente:</dt>
            <dd>{values.customers?.name}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>RTN:</dt>
            <dd>{values.customers?.rtn}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>Correo:</dt>
            <dd>{values.customers?.email}</dd>
          </div>
          <div className='flex items-center gap-4'>
            <dt className='text-muted-foreground'>Metodo de Pago:</dt>
            <dd>{values.payment_method?.name || 'No especificado'}</dd>
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
              {watch('invoice_items').map((item, index) => (
                <TableRow key={item.id || index}>
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
          {watch('invoice_items').map((item, index) => (
            <div key={item.id || index} className='bg-white'>
              {/* Main Row Content */}
              <div
                className='p-4 cursor-pointer hover:bg-gray-50'
                onClick={() => toggleRow(item.id)}
              >
                {/* Description */}
                <div className='text-sm text-gray-600'>{item.description}</div>
                {/* Quantity x Price and Total */}
                <div className='flex justify-between items-center mb-2'>
                  <div className='text-sm'>
                    {item.quantity} x{' '}
                    {`Lps. ${item.unit_cost.toLocaleString('en')}`}
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium'>
                      {`Lps. ${(
                        item.quantity * item.unit_cost -
                        item.discount
                      ).toLocaleString('en')}`}
                    </span>
                    {expandedRows[item.id] ? (
                      <ChevronUp className='w-5 h-5 text-gray-400' />
                    ) : (
                      <ChevronDown className='w-5 h-5 text-gray-400' />
                    )}
                  </div>
                </div>
                {/* Expanded Details */}
                {expandedRows[item.id] && (
                  <div className='mt-3 pt-3 border-t border-gray-200 text-sm'>
                    <div className='grid grid-cols-2 gap-2'>
                      <div>
                        <span className='text-gray-500'>ID:</span>
                        <span className='ml-2'>{item.id}</span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Descuento:</span>
                        <span className='ml-2'>{`Lps. ${item.discount.toLocaleString(
                          'en'
                        )}`}</span>
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

  return (
    <Card className='card-invoice overflow-hidden border-none shadow-none rounded-sm w-full'>
      <CardHeader className='flex flex-row items-start justify-between bg-muted/50'>
        <div className='flex flex-row items-stretch justify-between w-full'>
          <div className='flex-1 grid gap-0.5'>
            <CardTitle className='group flex items-center gap-2 text-lg'>
              {!watch('is_proforma')
                ? `Número de factura ${watch('invoice_number')}`
                : `Número de proforma ${watch('proforma_number')}`}
            </CardTitle>
            <CardDescription>
              Fecha: {new Date(watch('date')).toLocaleString()}
            </CardDescription>
          </div>
          {companyLogo !== null && (
            <div className='relative h-[100px] aspect-video z-0'>
              <Image
                src={companyLogo}
                alt='company-logo'
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className='p-6 text-sm'>
        {renderReadOnlyContent()}
      </CardContent>
      <CardFooter className='flex flex-row items-center justify-between border-t bg-muted/50 px-6 py-3 shrink-0'>
        <div className='text-xs text-muted-foreground'>
          Factura creada:{' '}
          <time dateTime={watch('created_at')} suppressHydrationWarning>
            {new Date(watch('created_at')).toLocaleString()}
          </time>
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

export default InvoicePreview;
