import { Invoice } from '@/lib/supabase/services/invoice';
import { Control } from 'react-hook-form';

type InputProps = {
  index: number;
  control: Control<Invoice>;
  className?: string;
};

export default InputProps;
