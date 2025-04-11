import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, TaxType } from "@/lib/supabase/services/product";
import Image from "next/image";
import { ImageIcon, Upload, Package } from "lucide-react";
import supabase from '@/lib/supabase/client';
import { getSignedLogoUrl } from "@/lib/utils";

interface ProductFormProps {
  product?: Product;
  productImageUrl?: string | null;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  productImageUrl,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<Product>({
    defaultValues: product || {
      is_service: false,
      quantity_in_stock: 0,
      tax_type: TaxType.GRAVADO_15, // Default to 15% tax
    },
  });

  const isService = watch("is_service");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Load the product image when component mounts
  useEffect(() => {
    const loadProductImage = async () => {
      if (product?.image_url) {
        setIsImageLoading(true);
        try {
          const imageUrl = await getSignedLogoUrl({ logoUrl: product.image_url, bucketName: 'products-bucket' });
          setProductImage(imageUrl);
        } catch (error) {
          console.error("Error loading product image:", error);
        } finally {
          setIsImageLoading(false);
        }
      }
    };

    loadProductImage();
  }, [product]);

  const handleImageUpload = async (productId: string, photoBase64: string): Promise<string | null> => {
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
          upsert: true, // Add this to update existing files
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProductImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmitForm = async (data: Product) => {
    // If it's a service, we don't need quantity_in_stock
    if (data.is_service) {
      delete data.quantity_in_stock;
    }

    // If we have a new image (base64 string starts with "data:image")
    if (productImage && productImage.startsWith('data:image')) {
      if (product?.id) {
        // For existing products, upload image immediately
        const imagePath = await handleImageUpload(product.id, productImage);
        if (imagePath) {
          data.image_url = imagePath;
        }
      } else {
        // For new products, save the base64 image to handle after product creation
        data.image_base64 = productImage;
      }
    }
    
    onSubmit(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product
            ? "Editar Producto/Servicio"
            : "Crear Nuevo Producto/Servicio"}
        </CardTitle>
        <CardDescription>
          {product
            ? `Estás editando ${product.is_service ? "el servicio" : "el producto"}: ${product.description}`
            : "Ingresa los detalles del nuevo producto o servicio"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          {/* Product Image Section */}
          <div className="space-y-2">
            <label htmlFor="product-image">Imagen del Producto</label>
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center bg-gray-50">
                {isImageLoading ? (
                  <div className="animate-pulse w-full h-full bg-gray-200"></div>
                ) : productImage ? (
                  <Image
                    src={productImage}
                    alt="Imagen del producto"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-100">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col space-y-2">
                <label 
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir imagen
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  JPG, PNG o GIF. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>

          {/* Rest of your form remains the same */}
          <div className="space-y-2">
            <label htmlFor="sku">SKU *</label>
            <Input
              id="sku"
              {...register("sku", { required: "SKU es requerido" })}
              placeholder="SKU"
            />
            {errors.sku && (
              <p className="text-red-500 text-sm">{errors.sku.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description">Descripción *</label>
            <Input
              id="description"
              {...register("description", {
                required: "Descripción es requerida",
              })}
              placeholder="Descripción"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="unit_cost">Precio Unitario *</label>
            <Input
              id="unit_cost"
              {...register("unit_cost", {
                valueAsNumber: true,
                required: "Precio Unitario es requerido",
                min: {
                  value: 0,
                  message: "El precio debe ser mayor o igual a 0",
                },
              })}
              type="number"
              step="0.01"
              placeholder="Precio Unitario"
            />
            {errors.unit_cost && (
              <p className="text-red-500 text-sm">{errors.unit_cost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="tax_type">Tipo de Impuesto *</label>
            <Controller
              name="tax_type"
              control={control}
              rules={{ required: "Tipo de impuesto es requerido" }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el tipo de impuesto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaxType.EXENTO}>0% (Exento)</SelectItem>
                    <SelectItem value={TaxType.EXONERADO}>0% (Exonerado)</SelectItem>
                    <SelectItem value={TaxType.GRAVADO_15}>15%</SelectItem>
                    <SelectItem value={TaxType.GRAVADO_18}>18%</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.tax_type && (
              <p className="text-red-500 text-sm">{errors.tax_type.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Controller
              name="is_service"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="is_service"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
            <label htmlFor="is_service">Es un Servicio</label>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button type="button" onClick={onCancel} variant="outline">
          Cancelar
        </Button>
        <Button type="submit" onClick={handleSubmit(onSubmitForm)}>
          {product ? "Actualizar" : "Crear"}{" "}
          {isService ? "Servicio" : "Producto"}
        </Button>
      </CardFooter>
    </Card>
  );
};
