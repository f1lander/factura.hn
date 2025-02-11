'use client';

import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { DataGrid } from '@/components/molecules/DataGrid';
import { SearchBoxComponent } from '@/components/SearchBoxComponent';
import {
  Product,
  ProductOrder,
  productService,
  ProductToOrder,
} from '@/lib/supabase/services/product';
import { useQuery } from '@tanstack/react-query';
import { Popover } from '@/components/ui/popover';
import { Dialog, DialogClose } from '@radix-ui/react-dialog';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFieldArray, useForm, useFormState } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const RegisterProductOrderSchema = yup.object().shape({
  type: yup.string().oneOf(['ADD', 'DELETE']).required(),
  update_products: yup.array<ProductToOrder>().required(),
  reason_description: yup.string().required(),
});

const RegisterProductPage: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    watch,
    formState: { errors },
    control,
    register,
    setValue,
    handleSubmit,
    reset,
    setError,
    setFocus,
  } = useForm<ProductOrder>({
    defaultValues: {
      type: 'ADD',
      update_products: [],
      reason_description: '',
    },
    resolver: yupResolver(RegisterProductOrderSchema),
  });

  const { fields: rowData, remove } = useFieldArray({
    control,
    name: 'update_products',
    rules: {
      required: 'Debe seleccionar al menos un producto',
    },
  });

  const {
    data: products,
    isLoading: areProductsLoading,
    refetch,
  } = useQuery(['products'], () => productService.getProductsByCompany(), {
    staleTime: 300000,
    cacheTime: 600000,
    refetchOnWindowFocus: true,
  });

  const values = watch();

  const filteredProducts =
    products?.filter(
      (product) =>
        product.sku
          .toLocaleLowerCase()
          .includes(searchText.toLocaleLowerCase()) ||
        product.description
          .toLocaleLowerCase()
          .includes(searchText.toLocaleLowerCase())
    ) || [];

  const handleAddProductToOrder = (product: Product) => {
    if (!rowData.find((row) => row.product_id === product.id)) {
      setValue('update_products', [
        ...rowData,
        { product_id: product.id, product, quantity_delta: 0 },
      ]);
      // setRowData([...rowData, { product_id: product.id, product, quantity_delta: 0 }]);
      // append({ product_id: product.id, product, quantity_delta: 0 });
    }
    setSearchText('');
  };

  const handleCreateProductRegisterOrder = async (rows: ProductToOrder[]) => {
    const order: ProductOrder = {
      ...values,
      update_products: rows.map((row) => ({
        product_id: row.product_id,
        quantity_delta: row.quantity_delta,
      })),
    };

    return handleSubmit(
      async (values) => {
        const response = await productService.generateProductRegisterOrder(
          order
        );

        if (response) {
          await productService.updateInventory(response!.id as string);

          reset();
          refetch();
        }
      },
      (error) => {
        if (error.reason_description) {
          setError('reason_description', {
            type: 'manual',
            message: 'Razón de la operación es requerida',
          });

          setFocus('reason_description');
        }

        throw error;
      }
    )();
  };

  const handleDropProductsFromOrder = async (productIds: string[]) => {
    const rowIndexes = productIds.map((productId) =>
      rowData.findIndex((row) => row.product_id === productId)
    );
    remove(rowIndexes);
  };

  return (
    <div className='flex min-h-screen w-full flex-col bg-background'>
      <div className='container mx-auto p-4 sm:p-6 lg:p-8'>
        <main className='flex flex-col lg:flex-row gap-6'>
          {/* Products Search Panel */}
          <div className='w-full lg:w-1/3 xl:w-1/4 top-4'>
            <Card className='shadow-md'>
              <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl'>Productos</CardTitle>
                <CardDescription>
                  Buscar y agregar productos al pedido
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <SearchBoxComponent
                  className='w-full'
                  searchText={searchText}
                  onFilterTextBoxChanged={(event) =>
                    setSearchText(event.target.value)
                  }
                />
                <ScrollArea className='h-[calc(100vh-20rem)]'>
                  {areProductsLoading ? (
                    <div className='flex items-center justify-center p-4'>
                      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                    </div>
                  ) : (
                    <div className='space-y-2 pr-4 md:block'>
                      <div id='product-list' className='hidden md:block'>
                        {filteredProducts.map((product) => (
                          <Card
                            key={product.id}
                            className='transition-all hover:bg-accent hover:shadow-lg cursor-pointer'
                            onClick={() => handleAddProductToOrder(product)}
                          >
                            <CardContent className='p-3'>
                              <div className='flex flex-col sm:flex-row justify-between gap-2'>
                                <div className='font-medium truncate'>
                                  {product.sku}
                                </div>
                                <Badge variant='secondary' className='shrink-0'>
                                  Stock: {product.quantity_in_stock}
                                </Badge>
                              </div>
                              <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                                {product.description}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className='space-y-2 pr-4'>
                    {filteredProducts.map((product) => (
                      <Card
                        key={product.id}
                        className='transition-all hover:bg-accent hover:shadow-lg cursor-pointer'
                        onClick={() => handleAddProductToOrder(product)}
                      >
                        <CardContent className='p-3'>
                          <div className='flex flex-col sm:flex-row justify-between gap-2'>
                            <div className='font-medium truncate'>
                              {product.sku}
                            </div>
                            <Badge variant='secondary' className='shrink-0'>
                              Stock: {product.quantity_in_stock}
                            </Badge>
                          </div>
                          <p className='text-sm text-muted-foreground mt-1 line-clamp-2'>
                            {product.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Order Grid Panel */}
          <div className='w-full lg:w-2/3 xl:w-3/4'>
            <Card className='shadow-md'>
              <CardHeader>
                <CardTitle className='text-2xl'>
                  Registro de Productos
                </CardTitle>
                <CardDescription>
                  Actualiza el inventario de tus productos
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center gap-4 p-4 rounded-lg bg-muted/50'>
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
                    <Label className='min-w-20'>Operación:</Label>
                    <div className='flex gap-2'>
                      <Button
                        variant={values.type === 'ADD' ? 'default' : 'outline'}
                        onClick={() => setValue('type', 'ADD')}
                        className='w-full sm:w-24'
                      >
                        Agregar
                      </Button>
                      <Button
                        variant={
                          values.type === 'DELETE' ? 'destructive' : 'outline'
                        }
                        onClick={() => setValue('type', 'DELETE')}
                        className='w-full sm:w-24'
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                  <div className='flex-1'>
                    <Input
                      {...register('reason_description')}
                      placeholder='Razón de la operación'
                      className={cn(
                        'w-full',
                        errors.reason_description && 'border-destructive'
                      )}
                    />
                    {errors.reason_description && (
                      <p className='text-sm text-destructive mt-1'>
                        Razón de la operación es requerida
                      </p>
                    )}
                  </div>
                </div>

                <div className='rounded-lg border bg-card'>
                  <DataGrid
                    title='Registro de Productos'
                    description='Actualiza el inventario de tus productos'
                    data={rowData}
                    idField='product_id'
                    columnDefs={[
                      {
                        headerName: 'SKU',
                        field: 'product.sku',
                        checkboxSelection: true,
                        headerCheckboxSelection: true,
                        editable: false,
                      },
                      {
                        headerName: 'Descripción',
                        field: 'product.description',
                        editable: false,
                      },
                      {
                        headerName: 'Cantidad Existente',
                        field: 'product.quantity_in_stock',
                        editable: false,
                      },
                      {
                        headerName: `Cantidad a ${
                          values.type === 'ADD' ? 'Agregar' : 'Eliminar'
                        }`,
                        field: 'quantity_delta',
                        editable: true,
                        type: 'numericColumn',
                      },
                    ]}
                    handleOnUpdateRows={handleCreateProductRegisterOrder}
                    onSelectionChange={setSelectedProducts}
                    onDelete={() => setIsDeleteDialogOpen(true)}
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>No Actualizar Productos</DialogTitle>
                        <DialogClose />
                      </DialogHeader>
                      <DialogDescription>
                        ¿Estás seguro que no quiere actualizar los siguientes
                        productos?
                        {selectedProducts.length > 0 && (
                          <ul>
                            {selectedProducts.map((productId) => {
                              const product = products?.find(
                                (p) => p.id === productId
                              );
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
                            handleDropProductsFromOrder(selectedProducts);
                            setIsDeleteDialogOpen(false);
                          }}
                        >
                          Eliminar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RegisterProductPage;
