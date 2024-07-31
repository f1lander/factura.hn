import React from 'react';
import { Control, Controller } from 'react-hook-form';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InvoiceFormData } from '@/components/molecules/InvoiceView2'; // You might need to adjust this import

interface CustomerFormFieldsProps {
    control: Control<InvoiceFormData>;
}

export const CustomerFormFields: React.FC<CustomerFormFieldsProps> = ({ control }) => {
    return (
        <>
            <div>
                <Label htmlFor="newCustomer.name">Nombre del Cliente</Label>
                <Controller
                    name="newCustomer.name"
                    control={control}
                    rules={{ required: 'El nombre es requerido' }}
                    render={({ field, fieldState: { error } }) => (
                        <>
                            <Input {...field} id="newCustomer.name" placeholder="Nombre del Cliente" />
                            {error && <p className="text-red-500">{error.message}</p>}
                        </>
                    )}
                />
            </div>
            <div>
                <Label htmlFor="newCustomer.rtn">RTN</Label>
                <Controller
                    name="newCustomer.rtn"
                    control={control}
                    rules={{ required: 'RTN es requerido' }}
                    render={({ field, fieldState: { error } }) => (
                        <>
                            <Input {...field} id="newCustomer.rtn" placeholder="RTN" />
                            {error && <p className="text-red-500">{error.message}</p>}
                        </>
                    )}
                />
            </div>
            <div>
                <Label htmlFor="newCustomer.email">Correo Electrónico</Label>
                <Controller
                    name="newCustomer.email"
                    control={control}
                    rules={{
                        required: 'El correo electrónico es requerido',
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Dirección de correo electrónico inválida'
                        }
                    }}
                    render={({ field, fieldState: { error } }) => (
                        <>
                            <Input {...field} id="newCustomer.email" type="email" placeholder="Correo Electrónico" />
                            {error && <p className="text-red-500">{error.message}</p>}
                        </>
                    )}
                />
            </div>
            <div className="flex items-center space-x-2">
                <Controller
                    name="newCustomer.shouldSave"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="newCustomer.shouldSave"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label htmlFor="newCustomer.shouldSave">Guardar como cliente</Label>
            </div>
        </>
    );
};