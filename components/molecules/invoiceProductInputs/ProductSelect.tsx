import { Product } from "@/lib/supabase/services/product";
import { Controller, Control, UseFormSetValue } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Invoice } from "@/lib/supabase/services/invoice";

const ProductSelect = ({
  index,
  products,
  control,
  setValue,
}: {
  index: number;
  products: Product[];
  control: Control<Invoice, any>;
  setValue: UseFormSetValue<Invoice>;
}) => (
  <Controller
    name={`invoice_items.${index}.product_id`}
    control={control}
    rules={{ required: "Debes agregar un producto" }}
    render={({ field }) => (
      <Select
        onValueChange={(value) => {
          field.onChange(value);
          const selectedProduct = products.find((p) => p.id === value);
          if (selectedProduct) {
            setValue(
              `invoice_items.${index}.unit_cost`,
              selectedProduct.unit_cost,
            );
            setValue(
              `invoice_items.${index}.description`,
              selectedProduct.description,
            );
          }
        }}
        value={field.value}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleccione producto" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  />
);
export default ProductSelect;
