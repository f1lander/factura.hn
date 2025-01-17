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

const RegisterProductPage: React.FC = () => {
  const [rowData, setRowData] = useState<ProductToOrder[]>([]);
  const [columnDefs] = useState([
    { headerName: 'Product Name', field: 'productName', editable: true },
    { headerName: 'Category', field: 'category', editable: true },
    { headerName: 'Price', field: 'price', editable: true },
    { headerName: 'Quantity', field: 'quantity', editable: true },
  ]);

  // const onAddRow = () => {
  //   setRowData([...rowData, { productName: '', category: '', price: '', quantity: '' }]);
  // };

  const onSave = () => {
    // Handle save logic here
    console.log('Saved data:', rowData);
  };

  const { data: products, isLoading: areProductsLoading } = useQuery(
    ["products"],
    () => productService.getProductsByCompany(),
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    },
  );
  console.log('products:', products);

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
      type: 'ADD',
      update_products: rows.map((row) => ({
        product_id: row.product_id,
        quantity_delta: row.quantity_delta,
      })),
    };

    const response = await productService.generateProductRegisterOrder(order);

    if (response) {
      console.log('response:', response);

      await productService.updateInventory(response!.id as string);

      setRowData([]);
    }
    // console.log('response:', response);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-12">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <DataGrid
            title="Registro de Productos"
            description="Actualiza el inventario de tus productos"
            data={rowData}
            idField="product_id"
            columnDefs={[{
              headerName: 'SKU',
              field: 'product.sku',
              editable: false,
            }, {
              headerName: 'Descripción',
              field: 'product.description',
              editable: false,
            }, {
              headerName: 'Cantidad a agregar',
              field: 'quantity_delta',
              editable: true,
            }]}
            handleOnUpdateRows={handleCreateProductRegisterOrder}
            SearchBoxComponent={
              <SearchBoxComponent searchText={searchText} onFilterTextBoxChanged={(event) => {
                setSearchText(event.target.value);
              }}>
                {searchText && (
                  <Popover modal open={!!searchText}>
                    <Card className="absolute z-10 top-full left-0 right-0">
                      {
                      filteredProducts.map((product) => (
                        <Card 
                          key={product.id}
                          className="flex flex-col p-1 m-1 border-0 shadow-none hover:shadow-md hover:cursor-pointer"
                          onClick={() => handleAddProductToOrder(product)}
                        >
                          <div className='w-25'>SKU: {product.sku}</div>
                          <div>{product.description}</div>
                        </Card>
                      ))
                      }
                    </Card>
                  </Popover>
                )}
              </SearchBoxComponent>
            }

            // onSelectionChange={setSelectedProducts}
            // onCreateNew={handleCreateProduct}
            // onDelete={() => setIsDeleteDialogOpen(true)}
            // pageSize={pageSize}
            pageSizeOptions={[5, 10, 20, 50]}
            // onAddExcelSpreadSheet={triggerFileInput}
            // handleOnUpdateRows={handleOnUpdateRows}
          />
        </main>
      </div>
    </div>
    // <div className="ag-theme-alpine" style={{ height: 400, width: 600 }}>
    //   <button onClick={onAddRow}>Add Product</button>
    //   <button onClick={onSave}>Save</button>
    //   <AgGridReact
    //     rowData={rowData}
    //     columnDefs={columnDefs}
    //     onCellValueChanged={(event) => {
    //       const updatedRowData = [...rowData];
    //       updatedRowData[event.rowIndex] = event.data;
    //       setRowData(updatedRowData);
    //     }}
    //   />
    // </div>
  );
};

export default RegisterProductPage;