import React from "react";
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
import { Product } from "@/lib/supabase/services/product";

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
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
    },
  });

  const isService = watch("is_service");

  const onSubmitForm = (data: Product) => {
    // If it's a service, we don't need quantity_in_stock
    if (data.is_service) {
      delete data.quantity_in_stock;
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
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
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

          {/* <div className="space-y-2">
            <label htmlFor="quantity_in_stock">
              Cantidad en Stock {!isService && "*"}
            </label>
            <Input
              id="quantity_in_stock"
              {...register("quantity_in_stock", {
                valueAsNumber: true,
                required: !isService
                  ? "Cantidad en Stock es requerida para productos"
                  : false,
                min: {
                  value: 0,
                  message: "La cantidad debe ser mayor o igual a 0",
                },
                validate: (value) =>
                  isService ||
                  !!value ||
                  "La cantidad debe ser mayor que 0 para productos",
              })}
              type="number"
              placeholder="Cantidad en Stock"
              disabled={isService}
            />
            {errors.quantity_in_stock && (
              <p className="text-red-500 text-sm">
                {errors.quantity_in_stock.message}
              </p>
            )}
          </div> */}
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
