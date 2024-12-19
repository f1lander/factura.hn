import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";
import preventMinusAndDecimals from "@/utils/preventMinusAndDecimals";
import preventMinus from "@/utils/preventMinus";

const DiscountInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.discount`}
    control={control}
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        placeholder="Discount"
        className="mt-2"
        onKeyDown={preventMinus}
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

export default DiscountInput;
