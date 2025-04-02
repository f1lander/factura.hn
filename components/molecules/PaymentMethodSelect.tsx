import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PaymentMethod,
  paymentMethodService,
} from '@/lib/supabase/services/paymentMethod';
import * as R from 'ramda';
import { X, CreditCard, Wallet, Building2, Receipt, Coins } from 'lucide-react';

interface PaymentMethodSelectProps {
  companyId: string;
  value: PaymentMethod | null;
  onChange: (value?: PaymentMethod) => void;
  // onChange: (value: string) => void;
}

const getPaymentMethodIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('tarjeta') || lowerName.includes('card')) {
    return <CreditCard className="h-4 w-4 mr-2" />;
  }
  if (lowerName.includes('efectivo') || lowerName.includes('cash')) {
    return <Coins className="h-4 w-4 mr-2" />;
  }
  if (lowerName.includes('transferencia') || lowerName.includes('bank')) {
    return <Building2 className="h-4 w-4 mr-2" />;
  }
  if (lowerName.includes('cheque')) {
    return <Receipt className="h-4 w-4 mr-2" />;
  }
  return <Wallet className="h-4 w-4 mr-2" />;
};

export function PaymentMethodSelect({
  companyId,
  value,
  onChange,
}: PaymentMethodSelectProps) {
  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods', companyId],
    queryFn: () => paymentMethodService.getAllPaymentMethods(companyId),
  });

  if (isLoading) {
    return <div>Loading payment methods...</div>;
  }

  const selectedMethod = methods.find((m) => m.id === value?.id) || null;

  const defaultMethods = methods.filter((m) => m.is_default);
  const companyMethods = methods.filter((m) => !m.is_default);

  R.ifElse(
    R.equals(selectedMethod),
    () => {},
    () => {
      selectedMethod && companyMethods.push(selectedMethod);
    }
  )(value);

  return (
    <div className='relative flex align-center'>
      {selectedMethod && (
        <X
          className='cursor-pointer absolute z-10 text-gray-400 right-0 top-1/2 -translate-y-1/2'
          onClick={() => onChange()}
        />
      )}
      <Select
        value={selectedMethod?.id}
        onValueChange={(id) => onChange(methods.find((m) => m.id === id))}
      >
        <SelectTrigger>
          <SelectValue placeholder='Seleccionar método de pago'>
            {selectedMethod && (
              <div className="flex items-center">
                {getPaymentMethodIcon(selectedMethod.name)}
                {selectedMethod.name}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {defaultMethods.length > 0 && (
            <>
              <SelectItem value='default-methods' disabled>
                Métodos Predeterminados
              </SelectItem>
              {defaultMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(method.name)}
                    {method.name}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
          {companyMethods.length > 0 && (
            <>
              <SelectItem value='company-methods' disabled>
                Métodos de la Empresa
              </SelectItem>
              {companyMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center">
                    {getPaymentMethodIcon(method.name)}
                    {method.name}
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
