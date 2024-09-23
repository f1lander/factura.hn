"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, productService } from "@/lib/supabase/services/product";
import { ProductForm } from "@/components/molecules/ProductForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DeleteIcon, Package, PlusIcon, Trash2Icon } from "lucide-react";
import GenericEmptyState from "@/components/molecules/GenericEmptyState";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await productService.getProductsByCompany();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("No se pudieron cargar los productos. Por favor, intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (data: Partial<Product>) => {
    try {
      if (selectedProduct) {
        await productService.updateProduct(selectedProduct.id!, data);
      } else {
        await productService.createProduct(data as Product);
      }
      fetchProducts();
      setIsFormVisible(false);
      toast({
        title: selectedProduct ? "Producto Actualizado" : "Producto Creado",
        description: "El producto se ha guardado exitosamente.",
      });
    } catch (err) {
      console.error("Error al guardar el producto:", err);
      setError("No se pudo guardar el producto. Por favor, intente de nuevo.");
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProduct(null);
  };

  const handleCheckboxChange = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(product => product.id!));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleDeleteClick = () => {
    if (selectedProducts.length > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
      fetchProducts();
      setSelectedProducts([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Productos Eliminados",
        description: "Los productos seleccionados han sido eliminados exitosamente.",
      });
    } catch (err) {
      console.error("Error al eliminar productos:", err);
      toast({
        title: "Error",
        description: "No se pudieron eliminar los productos. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-12">Cargando...</div>;
  }

  if (error) {
    return <div className="p-12">Error: {error}</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-12">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className={`w-full ${isFormVisible ? 'xl:w-1/2' : 'xl:w-full'} transition-all duration-300 ease-in-out`}>
            {products.length === 0 ? (
              <GenericEmptyState
                icon={Package}
                title="No tienes productos aún"
                description="Agrega tus productos o servicios para incluirlos en tus facturas"
                buttonText="Agregar Producto"
                onAction={handleCreateProduct}
              />) : (
              <Card className="w-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Productos y Servicios</CardTitle>
                    <CardDescription>Gestiona tus productos y servicios aquí</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDeleteClick}
                      variant="destructive"
                      disabled={selectedProducts.length === 0}
                    >
                      <Trash2Icon />
                      Eliminar
                    </Button>
                    <Button onClick={handleCreateProduct}><PlusIcon />Nuevo</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedProducts.length === products.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Precio Unitario</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Inventario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={() => handleCheckboxChange(product.id!)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell onClick={() => handleProductSelect(product)}>{product.sku}</TableCell>
                          <TableCell onClick={() => handleProductSelect(product)}>{product.description}</TableCell>
                          <TableCell onClick={() => handleProductSelect(product)}>{`Lps. ${product.unit_cost.toFixed(2)}`}</TableCell>
                          <TableCell onClick={() => handleProductSelect(product)}>{product.is_service ? 'Servicio' : 'Producto'}</TableCell>
                          <TableCell onClick={() => handleProductSelect(product)}>{product.is_service ? 'N/A' : product.quantity_in_stock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
          {isFormVisible && (
            <div className="w-full xl:w-1/2 transition-all duration-300 ease-in-out">
              <ProductForm
                product={selectedProduct || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            </div>
          )}
        </main>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar {selectedProducts.length === 1 ? "el producto seleccionado" : `los ${selectedProducts.length} productos seleccionados`}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}