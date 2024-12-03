import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";

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
        onChange={(e) => {
          const discount = Number(e.target.value);
          if (discount < 0) return field.onChange(0);
          return field.onChange(discount);
        }}
        placeholder="Discount"
        className="mt-2"
      />
    )}
  />
);

export default DiscountInput;
