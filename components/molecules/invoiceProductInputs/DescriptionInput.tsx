import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import InputProps from "./InputProps";

const DescriptionInput = ({ index, control }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.description`}
    control={control}
    render={({ field }) => (
      <Input {...field} placeholder="Descripción" className="mt-2" />
    )}
  />
);

export default DescriptionInput;
