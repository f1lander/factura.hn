import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";

const QuantityInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.quantity`}
    control={control}
    rules={{ min: 1 }}
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        onChange={(e) => {
          const productAmount = Number(e.target.value);
          if (productAmount < 1) return field.onChange(1);
          return field.onChange(productAmount);
        }}
        placeholder="Quantity"
        className="mt-2"
      />
    )}
  />
);

export default QuantityInput;
