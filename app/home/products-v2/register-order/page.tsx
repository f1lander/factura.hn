'use client';

import React, { useState } from 'react';
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
import { Dialog, DialogClose } from '@radix-ui/react-dialog';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
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
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { companyService } from '@/lib/supabase/services/company';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon, MinusIcon, SaveIcon, UndoIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RegisterProductOrderSchema = yup.object().shape({
  type: yup.string().oneOf(['ADD', 'DELETE']).required(),
  update_products: yup
    .array()
    .of(
      yup
        .object<ProductToOrder>()
        .shape({
          product_id: yup.string().required(),
          quantity_delta: yup
            .number()
            .test(
              'quantity-validation',
              'Invalid quantity',
              function (value, context) {
                // Access the root form values to get the type
                const type = this.parent.type || context.from?.[1]?.value?.type;
                const product = context.parent.product;

                if (!value || value <= 0) {
                  return this.createError({
                    message: 'La cantidad debe ser mayor que cero',
                  });
                }

                const quantity_in_stock = product?.quantity_in_stock || 0;

                if (type === 'DELETE') {
                  return (
                    value <= quantity_in_stock ||
                    this.createError({
                      message: 'La cantidad no puede ser mayor al stock',
                    })
                  );
                }

                return true;
              }
            )
            .required('Cantidad es requerida'),
        })
        .required()
    )
    .required(),
  reason_description: yup
    .string()
    .required('Razón de la operación es requerida'),
});

const RegisterProductPage: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const methods = useForm<ProductOrder>({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    resolver: yupResolver(RegisterProductOrderSchema),
    defaultValues: {
      type: 'ADD',
      update_products: [],
      reason_description: '',
    },
  });

  const {
    watch,
    formState: { errors },
    control,
    register,
    setValue,
    handleSubmit,
    reset,
  } = methods;

  const {
    fields: rowData,
    remove,
    update,
  } = useFieldArray({
    control,
    name: 'update_products',
    rules: {
      required: 'Debe seleccionar al menos un producto',
    },
  });

  const { token, userId } = useSupabaseAuth();

  const { data: companyId } = useQuery(
    ['companyId', userId],
    () => companyService.getCompanyId(),
    {
      enabled: !!token,
    }
  );

  const {
    data: products,
    isLoading: areProductsLoading,
    refetch,
  } = useQuery(
    ['products', companyId],
    () =>
      productService.getProductsByCompany({
        is_service: false,
      }),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
      enabled: !!token,
    }
  );

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
    }
    setSearchText('');
  };

  // const handleRowUpdate = async (index: number, newData: Product) => {
  //   const newMappedData = [...mappedData];
  //   newMappedData[index] = newData;
  //   setMappedData(newMappedData);
  // };

  // const handleRowDelete = async (index: number, data: Product) => {
  //   const newMappedData = [...mappedData];
  //   newMappedData.splice(index, 1);
  //   setMappedData(newMappedData);
  // };

  const handleRowUpdate = async (index: number, newData: any) => {
    update(index, newData);
  };

  const handleRowDelete = async (index: number) => {
    remove(index);
  };

  // Add this function to properly handle discarding changes
  const handleDiscardChanges = () => {
    // This function should be called when "Discard Changes" is clicked
    // It will reset the form state for the products
    reset({
      ...values,
      update_products: [],
    });
  };

  const { toast } = useToast();

  const handleCreateProductRegisterOrder = async (values: ProductOrder) => {
    try {
      const order: ProductOrder = {
        ...values,
        update_products: values.update_products.map((row) => ({
          product_id: row.product_id,
          quantity_delta: row.quantity_delta,
        })),
      };

      const response = await productService.generateProductRegisterOrder(order);
      debugger;
      if (response) {
        await productService.updateInventory(response!.id as string);
        
        toast({
          title: "Operación exitosa",
          description: "El inventario ha sido actualizado correctamente",
          variant: "default",
        });

        reset();
        refetch();
      }
    } catch (error) {
      console.error("Error al actualizar inventario:", error);
      
      toast({
        title: "Error",
        description: "Ha ocurrido un error al actualizar el inventario",
        variant: "destructive",
      });
    }
  };

  const handleCreateError = (error: any) => {
    console.log('handleCreateError', error);

    // if (error.reason_description) {
    //   setError('reason_description', {
    //     type: 'manual',
    //     message: 'Razón de la operación es requerida',
    //   });
    //   setFocus('reason_description');
    // }
    throw error;
  };

  const handleDropProductsFromOrder = async (productIds: string[]) => {
    const rowIndexes = productIds.map((productId) =>
      rowData.findIndex((row) => row.product_id === productId)
    );
    remove(rowIndexes);
    setValue(
      'update_products',
      rowData.filter((row) => !productIds.includes(row.product_id))
    );
  };

  return (
    <form
      onSubmit={handleSubmit(
        handleCreateProductRegisterOrder
        // handleCreateError
      )}
    >
      <div className='flex min-h-screen w-full flex-col bg-background p-4'>
        {/* Breadcrumb navigation */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home/products-v2">Productos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Actualizar inventario</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className='flex h-full flex-col lg:flex-row gap-2 border-t pt-4'>
          {/* Mobile Tabs View */}
          <div className='lg:hidden w-full mb-4'>
            <Tabs defaultValue="products" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Productos</TabsTrigger>
                <TabsTrigger value="order">Registro</TabsTrigger>
              </TabsList>
              
              <TabsContent value="products">
                {/* Products Search Panel for Mobile */}
                <Card className='shadow-none border-none'>
                  <CardHeader className='space-y-1'>
                    <CardTitle className='text-2xl'>Productos</CardTitle>
                    <CardDescription>
                      Buscar y agregar productos al pedido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4 p-0 md:p-4'>
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
                        <div id='product-list' className='block space-y-2'>
                          {filteredProducts.map((product) => (
                            <Card
                              key={product.id}
                              className='transition-all hover:bg-accent hover:shadow-lg cursor-pointer'
                              onClick={() => handleAddProductToOrder(product)}
                            >
                              <CardContent className='p-0 md:p-3'>
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
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="order">
                {/* Order Grid Panel for Mobile */}
                <Card className='shadow-none border-none'>
                  <CardHeader className='px-0 md:px-4'>
                    <div className='flex flex-col md:flex-row gap-2 md:items-center md:justify-between'>
                    
                        <CardTitle className='text-xl md:text-2xl'>
                          Registro de Productos
                        </CardTitle>
                        <CardDescription>
                          Actualiza el inventario de tus productos 
                        </CardDescription>
                     
                      {rowData.length > 0 && (
                        <div className='flex gap-2 w-full mt-2 md:mt-0'>
                          <Button
                            variant='save'
                            type='submit'
                            className='w-full md:w-auto'
                          >
                            <SaveIcon className='w-4 h-4 mr-2' />
                            Guardar
                          </Button>
                          <Button
                            variant='delete'
                            onClick={handleDiscardChanges}
                            className='w-full md:w-auto'
                          >
                            <UndoIcon className='w-4 h-4 mr-2' />
                            Deshacer cambios
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className='md:space-y-6 p-0 md:p-4'>
                    <div className='flex flex-col space-y-1 md:space-y-0 gap-4 md:p-4 rounded-lg bg-muted/50'>
                      <div className='flex flex-col w-full p-1 md:p-4 sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
                        <Label className='min-w-20'>Actualizacion de inventario:</Label>
                        <div className='flex gap-2 w-full'>
                          <Button
                            variant={
                              values.type === 'ADD' ? 'add' : 'outline'
                            }
                            type='button'
                            onClick={(e) => {
                              e.preventDefault();
                              setValue('type', 'ADD');
                            }}
                            className='w-full'
                          >
                            <PlusIcon className='w-4 h-4' />
                            Incrementar
                          </Button>
                          <Button
                            variant={
                              values.type === 'DELETE' ? 'delete' : 'outline'
                            }
                            type='button'
                            onClick={(e) => {
                              e.preventDefault();
                              setValue('type', 'DELETE');
                            }}
                            className='w-full'
                          >
                            <MinusIcon className='w-4 h-4' />
                            Reducir
                          </Button>
                        </div>
                      </div>
                      <div className='flex-1'>
                        <Input
                          {...register('reason_description')}
                          placeholder='Cual es la razon de ingresar o reducir el inventario?'
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

                    <div className='border-t'>
                      <DataGrid
                      
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
                            headerName: `Cantidad a ${values.type === 'ADD' ? 'Ingresar' : 'Reducir'
                              }`,
                            field: 'quantity_delta',
                            editable: true,
                            type: 'numericColumn',
                            cellStyle: (
                              params
                            ): { backgroundColor?: string; color?: string } => {
                              // Check if quantity is invalid
                              const isInvalid = params.value <= 0;
                              // For DELETE operations, also check if quantity exceeds stock
                              const exceedsStock =
                                values.type === 'DELETE' &&
                                params?.data?.product &&
                                params.value >
                                (params?.data?.product?.quantity_in_stock ?? 0);

                              if (isInvalid || exceedsStock) {
                                return {
                                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                  color: '#dc2626',
                                };
                              }
                              return {};
                            },
                            cellRenderer: (params: {
                              value: number;
                              data: {
                                product: {
                                  quantity_in_stock: number;
                                };
                              };
                            }) => {
                              const isInvalid = params.value <= 0;
                              const exceedsStock =
                                values.type === 'DELETE' &&
                                params.data.product &&
                                params.value >
                                (params.data.product.quantity_in_stock ?? 0);

                              let errorMessage = '';
                              if (isInvalid) {
                                errorMessage =
                                  'La cantidad debe ser mayor que cero';
                              } else if (exceedsStock) {
                                errorMessage =
                                  'La cantidad excede el stock disponible';
                              }

                              return (
                                <div
                                  className={
                                    errorMessage ? 'text-destructive' : ''
                                  }
                                >
                                  {errorMessage && (
                                    <span className='mr-1' title={errorMessage}>
                                      ⚠️
                                    </span>
                                  )}
                                  {params.value || 0}
                                </div>
                              );
                            },
                            valueParser: (params) => {
                              const value = Number(params.newValue);
                              return isNaN(value) ? 0 : value;
                            },
                          },
                          
                        ]}
                        autoUpdate
                        onRowUpdate={handleRowUpdate}
                        onRowDelete={handleRowDelete}
                        // handleOnUpdateRows={handleCreateProductRegisterOrder}
                        // onDiscardChanges={handleDiscardChanges}
                        // onSelectionChange={setSelectedProducts}
                        // onDelete={() => setIsDeleteDialogOpen(true)}
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop View - Products Search Panel */}
          <div className='hidden lg:block w-full lg:w-1/3 xl:w-1/4 top-4 border-r'>
            <Card className='shadow-none border-none'>
              <CardHeader className='space-y-1'>
                <CardTitle className='text-2xl'>Productos</CardTitle>
                <CardDescription>
                  Buscar y agregar productos al pedido
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 p-0 md:p-4'>
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
                    <div id='product-list' className='block space-y-2'>
                      {filteredProducts.map((product) => (
                        <Card
                          key={product.id}
                          className='transition-all hover:bg-accent hover:shadow-lg cursor-pointer'
                          onClick={() => handleAddProductToOrder(product)}
                        >
                          <CardContent className='p-0 md:p-3'>
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
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Desktop View - Order Grid Panel */}
          <div className='hidden lg:block w-full lg:w-2/3 xl:w-3/4'>
            <Card className='shadow-none border-none'>
              <CardHeader>
                <div className='flex flex-col md:flex-row gap-4 md:items-center md:justify-between'>
                 
                    <CardTitle className='text-2xl'>
                      Registro de Productos
                    </CardTitle>
                    <CardDescription>
                      Actualiza el inventario de tus productos
                    </CardDescription>
                  
                  {rowData.length > 0 && (
                    <div className='flex gap-2'>
                      <Button
                        variant='save'
                        type='submit'
                      >
                        <SaveIcon className='w-4 h-4 mr-2' />
                        Guardar
                      </Button>
                      <Button
                        variant='delete'
                        onClick={handleDiscardChanges}
                      >
                        <UndoIcon className='w-4 h-4 mr-2' />
                        Deshacer cambios
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className='md:space-y-6 p-0 md:p-4'>
                <div className='flex flex-col space-y-4 md:space-y-0 gap-4 md:p-4 rounded-lg bg-muted/50'>
                  <div className='flex flex-col w-full sm:flex-row items-start sm:items-center gap-2 sm:gap-4'>
                    <Label className='min-w-20'>Actualizacion de inventario:</Label>
                    <div className='flex gap-2'>
                      <Button
                        variant={
                          values.type === 'ADD' ? 'add' : 'outline'
                        }
                        type='button'
                        onClick={(e) => {
                          e.preventDefault();
                          setValue('type', 'ADD');
                        }}
                        className='w-full'
                      >
                        <PlusIcon className='w-4 h-4' />
                        Incrementar
                      </Button>
                      <Button
                        variant={
                          values.type === 'DELETE' ? 'delete' : 'outline'
                        }
                        type='button'
                        onClick={(e) => {
                          e.preventDefault();
                          setValue('type', 'DELETE');
                        }}
                        className='w-full'
                      >
                        <MinusIcon className='w-4 h-4' />
                        Reducir
                      </Button>
                    </div>
                  </div>
                  <div className='flex-1'>
                    <Input
                      {...register('reason_description')}
                      placeholder='Cual es la razon de ingresar o reducir el inventario?'
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

                <div className='border-t'>
                  <DataGrid
                  
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
                        headerName: `Cantidad a ${values.type === 'ADD' ? 'Ingresar' : 'Reducir'
                          }`,
                        field: 'quantity_delta',
                        editable: true,
                        type: 'numericColumn',
                        cellStyle: (
                          params
                        ): { backgroundColor?: string; color?: string } => {
                          // Check if quantity is invalid
                          const isInvalid = params.value <= 0;
                          // For DELETE operations, also check if quantity exceeds stock
                          const exceedsStock =
                            values.type === 'DELETE' &&
                            params?.data?.product &&
                            params.value >
                            (params?.data?.product?.quantity_in_stock ?? 0);

                          if (isInvalid || exceedsStock) {
                            return {
                              backgroundColor: 'rgba(220, 38, 38, 0.1)',
                              color: '#dc2626',
                            };
                          }
                          return {};
                        },
                        cellRenderer: (params: {
                          value: number;
                          data: {
                            product: {
                              quantity_in_stock: number;
                            };
                          };
                        }) => {
                          const isInvalid = params.value <= 0;
                          const exceedsStock =
                            values.type === 'DELETE' &&
                            params.data.product &&
                            params.value >
                            (params.data.product.quantity_in_stock ?? 0);

                          let errorMessage = '';
                          if (isInvalid) {
                            errorMessage =
                              'La cantidad debe ser mayor que cero';
                          } else if (exceedsStock) {
                            errorMessage =
                              'La cantidad excede el stock disponible';
                          }

                          return (
                            <div
                              className={
                                errorMessage ? 'text-destructive' : ''
                              }
                            >
                              {errorMessage && (
                                <span className='mr-1' title={errorMessage}>
                                  ⚠️
                                </span>
                              )}
                              {params.value || 0}
                            </div>
                          );
                        },
                        valueParser: (params) => {
                          const value = Number(params.newValue);
                          return isNaN(value) ? 0 : value;
                        },
                      },
                      
                    ]}
                    autoUpdate
                    onRowUpdate={handleRowUpdate}
                    onRowDelete={handleRowDelete}
                    // handleOnUpdateRows={handleCreateProductRegisterOrder}
                    // onDiscardChanges={handleDiscardChanges}
                    // onSelectionChange={setSelectedProducts}
                    // onDelete={() => setIsDeleteDialogOpen(true)}
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

        </div>
      </div>
    </form>
  );
};

export default RegisterProductPage;
