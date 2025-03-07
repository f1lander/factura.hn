'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpenCheck, Package } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Product, productService } from '@/lib/supabase/services/product';
import GenericEmptyState from '@/components/molecules/GenericEmptyState';
import { ProductForm } from '@/components/molecules/ProductForm';
import { Dialog } from '@radix-ui/react-dialog';
import { DataGrid } from '@/components/molecules/DataGrid';
import useUploadXls from '@/hooks/useUploadXls';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productColumns } from '@/utils/tableColumns';
import { useRouter } from 'next/navigation';
import { ProductImportStepper } from '@/components/organisms/products/ProductImportStepper';

interface ProductKeyMappings {
  sku: string;
  description: string;
  unit_cost: string;
  is_service: string;
  quantity_in_stock: string;
}

export default function ProductsPage() {
  const { push } = useRouter();
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    handleXlsFileUpload,
    fileName,
    sheetNames,
    sheets,
    setAreProductsLoading,
    setXlsFile,
    getCurrentSheeData,
    getCurrentSheetFieldNames,
    setCurrentSheet,
    currentSheet,
  } = useUploadXls();

  const queryClient = useQueryClient();
  const { data: products, isLoading: areProductsFromDBLoading } = useQuery(
    ['products'],
    () => productService.getProductsByCompany(),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    }
  );
  const triggerFileInput = () => {
    if (excelFileInputRef.current) {
      excelFileInputRef.current.click();
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleXlsFileUpload(event);
  };

  const handleImportComplete = async (mappedData: any[]) => {
    const { success, message } = await productService.createMultipleProducts(
      mappedData
    );

    if (!success) {
      toast({
        title: 'No se pudieron subir los productos',
        description: message,
      });
    } else {
      toast({
        title: 'Carga de productos exitosa',
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }

    setAreProductsLoading(false);
    setIsImporting(false);
    setXlsFile(null);
  };

  const loadProducts = useCallback(
    async (page: number, size: number) => {
      try {
        const response = await productService.getProductsPaginated(page, size);
        setTotalProducts(response.total);
      } catch (err) {
        console.error('Error loading products:', err);
        toast({
          title: 'Error',
          description:
            'No se pudieron cargar los productos. Por favor, intente de nuevo.',
          variant: 'destructive',
        });
      }
    },
    [setTotalProducts, toast]
  );

  const handleCreateProduct = () => {
    setSelectedProduct(undefined);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id, data);
      } else {
        await productService.createProduct(data);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsFormVisible(false);
      toast({
        title: selectedProduct ? 'Producto Actualizado' : 'Producto Creado',
        description: 'El producto se ha guardado exitosamente.',
      });
    } catch (err) {
      console.error('Error al guardar el producto:', err);
      toast({
        title: 'Error',
        description:
          'No se pudo guardar el producto. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    loadProducts(currentPage, pageSize);
  }, [currentPage, pageSize, loadProducts]);

  const handlePageChange = (params: any) => {
    setCurrentPage(params.page);
    setPageSize(params.pageSize);
  };

  if (areProductsFromDBLoading) {
    return (
      <div className='p-10 text-center'>
        <h1>Cargando productos...</h1>
      </div>
    );
  }

  const handleOnUpdateRows = async (rows: Product[]) => {
    const { success } = await productService.updateMultipleProducts(rows);
    if (!success)
      toast({
        title: 'Actualización de productos fallido',
        description: 'Revisa si algún dato que ingresaste fue inválido',
      });
    toast({
      title: 'Actualización de productos exitosa',
      description: 'Tus productos se han actualizado en la base de datos',
    });
  };

  if (isImporting) {
    return (
      <ProductImportStepper
        onCancel={() => {
          setIsImporting(false);
          setXlsFile(null);
        }}
        onComplete={handleImportComplete}
        xlsFile={getCurrentSheeData()}
        fileName={fileName}
        tableFieldnames={getCurrentSheetFieldNames()}
        sheetNames={sheetNames}
        handleXlsFileUpload={handleFileUpload}
        setCurrentSheet={setCurrentSheet}
        currentSheet={currentSheet}
        sheets={sheets}
      />
    );
  }

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col sm:gap-4 p-12'>
        <main className='flex flex-col-reverse xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
          <div
            className={`w-full ${
              isFormVisible ? 'xl:w-1/2' : 'xl:w-full'
            } transition-all duration-300 ease-in-out`}
          >
            <Button
              onClick={() => push('/home/products-v2/register-order')}
              variant='outline'
              className='border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center'
            >
              <BookOpenCheck className='h-4 w-4 mr-2' />
              Actualizar inventario
            </Button>
            {/* in case there are elements from a spreadsheet, take the columns and data, and display
            the table. */}
            {products!.length === 0 ? (
              <GenericEmptyState
                icon={Package}
                title='No tienes productos aún'
                description='Agrega tus productos o servicios para incluirlos en tus facturas'
                buttonText='Agregar Producto'
                onAction={handleCreateProduct}
                onAddExcelSpreadSheet={() => setIsImporting(true)}
              />
            ) : (
              <DataGrid
                title='Productos y Servicios'
                description='Gestiona tus productos y servicios aquí'
                data={products!}
                columnDefs={productColumns}
                onSelectionChange={setSelectedProducts}
                onCreateNew={handleCreateProduct}
                onDelete={() => setIsDeleteDialogOpen(true)}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onAddExcelSpreadSheet={() => setIsImporting(true)}
                handleOnUpdateRows={handleOnUpdateRows}
              />
            )}
          </div>
          {isFormVisible && (
            <div className='w-full xl:w-1/2 transition-all duration-300 ease-in-out'>
              <ProductForm
                product={selectedProduct}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setIsFormVisible(false);
                  setSelectedProduct(undefined);
                }}
              />
            </div>
          )}
        </main>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar productos</DialogTitle>
            <DialogClose />
          </DialogHeader>
          <DialogDescription>
            ¿Estás seguro que deseas eliminar los productos seleccionados?
            {selectedProducts.length > 0 && (
              <ul>
                {selectedProducts.map((productId) => {
                  const product = products?.find((p) => p.id === productId);
                  return (
                    <li key={productId}>
                      {product?.sku} - {product?.description}
                    </li>
                  );
                })}
              </ul>
            )}
          </DialogDescription>
          <DialogFooter>
            <Button
              variant='destructive'
              onClick={async () => {
                const { success, message } =
                  await productService.deleteMultipleProducts(selectedProducts);
                if (!success) {
                  toast({
                    title: 'Error al eliminar productos',
                    description: message,
                    variant: 'destructive',
                  });
                  return;
                }
                toast({
                  title: 'Productos eliminados',
                  description: message,
                });
                queryClient.invalidateQueries({ queryKey: ['products'] });
                setIsDeleteDialogOpen(false);
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
