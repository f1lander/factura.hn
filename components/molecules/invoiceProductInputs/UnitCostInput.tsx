import { Controller } from "react-hook-form";
import InputProps from "./InputProps";
import { Input } from "@/components/ui/input";

const UnitCostInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.unit_cost`}
    control={control}
    render={({ field }) => (
      <Input
        type="number"
        {...field}
        onChange={(e) => {
          const unitCost = Number(e.target.value);
          if (unitCost < 0) return field.onChange(0);
          return field.onChange(unitCost);
        }}
        placeholder="Unit Cost"
        className="mt-2"
      />
    )}
  />
);

export default UnitCostInput;
