'use client';

import { Button } from '@/components/ui/button';
import { PlusCircleIcon } from 'lucide-react';
import { toast } from '../ui/use-toast';
import { useCompanyStore } from '@/store/companyStore';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/lib/supabase/services/product';

export default function CreateInvoiceButton() {
  const { data: productsCount = 0, isLoading: areProductsFromDBLoading } =
    useQuery(
      ['products-count'],
      () => productService.getActiveProductsCount(),
      {
        staleTime: 300000,
        cacheTime: 600000,
        refetchOnWindowFocus: true,
      }
    );

  const { company } = useCompanyStore();
  const ensureProductsExistenceAndCreateInvoice = () => {
    if (
      company?.range_invoice1 === null ||
      company?.range_invoice2 === null ||
      company?.cai === null
    ) {
      return toast({
        variant: 'destructive',
        title: 'Necesitamos datos de compañía',
        description:
          'Antes de crear facturas, necesitamos estos datos: rango de factura de inicio, rango de factura de fin y CAI. Ve a la pestaña de configuración y asegúrate de agregarlos',
      });
    }
    if (productsCount < 1) {
      return toast({
        variant: 'destructive',
        title: '¡Aún no tenemos productos!',
        description:
          'Antes de poder crear facturas, debes crear al menos un producto. Ve a la pestaña de productos y agrega uno.',
      });
    }
    window.location.href = '/home/invoices/create-invoice';
  };
  return (
    <Button
      className='bg-[#00A1D4] text-white text-lg font-semibold flex gap-4 p-8'
      onClick={ensureProductsExistenceAndCreateInvoice}
    >
      <PlusCircleIcon />
      Crear factura
    </Button>
  );
}
