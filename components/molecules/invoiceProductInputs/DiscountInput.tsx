import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";

const DiscountInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.discount`}
    control={control}
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        onChange={(e) => field.onChange(Number(e.target.value))}
        placeholder="Discount"
        className="mt-2"
      />
    )}
  />
);

export default DiscountInput;
