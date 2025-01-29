'use client';

import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { DataGrid } from '@/components/molecules/DataGrid';
import { SearchBoxComponent } from '@/components/SearchBoxComponent';
import { Product, ProductOrder, productService, ProductToOrder } from '@/lib/supabase/services/product';
import { useQuery } from '@tanstack/react-query';
import { Popover } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Dialog, DialogClose } from '@radix-ui/react-dialog';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const RegisterProductPage: React.FC = () => {
  const [rowData, setRowData] = useState<ProductToOrder[]>([]);
  const [actionType, setActionType] = useState<'ADD' | 'DELETE'>('ADD');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: products, isLoading: areProductsLoading, refetch } = useQuery(
    ["products"],
    () => productService.getProductsByCompany(),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    },
  );

  const [searchText, setSearchText] = useState<string>('');

  const filteredProducts = products?.filter((product) =>
      product.sku.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()) ||
      product.description.toLocaleLowerCase().includes(searchText.toLocaleLowerCase())) || [];

  const handleAddProductToOrder = (product: Product) => {
    if(!rowData.find((row) => row.product_id === product.id)) {
      setRowData([...rowData, { product_id: product.id, product, quantity_delta: 0 }]);
    }
    setSearchText('');
  }

  const handleCreateProductRegisterOrder = async (rows: ProductToOrder[]) => {
    const order: ProductOrder = {
      type: actionType,
      update_products: rows.map((row) => ({
        product_id: row.product_id,
        quantity_delta: row.quantity_delta,
      })),
    };

    const response = await productService.generateProductRegisterOrder(order);

    if (response) {
      await productService.updateInventory(response!.id as string);

      setRowData([]);
      refetch();
    }
  };

  const handleDropProductsFromOrder = async (productIds: string[]) => {
    setRowData(rowData.filter((row) => !productIds.includes(row.product_id)));
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-12">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div
            className={`w-full ${
              "xl:w-1/5"
            } transition-all duration-300 ease-in-out`}
          >
            <Card className="flex flex-col relative left-0 right-0">
              <SearchBoxComponent className='relative flex-1' searchText={searchText} onFilterTextBoxChanged={(event) => {
                setSearchText(event.target.value);
              }}/>
              <div className="scroll-y h-96 overflow-auto">
                {
                filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="flex flex-col p-1 m-1 border-0 shadow-none hover:shadow-md hover:cursor-pointer"
                    onClick={() => handleAddProductToOrder(product)}
                    >
                    <div className='flex flex-row justify-between'>
                      <div className='w-25'>SKU: {product.sku}</div>
                      <div>
                        Cant: {product.quantity_in_stock}
                      </div>
                    </div>
                    <div>{product.description}</div>
                  </Card>
                ))
                }
              </div>
            </Card>
          </div>
          <div className="w-full xl:w-4/5 transition-all duration-300 ease-in-out">
            <DataGrid
              title="Registro de Productos"
              description="Actualiza el inventario de tus productos"
              data={rowData}
              idField="product_id"
              columnDefs={[{
                headerName: 'SKU',
                field: 'product.sku',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                editable: false,
              }, {
                headerName: 'Descripción',
                field: 'product.description',
                editable: false,
              }, {
                headerName: 'Cantidad Existente',
                field: 'product.quantity_in_stock',
                editable: false,
              }, {
                headerName: `Cantidad a ${actionType === 'ADD' ? 'Agregar' : 'Eliminar'}`,
                field: 'quantity_delta',
                editable: true,
                type: 'numericColumn',
              }]}
              handleOnUpdateRows={handleCreateProductRegisterOrder}
              ControlsComponents={
                <div className="flex items-center">
                  <label className="mr-2">Operación:</label>
                  <div className="flex items-center gap-2">
                  <Card
                    className={`py-1 px-2 cursor-pointer ${actionType === 'ADD' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActionType('ADD')}
                  >
                    Agregar
                  </Card>
                  <Card
                    className={`py-1 px-2 cursor-pointer ${actionType === 'DELETE' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                    onClick={() => setActionType('DELETE')}
                  >
                    Remover
                  </Card>
                  </div>
                </div>
              }
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
                  ¿Estás seguro que no quiere actualizar los siguientes productos?
                  {selectedProducts.length > 0 && (
                    <ul>
                      {selectedProducts.map((productId) => {
                        const product = products?.find(p => p.id === productId);
                        return (
                          <li key={productId}>{product?.sku} - {product?.description}</li>
                        );
                      })}
                    </ul>
                  )}
                </DialogDescription>
                <DialogFooter>
                  <Button
                    variant="destructive"
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
        </main>
      </div>
    </div>
  );
};

export default RegisterProductPage;