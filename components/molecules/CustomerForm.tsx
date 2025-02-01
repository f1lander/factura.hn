// components/CustomerForm.tsx
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer, Contact } from '@/lib/supabase/services/customer';

const defaultCustomer: Partial<Customer> = { contacts: [] };

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, onCancel }) => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<Customer>({
    defaultValues: customer || defaultCustomer,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "contacts",
  });

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({ name: '', position: '', email: '', phone: '' });

  const handleAddContact = () => {
    append(newContact);
    setNewContact({ name: '', position: '', email: '', phone: '' });
    setIsAddingContact(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{customer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}</CardTitle>
        <CardDescription>
          {customer ? 'Modifica los datos del cliente.' : 'Ingresa los datos del nuevo cliente.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              {...register("name", { required: "El nombre es requerido" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rtn">RTN</Label>
            <Input
              id="rtn"
              {...register("rtn", { required: "El RTN es requerido" })}
            />
             {errors.rtn && (
              <p className="text-red-500 text-sm">{errors.rtn.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Dirección de email inválida"
                }
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label>Contactos</Label>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Posición</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input {...register(`contacts.${index}.name` as const)} />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`contacts.${index}.position` as const)} />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`contacts.${index}.email` as const)} />
                    </TableCell>
                    <TableCell>
                      <Input {...register(`contacts.${index}.phone` as const)} />
                    </TableCell>
                    <TableCell>
                      <Button type="button" variant="destructive" onClick={() => remove(index)}>Eliminar</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {isAddingContact && (
                  <TableRow>
                    <TableCell>
                      <Input
                        value={newContact.name}
                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                        placeholder="Nombre"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newContact.position}
                        onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                        placeholder="Posición"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newContact.email}
                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                        placeholder="Email"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={newContact.phone}
                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                        placeholder="Teléfono"
                      />
                    </TableCell>
                    <TableCell>
                      <Button type="button" onClick={handleAddContact}>Guardar</Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {!isAddingContact && (
              <Button type="button" onClick={() => setIsAddingContact(true)} className="mt-2">
                Agregar Contacto
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">{customer ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
        </CardFooter>
      </form>
    </Card>
  );
};