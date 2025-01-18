"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BookOpenCheck, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Product, productService } from "@/lib/supabase/services/product";
import GenericEmptyState from "@/components/molecules/GenericEmptyState";
import { ProductForm } from "@/components/molecules/ProductForm";
import { Dialog } from "@radix-ui/react-dialog";
import { DataGrid } from "@/components/molecules/DataGrid";
import { Input } from "@/components/ui/input";
import useUploadXls from "@/hooks/useUploadXls";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productColumns } from "@/utils/tableColumns";
import { useRouter } from "next/navigation";

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
    xlsFile,
    fileName,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    isTablePreviewDialogOpen,
    setIsTablePreviewDialogOpen,
    tableFieldnames,
    areProductsLoading,
    setAreProductsLoading,
    setXlsFile,
  } = useUploadXls();
  const { control, handleSubmit } = useForm<ProductKeyMappings>({
    defaultValues: {
      sku: "",
      description: "",
      unit_cost: "",
      is_service: "",
      quantity_in_stock: "",
    },
  });
  const queryClient = useQueryClient();
  const { data: products, isLoading: areProductsFromDBLoading } = useQuery(
    ["products"],
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
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const { toast } = useToast();

  const onSubmit: SubmitHandler<ProductKeyMappings> = async (data) => {
    setAreProductsLoading(true);

    if (!xlsFile) {
      setAreProductsLoading(false);
      return alert("No se ha subido ningún archivo de Excel");
    }

    const transformedRows = xlsFile.map((row) => {
      const newRow: Record<string, any> = {
        // Initialize with default values
        sku: "",
        description: "",
        unit_cost: "",
        is_service: false,
        quantity_in_stock: "",
      };

      // Override defaults with mapped values if they exist
      for (const [newKey, oldKey] of Object.entries(data)) {
        if (oldKey) {
          // Only map if a key was provided
          newRow[newKey] = row[oldKey];
        }
      }

      return newRow;
    });
    const { success, message } = await productService.createMultipleProducts(
      transformedRows
    );
    if (!success) {
      toast({
        title: "No se pudieron subir los productos",
        description: message,
      });
      return setAreProductsLoading(false);
    }

    toast({ title: "Carga de productos exitosa", description: message });
    setIsAddProductsWithSpreadsheetDialogOpen(false);
    setXlsFile(null);
    setAreProductsLoading(false);
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const loadProducts = useCallback(
    async (page: number, size: number) => {
      try {
        const response = await productService.getProductsPaginated(page, size);
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
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

  if (areProductsFromDBLoading) {
    return (
      <div className="p-10 text-center">
        <h1>Cargando productos...</h1>
      </div>
    );
  }

  const handleOnUpdateRows = async (rows: Product[]) => {
    const { success } = await productService.updateMultipleProducts(rows);
    if (!success)
      toast({
        title: "Actualización de productos fallido",
        description: "Revisa si algún dato que ingresaste fue inválido",
      });
    toast({
      title: "Actualización de productos exitosa",
      description: "Tus productos se han actualizado en la base de datos",
    });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-12">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div
            className={`w-full ${
              isFormVisible ? "xl:w-1/2" : "xl:w-full"
            } transition-all duration-300 ease-in-out`}
          >
            <Button
              onClick={() => push('/home/products-v2/register-order')}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center"
            >
              <BookOpenCheck className="h-4 w-4 mr-2" />
              Actualizar inventario
            </Button>
            {/* in case there are elements from a spreadsheet, take the columns and data, and display
            the table. */}
            {products!.length === 0 ? (
              <>
                {tableFieldnames.length > 0 ? (
                  <DataGrid
                    title="Previsualización"
                    description="previsualiza tus productos"
                    data={xlsFile!}
                    columnDefs={tableFieldnames.map((fieldName) => {
                      return {
                        field: fieldName,
                        headerName: fieldName,
                      };
                    })}
                  />
                ) : (
                  <GenericEmptyState
                    icon={Package}
                    title="No tienes productos aún"
                    description="Agrega tus productos o servicios para incluirlos en tus facturas"
                    buttonText="Agregar Producto"
                    onAction={handleCreateProduct}
                    onAddExcelSpreadSheet={triggerFileInput}
                  />
                )}
              </>
            ) : (
              <DataGrid
                title="Productos y Servicios"
                description="Gestiona tus productos y servicios aquí"
                data={products!}
                columnDefs={productColumns}
                onSelectionChange={setSelectedProducts}
                onCreateNew={handleCreateProduct}
                onDelete={() => setIsDeleteDialogOpen(true)}
                pageSize={pageSize}
                pageSizeOptions={[5, 10, 20, 50]}
                onAddExcelSpreadSheet={triggerFileInput}
                handleOnUpdateRows={handleOnUpdateRows}
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
        <Input
          id="xls"
          name="xls"
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleXlsFileUpload}
          ref={excelFileInputRef}
        />
        {xlsFile && (
          <div className="flex gap-3 mt-2 w-[60%] mx-auto border-2 border-gray-300 rounded p-5 justify-around items-center">
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
            {/* <div className="flex justify-between">
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
            </div> */}
            {/* <Button type="submit" disabled={areProductsLoading}>Subir productos</Button> */}
            <Button type="submit" disabled={areProductsLoading}>
              {areProductsLoading ? "Subiendo productos..." : "Subir productos"}
            </Button>
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
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        >
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
                const { success, message } = await productService.deleteMultipleProducts(
                  selectedProducts
                );
                if (!success) {
                  toast({
                    title: "Error al eliminar productos",
                    description: message,
                    variant: "destructive",
                  });
                  return;
                }
                toast({
                  title: "Productos eliminados",
                  description: message,
                });
                queryClient.invalidateQueries({ queryKey: ["products"] });
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
