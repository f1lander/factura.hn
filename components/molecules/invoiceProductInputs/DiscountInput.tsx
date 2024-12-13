import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";
import preventMinusAndDecimals from "@/utils/preventMinusAndDecimals";

const DiscountInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.discount`}
    control={control}
    render={({ field }) => (
      <Input
        max={100}
        min={0}
        type="number"
        {...field}
        placeholder="Discount"
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
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          const target = e.currentTarget;
          const value = parseFloat(target.value);

          // Truncate the value to 100 if it's greater than 100
          if (!isNaN(value) && value > 100) {
            target.value = "100";
            field.onChange(100);
          }
        }}
      />
    )}
  />
);

export default DiscountInput;
