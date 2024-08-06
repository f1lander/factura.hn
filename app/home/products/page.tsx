"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Product, productService } from "@/lib/supabase/services/product";
import { ProductForm } from "@/components/molecules/ProductForm";
import { companyService } from "@/lib/supabase/services/company";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);

      const fetchedProducts = await productService.getProductsByCompany();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to fetch products. Please try again.");
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
        await productService.createProduct({
          ...data,
        } as Product);
      }
      fetchProducts();
      setIsFormVisible(false);
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product. Please try again.");
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedProduct(null);
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
            <Card className="w-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Productos y Servicios</CardTitle>
                  <CardDescription>Gestiona tus productos y servicios aquí</CardDescription>
                </div>
                <Button onClick={handleCreateProduct}>+ Nuevo</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        onClick={() => handleProductSelect(product)}
                      >
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.description}</TableCell>
                        <TableCell>${product.unit_cost.toFixed(2)}</TableCell>
                        <TableCell>{product.is_service ? 'Servicio' : 'Producto'}</TableCell>
                        <TableCell>{product.is_service ? 'N/A' : product.quantity_in_stock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
    </div>
  );
}