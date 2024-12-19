import { Product, productService } from "@/lib/supabase/services/product";
import { Controller, Control, UseFormSetValue } from "react-hook-form";
import AsyncSelect from "react-select/async";
import { Invoice } from "@/lib/supabase/services/invoice";
// import { set } from "date-fns";

const loadOptions = async (inputValue: string) => {
  if (!inputValue) return [];
  const retrievedProducts =
    await productService.searchProductsByCompany(inputValue);
  return retrievedProducts.map((retrievedProduct) => ({
    value: retrievedProduct.id,
    label: retrievedProduct.description,
    ...retrievedProduct,
  }));
};

const noOptionsMessage = (inputValue: { inputValue: string }) => {
  return inputValue.inputValue
    ? "No se encontraron productos"
    : "Escribe algo para buscar un producto";
};

const ProductSelect = ({
  index,
  // products,
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
      <AsyncSelect
        className="w-full"
        loadOptions={loadOptions}
        noOptionsMessage={noOptionsMessage}
        placeholder="Buscar un producto"
        onChange={(value) => {
          if (value !== null) {
            setValue(`invoice_items.${index}.unit_cost`, value.unit_cost);
            setValue(`invoice_items.${index}.description`, value.description);
          }
          field.onChange(value?.id);
        }}
      />
      // <Select
      //   onValueChange={(value) => {
      //     field.onChange(value);
      //     const selectedProduct = products.find((p) => p.id === value);
      //     if (selectedProduct) {
      //       setValue(
      //         `invoice_items.${index}.unit_cost`,
      //         selectedProduct.unit_cost,
      //       );
      //       setValue(
      //         `invoice_items.${index}.description`,
      //         selectedProduct.description,
      //       );
      //     }
      //   }}
      //   value={field.value}
      // >
      //   <SelectTrigger>
      //     <SelectValue
      //       placeholder="Seleccione producto"
      //       className="w-6 overflow-hidden"
      //     />
      //   </SelectTrigger>
      //   <SelectContent>
      //     {products.map((product) => (
      //       <SelectItem key={product.id} value={product.id}>
      //         {product.description}
      //       </SelectItem>
      //     ))}
      //   </SelectContent>
      // </Select>
    )}
  />
);
export default ProductSelect;
