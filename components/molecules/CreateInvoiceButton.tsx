'use client';

import { Button } from '@/components/ui/button';
import { LoaderIcon, PlusCircleIcon } from 'lucide-react';
import { toast } from '../ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { productService } from '@/lib/supabase/services/product';
import { useRouter } from 'next/navigation';

export default function CreateInvoiceButton() {
  const router = useRouter();
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

  const ensureProductsExistenceAndCreateInvoice = () => {
    if (productsCount < 1) {
      return toast({
        variant: 'destructive',
        title: '¡Aún no tenemos productos!',
        description:
          'Antes de poder crear facturas, debes crear al menos un producto. Ve a la pestaña de productos y agrega uno.',
      });
    }

    router.push('/home/invoices/create-invoice');
  };
  return (
    <Button
      className='bg-[#00A1D4] text-white text-lg font-semibold flex gap-4 p-8'
      onClick={ensureProductsExistenceAndCreateInvoice}
      disabled={areProductsFromDBLoading}
    >
      <PlusCircleIcon />
      Crear factura
      {areProductsFromDBLoading && (
        <LoaderIcon className='h-4 w-4 animate-spin' />
      )}
    </Button>
  );
}
