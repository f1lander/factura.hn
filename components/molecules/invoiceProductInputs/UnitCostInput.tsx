import { Controller } from 'react-hook-form';
import InputProps from './InputProps';
import { Input } from '@/components/ui/input';
import preventMinus from '@/utils/preventMinus';

const UnitCostInput = ({ index, control, className }: InputProps) => (
  <Controller
    name={`invoice_items.${index}.unit_cost`}
    control={control}
    render={({ field }) => (
      <Input
        type='decimal'
        {...field}
        min={0}
        placeholder='Unit Cost'
        className={className ?? 'mt-2'}
        onKeyDown={preventMinus}
        onInput={(e: React.FormEvent<HTMLInputElement>) => {
          const target = e.currentTarget;
          const value = target.value;

          // Allow only valid numeric values and remove leading zeros
          const sanitizedValue = value.replace(/^0+(?=\d)|[^\d.]/g, '');

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
export default UnitCostInput;
