import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";
import preventMinusAndDecimals from "@/utils/preventMinusAndDecimals";

const QuantityInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.quantity`}
    control={control}
    rules={{ min: 1 }}
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        placeholder="Quantity"
        className="mt-2"
        onKeyDown={preventMinusAndDecimals}
        onInput={(e: React.FormEvent<HTMLInputElement>) => {
          const target = e.currentTarget;
          const value = target.value;

          // Allow only valid numeric values and remove leading zeros
          const sanitizedValue = value.replace(/^0+(?=\d)|[^\d.]/g, "");

          if (value !== sanitizedValue) {
            target.value = sanitizedValue;
            field.onChange(sanitizedValue);
          } else {
            field.onChange(value);
          }
        }}
      />
    )}
  />
);

export default QuantityInput;
