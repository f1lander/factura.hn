"use client";
import { Upload } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { ColDef } from "ag-grid-community";
import { Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Product, productService } from "@/lib/supabase/services/product";
import { useProductsStore } from "@/store/productsStore";
import GenericEmptyState from "@/components/molecules/GenericEmptyState";
import { ProductForm } from "@/components/molecules/ProductForm";
import { Dialog } from "@radix-ui/react-dialog";
import { DataGrid } from "@/components/molecules/DataGrid";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useUploadXls from "@/hooks/useUploadXls";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog";

export default function ProductsPage() {
  const {
    handleXlsFileUpload,
    xlsFile,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
  } = useUploadXls();
  const { products, setProducts } = useProductsStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const { toast } = useToast();

  const loadProducts = useCallback(
    async (page: number, size: number) => {
      try {
        const response = await productService.getProductsPaginated(page, size);
        setProducts(response.data);
        setTotalProducts(response.total);
      } catch (err) {
        console.error("Error loading products:", err);
        toast({
          title: "Error",
          description:
            "No se pudieron cargar los productos. Por favor, intente de nuevo.",
          variant: "destructive",
        });
      }
    },
    [setProducts, setTotalProducts, toast],
  );

  const columnDefs: ColDef<Product>[] = [
    {
      field: "sku",
      headerName: "SKU",
      checkboxSelection: true,
      headerCheckboxSelection: true,
    },
    { field: "description", headerName: "Descripción" },
    {
      field: "unit_cost",
      headerName: "Precio Unitario",
      valueFormatter: (params) => `Lps. ${params.value.toFixed(2)}`,
    },
    {
      field: "is_service",
      headerName: "Tipo",
      valueFormatter: (params) => (params.value ? "Servicio" : "Producto"),
    },
    {
      field: "quantity_in_stock",
      headerName: "Inventario",
      valueFormatter: (params) =>
        params.data?.is_service ? "N/A" : params.value,
    },
  ];

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
      // TODO: Implement syncProducts if is needed now with pagination
      // syncProducts();
      setIsFormVisible(false);
      toast({
        title: selectedProduct ? "Producto Actualizado" : "Producto Creado",
        description: "El producto se ha guardado exitosamente.",
      });
    } catch (err) {
      console.error("Error al guardar el producto:", err);
      toast({
        title: "Error",
        description:
          "No se pudo guardar el producto. Por favor, intente de nuevo.",
        variant: "destructive",
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

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-12">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div
            className={`w-full ${isFormVisible ? "xl:w-1/2" : "xl:w-full"} transition-all duration-300 ease-in-out`}
          >
            {products.length === 0 ? (
              <GenericEmptyState
                icon={Package}
                title="No tienes productos aún"
                description="Agrega tus productos o servicios para incluirlos en tus facturas"
                buttonText="Agregar Producto"
                onAction={handleCreateProduct}
              />
            ) : (
              <DataGrid
                title="Productos y Servicios"
                description="Gestiona tus productos y servicios aquí"
                data={products}
                columnDefs={columnDefs}
                onRowClick={(data) => {
                  setSelectedProduct(data);
                  setIsFormVisible(true);
                }}
                onSelectionChange={setSelectedProducts}
                onCreateNew={handleCreateProduct}
                onDelete={() => setIsDeleteDialogOpen(true)}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
              // onPageChange={handlePageChange}
              />
            )}
          </div>
          {isFormVisible && (
            <div className="w-full xl:w-1/2 transition-all duration-300 ease-in-out">
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
      <section className="px-16 flex flex-col gap-5 pb-16">
        <h2 className="text-xl font-bold">
          ¿Tienes una tabla de Excel con tus productos? Añádelos aquí{" "}
        </h2>
        <Label
          htmlFor="xls"
          className="mt-2 inline-block cursor-pointer w-[60%] mx-auto"
        >
          <div className="flex flex-col gap-4 mx-auto w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-1">
              Arrastra y suelta tu archivo de Excel, o dale click en este
              recuadro para seleccionar un archivo
            </p>
            <Input
              id="xls"
              name="xls"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleXlsFileUpload}
            />
            {xlsFile && xlsFile.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    {Object.keys(xlsFile[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {xlsFile &&
                    xlsFile.map((row, index) => (
                      <tr key={index}>
                        {Object.values(row).map((value, index) => (
                          <td key={index}>{value.toString()}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </Label>
      </section>
      {/* <Button onClick={() => console.log(xlsFile)}>Mirar datossss</Button> */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* Dialog content */}
      </Dialog>
      <Dialog
        open={isAddProductsWithSpreadsheetDialogOpen}
        onOpenChange={setIsAddProductsWithSpreadsheetDialogOpen}
      >
        <DialogContent className="w-3/5">hola a todos</DialogContent>
      </Dialog>
    </div>
  );
}
