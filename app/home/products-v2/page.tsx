'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpenCheck,
  Package,
  Filter,
  SheetIcon,
  Search,
  Plus,
  FileSpreadsheet,
  PlusIcon,
} from 'lucide-react';
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
import { TaxType } from '@/lib/supabase/services/product';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase/client';

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
  const [isMobile, setIsMobile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productImageUrls, setProductImageUrls] = useState<
    Record<string, string>
  >({});
  const [selectedProductImageUrl, setSelectedProductImageUrl] = useState<
    string | null
  >(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleXlsFileUpload(event);
  };

  const handleImportComplete = async (mappedData: any[]) => {
    // Ensure all products have a tax_type, defaulting to GRAVADO_15 if not specified
    const productsWithDefaultTax = mappedData.map((product) => ({
      ...product,
      tax_type: product.tax_type || TaxType.GRAVADO_15,
    }));

    const { success, message } = await productService.createMultipleProducts(
      productsWithDefaultTax
    );

    if (!success) {
      toast({
        title: 'No se pudieron subir los productos',
        description: message,
        variant: 'destructive',
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
      const productData = {
        ...data,
        tax_type: data.tax_type || TaxType.GRAVADO_15,
      };

      // Remove the base64 image before saving to database
      const imageBase64 = productData.image_base64;
      delete productData.image_base64;

      if (selectedProduct) {
        // Update existing product
        await productService.updateProduct(selectedProduct.id, productData);
      } else {
        // Create new product
        const result = await productService.createProduct(productData);

        // If we have a base64 image and the product was created successfully
        if (imageBase64 && result && result.id) {
          // Upload the image
          const imagePath = await handleProductImageUpload(
            result.id,
            imageBase64
          );
          if (imagePath) {
            // Update the product with the image path
            await productService.updateProduct(result.id, {
              image_url: imagePath,
            });
          }
        }
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

  // Add this function to handle product image uploads
  const handleProductImageUpload = async (
    productId: string,
    photoBase64: string
  ): Promise<string | null> => {
    try {
      const fileType = photoBase64.split(';')[0].split(':')[1];
      const fileExtension = fileType.split('/')[1];
      const imageData = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(imageData, 'base64');

      const { data: uploadedPhoto, error: uploadPhotoError } = await supabase()
        .storage.from('products-bucket')
        .upload(`public/product_${productId}.${fileExtension}`, buffer, {
          cacheControl: '3600',
          contentType: fileType,
          upsert: true,
        });

      if (uploadPhotoError || !uploadedPhoto) {
        console.error('Photo upload failed:', uploadPhotoError);
        return null;
      }

      return uploadedPhoto.path;
    } catch (error) {
      console.error('Error uploading product image:', error);
      return null;
    }
  };

  useEffect(() => {
    loadProducts(currentPage, pageSize);
  }, [currentPage, pageSize, loadProducts]);

  useEffect(() => {
    // Check if screen width is below 768px (typical mobile breakpoint)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchProductImages = async () => {
      if (!products) return;

      const imageUrls: Record<string, string> = {};

      for (const product of products) {
        if (product.image_url) {
          try {
            const { data, error } = await supabase()
              .storage.from('products-bucket')
              .createSignedUrl(product.image_url, 3600);

            if (error || !data) {
              console.error(
                'Error fetching signed URL for product image:',
                error
              );
              continue;
            }

            imageUrls[product.id] = data.signedUrl;
          } catch (error) {
            console.error('Error generating signed URL:', error);
          }
        }
      }

      setProductImageUrls(imageUrls);
    };

    fetchProductImages();
  }, [products]);

  useEffect(() => {
    const fetchSelectedProductImage = async () => {
      if (!selectedProduct || !selectedProduct.image_url) {
        setSelectedProductImageUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase()
          .storage.from('products-bucket')
          .createSignedUrl(selectedProduct.image_url, 3600);

        if (error || !data) {
          console.error(
            'Error fetching signed URL for selected product image:',
            error
          );
          setSelectedProductImageUrl(null);
          return;
        }

        setSelectedProductImageUrl(data.signedUrl);
      } catch (error) {
        console.error(
          'Error generating signed URL for selected product:',
          error
        );
        setSelectedProductImageUrl(null);
      }
    };

    fetchSelectedProductImage();
  }, [selectedProduct]);

  if (areProductsFromDBLoading) {
    return (
      <div className='w-full p-4 space-y-6'>
        {/* Skeleton for header section */}
        <div className='bg-white rounded-lg shadow p-4 mb-4'>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center'>
            <div className='h-5 w-64 bg-gray-200 animate-pulse rounded-md mb-2'></div>
            <div className='flex gap-2 mt-3 sm:mt-0'>
              <div className='h-10 w-40 bg-gray-200 animate-pulse rounded-md'></div>
              <div className='h-10 w-40 bg-gray-200 animate-pulse rounded-md'></div>
              <div className='h-10 w-40 bg-gray-200 animate-pulse rounded-md'></div>
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className='flex flex-col-reverse xl:flex-row gap-4'>
          {/* Products grid skeleton */}
          <div className='w-full xl:w-2/3 bg-white rounded-lg border shadow-sm p-4'>
            {/* Mobile header skeleton */}
            <div className='md:hidden mb-4'>
              <div className='flex justify-between items-center'>
                <div className='h-5 w-24 bg-gray-200 animate-pulse rounded-md'></div>
                <div className='flex gap-2'>
                  <div className='h-9 w-24 bg-gray-200 animate-pulse rounded-md'></div>
                  <div className='h-9 w-24 bg-gray-200 animate-pulse rounded-md'></div>
                </div>
              </div>

              {/* Search bar skeleton */}
              <div className='mt-3'>
                <div className='h-10 w-full bg-gray-200 animate-pulse rounded-md'></div>
              </div>
            </div>

            {/* Table header skeleton */}
            <div className='hidden md:flex border-b py-3'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='flex-1 p-2'>
                  <div className='h-6 bg-gray-200 animate-pulse rounded-md'></div>
                </div>
              ))}
            </div>

            {/* Table rows skeleton */}
            <div className='hidden md:block'>
              {[...Array(7)].map((_, i) => (
                <div key={i} className='flex border-b py-4'>
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className='flex-1 p-2'>
                      <div className='h-5 bg-gray-200 animate-pulse rounded-md'></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Mobile product list skeleton */}
            <div className='md:hidden divide-y'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='py-4 flex items-center gap-3'>
                  <div className='w-16 h-16 bg-gray-200 rounded-md animate-pulse'></div>
                  <div className='flex-1 space-y-2'>
                    <div className='h-5 w-4/5 bg-gray-200 animate-pulse rounded-md'></div>
                    <div className='h-4 w-1/2 bg-gray-200 animate-pulse rounded-md'></div>
                    <div className='flex justify-between'>
                      <div className='h-4 w-16 bg-gray-200 animate-pulse rounded-md'></div>
                      <div className='h-4 w-20 bg-gray-200 animate-pulse rounded-md'></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination skeleton */}
            <div className='hidden md:flex justify-end mt-4'>
              <div className='h-8 w-64 bg-gray-200 animate-pulse rounded-md'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleOnUpdateRows = async (rows: Product[]) => {
    try {
      const updatedRows = rows.map((row) => ({
        ...row,
        tax_type: row.tax_type || TaxType.GRAVADO_15,
      }));

      const { success } = await productService.updateMultipleProducts(
        updatedRows
      );
      if (!success) {
        toast({
          title: 'Actualización de productos fallido',
          description: 'Revisa si algún dato que ingresaste fue inválido',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Actualización de productos exitosa',
          description: 'Tus productos se han actualizado en la base de datos',
        });
      }
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: 'Error',
        description:
          'No se pudieron actualizar los productos. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
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

  // Add a filter function for the products based on search term
  const filteredProducts = products?.filter(
    (product) =>
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // This function will handle product selection and properly reset the image
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setIsFormVisible(true);

    // Explicitly reset any image URLs when selecting a new product
    // This ensures we don't keep showing the previous product's image
    if (!product.image_url) {
      // If using productImageUrls state
      const updatedImageUrls = { ...productImageUrls };
      // Remove any previous URL for this product ID
      if (product.id in updatedImageUrls) {
        delete updatedImageUrls[product.id];
        setProductImageUrls(updatedImageUrls);
      }

      // If using selectedProductImageUrl state
      setSelectedProductImageUrl(null);
    }
  };

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col'>
        <main className='p-4 sm:px-6 sm:py-4'>
          {/* Header with title and action buttons */}
          <div className='flex  bg-white rounded-lg shadow p-4 flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3'>
            <p className='text-sm text-muted-foreground'>
              Gestiona tus productos y servicios aquí
            </p>
            <div className='flex flex-col sm:flex-row w-full sm:w-auto gap-2'>
              {isMobile ? (
                // Mobile layout: 2 columns grid
                <div className='flex flex-col w-full items-center justify-between gap-2'>
                  <Button
                    onClick={() => push('/home/products-v2/register-order')}
                    variant='outline'
                    className='w-full border-2 rounded-md border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center'
                  >
                    <BookOpenCheck className='h-4 w-4 mr-2' />
                    Actualizar inventario
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={() => push('/home/products-v2/register-order')}
                    variant='outline'
                    className='w-full border-2 rounded-md border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center'
                  >
                    <BookOpenCheck className='h-4 w-4 mr-2' />
                    Actualizar inventario
                  </Button>

                  <Button
                    onClick={() => setIsImporting(true)}
                    variant='outline'
                    className='w-full border-2 rounded-md border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-center'
                  >
                    Importar desde excel
                  </Button>

                  <Button onClick={handleCreateProduct} variant='add2'>
                    <PlusIcon className='h-4 w-4 mr-2' />
                    Agregar Producto
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Main content area */}
          <div className='flex flex-col-reverse xl:flex-row items-start gap-4'>
            <div
              className={`w-full ${
                isFormVisible ? 'xl:w-1/2' : 'xl:w-full'
              } transition-all duration-300 ease-in-out`}
            >
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
                <div className='bg-white rounded-lg border shadow-sm'>
                  {isMobile ? (
                    <div className='flex flex-col'>
                      {/* Mobile Filter Button */}
                      <div className='p-4 border-b flex justify-between items-center'>
                        {products && (
                          <p className='text-sm text-muted-foreground'>
                            Total ({products.length})
                          </p>
                        )}
                        <div className='flex gap-2'>
                          <Button
                            onClick={() => setIsImporting(true)}
                            variant='outline'
                            className='flex gap-2 items-center border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700'
                          >
                            <FileSpreadsheet className='h-4 w-4' />
                            Excel
                          </Button>
                          <Button
                            onClick={handleCreateProduct}
                            variant='outline'
                            className='border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center'
                          >
                            <PlusIcon className='h-4 w-4 mr-2' />
                            Nuevo
                          </Button>
                        </div>

                        {/* <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Filter className="h-4 w-4" />
                              Filtros
                            </Button>
                          </SheetTrigger>
                          <SheetContent side="right">
                            <SheetHeader>
                              <SheetTitle>Filtros</SheetTitle>
                              <SheetDescription>
                                Filtra tus productos por diferentes criterios
                              </SheetDescription>
                            </SheetHeader>
                            <div className="py-4">
                            
                              <p className="text-sm text-muted-foreground">Filtros a implementar próximamente</p>
                            </div>
                          </SheetContent>
                        </Sheet> */}
                      </div>

                      {/* Add search input for mobile */}
                      <div className='px-4 py-2 border-b'>
                        <div className='relative'>
                          <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                          <Input
                            placeholder='Buscar productos...'
                            className='pl-8'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Mobile Product List - update to use filteredProducts */}
                      <div className='flex flex-col divide-y'>
                        {filteredProducts?.length === 0 ? (
                          <div className='p-6 text-center text-muted-foreground'>
                            No se encontraron productos que coincidan con la
                            búsqueda
                          </div>
                        ) : (
                          filteredProducts?.map((product) => (
                            <div
                              key={product.id}
                              className='p-4 flex items-center gap-3 hover:bg-muted/20 cursor-pointer'
                              onClick={() => handleProductSelect(product)}
                              title={product.description}
                            >
                              <div className='flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center'>
                                {product.image_url ? (
                                  <img
                                    src={
                                      productImageUrls[product.id] ||
                                      '/placeholder-product.jpg'
                                    }
                                    alt={product.description || 'Product'}
                                    className='object-cover w-full h-full'
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.onerror = null;
                                      target.src = '/placeholder-product.jpg';
                                    }}
                                  />
                                ) : (
                                  <Package className='h-8 w-8 text-gray-400' />
                                )}
                              </div>

                              <div className='flex-grow overflow-auto'>
                                <div
                                  className='font-medium truncate'
                                  style={{ maxWidth: '200px' }}
                                >
                                  {product.description}
                                </div>
                                <div className='text-sm text-muted-foreground'>
                                  SKU: {product.sku}
                                </div>
                                <div className='flex items-center justify-between mt-1'>
                                  <span className='text-sm'>
                                    L. {product.unit_cost?.toFixed(2) || '0.00'}
                                  </span>
                                  <div className='flex items-center gap-1'>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        (product.quantity_in_stock || 0) > 10
                                          ? 'bg-green-100 text-green-800'
                                          : (product.quantity_in_stock || 0) > 0
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      Stock: {product.quantity_in_stock || 0}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <DataGrid
                      title=''
                      description=''
                      data={products!}
                      columnDefs={productColumns}
                      onSelectionChange={setSelectedProducts}
                      onDelete={() => setIsDeleteDialogOpen(true)}
                      pageSize={pageSize}
                      pageSizeOptions={[5, 10, 20, 50]}
                      handleOnUpdateRows={handleOnUpdateRows}
                      onRowClick={(rowData) =>
                        handleProductSelect(rowData as Product)
                      }
                    />
                  )}
                </div>
              )}
            </div>
            {isFormVisible && (
              <div className='w-full xl:w-1/2 transition-all duration-300 ease-in-out'>
                <ProductForm
                  product={selectedProduct}
                  productImageUrl={selectedProductImageUrl}
                  onSubmit={handleFormSubmit}
                  onCancel={() => {
                    setIsFormVisible(false);
                    setSelectedProduct(undefined);
                    // Clear all image states
                    setSelectedProductImageUrl(null);
                  }}
                />
              </div>
            )}
          </div>
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
