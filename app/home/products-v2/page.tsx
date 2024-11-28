"use client";
import { Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Controller, SubmitHandler, useForm } from "react-hook-form";

interface ProductKeyMappings {
  sku: string;
  description: string;
  unit_cost: string;
  is_service: string;
  quantity_in_stock: string;
}

export default function ProductsPage() {
  const {
    handleXlsFileUpload,
    xlsFile,
    fileName,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    isTablePreviewDialogOpen,
    setIsTablePreviewDialogOpen,
    tableFieldnames,
  } = useUploadXls();
  const { control, register, handleSubmit } = useForm<ProductKeyMappings>({
    defaultValues: {
      sku: "",
      description: "",
      unit_cost: "",
      is_service: "",
      quantity_in_stock: "",
    },
  });
  const { products, setProducts } = useProductsStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const { toast } = useToast();

  const onSubmit: SubmitHandler<ProductKeyMappings> = (data) => {
    console.log(data);
  };

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
        {!xlsFile && (
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
            </div>
          </Label>
        )}
        {xlsFile && (
          <div className="flex gap-3 mt-2 w-[60%] mx-auto border-2 border-gray-300 rounded p-5 justify-around items-center">
            <Button
              onClick={() => {
                console.log(xlsFile);
              }}
            >
              Ver tabla
            </Button>
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-medium">Nombre de archivo subido:</h2>
              <span>{fileName}</span>
              <label
                htmlFor="xls"
                className="bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-fit cursor-pointer rounded"
              >
                cambiar archivo
              </label>
              <Input
                id="xls"
                name="xls"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleXlsFileUpload}
              />
            </div>
            <div className="flex flex-col gap-4">
              <Button onClick={() => setIsTablePreviewDialogOpen(true)}>
                Previsualizar tabla
              </Button>
              <Button
                onClick={() => setIsAddProductsWithSpreadsheetDialogOpen(true)}
              >
                Subir tabla de productos
              </Button>
            </div>
          </div>
        )}
      </section>
      {/* <Dialog */}
      {/*   open={isDeleteDialogOpen} */}
      {/*   onOpenChange={setIsDeleteDialogOpen} */}
      {/* ></Dialog> */}
      <Dialog
        open={isAddProductsWithSpreadsheetDialogOpen}
        onOpenChange={setIsAddProductsWithSpreadsheetDialogOpen}
      >
        <DialogContent className="w-3/5 flex flex-col gap-5">
          <h1 className="text-2xl font-medium">Mapeo de columnas</h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="flex justify-between">
              <span>SKU</span>
              <Controller
                control={control}
                name="sku"
                render={({ field }) => {
                  if (tableFieldnames.includes("SKU") && field.value === "") {
                    field.onChange("SKU"); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes("SKU") ? "SKU" : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Descripción</span>
              <Controller
                control={control}
                name="description"
                render={({ field }) => {
                  if (
                    tableFieldnames.includes("Descripción") &&
                    field.value === ""
                  ) {
                    field.onChange("Descripción"); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes("Descripción")
                          ? "Descripción"
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Precio unitario</span>
              <Controller
                control={control}
                name="unit_cost"
                render={({ field }) => {
                  if (
                    tableFieldnames.includes("Precio Unitario") &&
                    field.value === ""
                  ) {
                    field.onChange("Precio Unitario"); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes("Precio Unitario")
                          ? "Precio Unitario"
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Tipo</span>
              <Controller
                control={control}
                name="is_service"
                render={({ field }) => {
                  if (tableFieldnames.includes("Tipo") && field.value === "") {
                    field.onChange("Tipo"); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes("Tipo") ? "Tipo" : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className="flex justify-between">
              <span>Inventario</span>
              <Controller
                control={control}
                name="quantity_in_stock"
                render={({ field }) => {
                  if (
                    tableFieldnames.includes("Inventario") &&
                    field.value === ""
                  ) {
                    field.onChange("Inventario"); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes("Inventario")
                          ? "Inventario"
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-fit">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <Button type="submit">Subir productos</Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isTablePreviewDialogOpen}
        onOpenChange={setIsTablePreviewDialogOpen}
      >
        <DialogContent className="overflow-y-auto">
          <table className="table">
            <thead>
              <tr>
                {xlsFile &&
                  Object.keys(xlsFile[0]).map((key) => (
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
