// components/CustomerForm.tsx
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Customer, Contact } from '@/lib/supabase/services/customer';

const defaultCustomer: Partial<Customer> = { contacts: [] };

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Partial<Customer>) => void;
  onCancel: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Customer>({
    defaultValues: customer || defaultCustomer,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const [isAddingContact, setIsAddingContact] = useState(false);
  const [expandedContact, setExpandedContact] = useState<number | null>(null);
  const [newContact, setNewContact] = useState<Contact>({
    name: '',
    position: '',
    email: '',
    phone: '',
  });

  const handleAddContact = () => {
    append(newContact);
    setNewContact({ name: '', position: '', email: '', phone: '' });
    setIsAddingContact(false);
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>
          {customer ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
        </CardTitle>
        <CardDescription>
          {customer
            ? 'Modifica los datos del cliente.'
            : 'Ingresa los datos del nuevo cliente.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className='space-y-4'>
          <div>
            <Label htmlFor='name'>Nombre</Label>
            <Input
              id='name'
              {...register('name', { required: 'El nombre es requerido' })}
            />
            {errors.name && (
              <p className='text-red-500 text-sm'>{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor='rtn'>RTN</Label>
            <Input
              id='rtn'
              {...register('rtn', { required: 'El RTN es requerido' })}
            />
            {errors.rtn && (
              <p className='text-red-500 text-sm'>{errors.rtn.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Dirección de email inválida',
                },
              })}
            />
            {errors.email && (
              <p className='text-red-500 text-sm'>{errors.email.message}</p>
            )}
          </div>

          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <Label className='text-lg font-semibold'>Contactos</Label>
              {!isAddingContact && (
                <Button type='button' onClick={() => setIsAddingContact(true)}>
                  Agregar Contacto
                </Button>
              )}
            </div>

            <div className='max-h-[400px] overflow-y-auto pr-2'>
              <div className='flex flex-col-reverse gap-4'>
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className='bg-white rounded-lg shadow-md p-4 space-y-3 border'
                  >
                    <div
                      className='flex justify-between items-center cursor-pointer'
                      onClick={() =>
                        setExpandedContact(
                          expandedContact === index ? null : index
                        )
                      }
                    >
                      <div className='flex flex-col'>
                        <span className='font-medium'>
                          {field.name || 'Sin nombre'}
                        </span>
                        <span className='text-sm text-gray-500'>
                          {field.position || 'Sin posición'}
                        </span>
                      </div>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                        {expandedContact === index ? '−' : '+'}
                      </Button>
                    </div>

                    {expandedContact === index ? (
                      <div className='space-y-3 pt-2'>
                        <div className='space-y-2'>
                          <Label htmlFor={`contacts.${index}.name`}>
                            Nombre
                          </Label>
                          <Input
                            {...register(`contacts.${index}.name` as const)}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor={`contacts.${index}.position`}>
                            Posición
                          </Label>
                          <Input
                            {...register(`contacts.${index}.position` as const)}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor={`contacts.${index}.email`}>
                            Email
                          </Label>
                          <Input
                            {...register(`contacts.${index}.email` as const)}
                          />
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor={`contacts.${index}.phone`}>
                            Teléfono
                          </Label>
                          <Input
                            {...register(`contacts.${index}.phone` as const)}
                          />
                        </div>
                        <div className='pt-2'>
                          <Button
                            type='button'
                            variant='destructive'
                            onClick={() => {
                              remove(index);
                              setExpandedContact(null);
                            }}
                            className='w-full'
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className='relative grid grid-cols-2 gap-2 text-sm pt-2'>
                        <div>
                          <span className='text-gray-500'>Email:</span>
                          <span className='ml-2'>
                            {field.email || 'No disponible'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>Teléfono:</span>
                          <span className='ml-2'>
                            {field.phone || 'No disponible'}
                          </span>
                        </div>
                        <div className='absolute right-0'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => {
                              remove(index);
                              setExpandedContact(null);
                            }}
                            className='h-8 w-8 text-destructive hover:text-destructive/90'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              viewBox='0 0 24 24'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              className='h-4 w-4'
                            >
                              <path d='M3 6h18' />
                              <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
                              <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {isAddingContact && (
                  <div className='bg-white rounded-lg shadow-md p-4 space-y-3 border border-primary'>
                    <div className='space-y-2'>
                      <Label htmlFor='new-contact-name'>Nombre</Label>
                      <Input
                        id='new-contact-name'
                        value={newContact.name}
                        onChange={(e) =>
                          setNewContact({ ...newContact, name: e.target.value })
                        }
                        placeholder='Nombre'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-contact-position'>Posición</Label>
                      <Input
                        id='new-contact-position'
                        value={newContact.position}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            position: e.target.value,
                          })
                        }
                        placeholder='Posición'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-contact-email'>Email</Label>
                      <Input
                        id='new-contact-email'
                        value={newContact.email}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            email: e.target.value,
                          })
                        }
                        placeholder='Email'
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='new-contact-phone'>Teléfono</Label>
                      <Input
                        id='new-contact-phone'
                        value={newContact.phone}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            phone: e.target.value,
                          })
                        }
                        placeholder='Teléfono'
                      />
                    </div>
                    <div className='pt-2'>
                      <Button
                        type='button'
                        onClick={handleAddContact}
                        className='w-full'
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancelar
          </Button>
          <Button type='submit'>
            {customer ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
