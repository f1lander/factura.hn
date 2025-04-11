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
import {
  Check,
  X,
  Trash2,
  Plus,
  Minus,
  Save,
  ListCollapse,
  ListEnd,
} from 'lucide-react';
import { Close } from '@radix-ui/react-toast';

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
    <Card className='w-full border-none shadow-none'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader className='relative flex flex-row items-center justify-between space-y-0 p-0 md:p-6'>
          <div className='hidden md:flex flex-1 flex-col gap-2'>
            <CardTitle>
              {customer?.is_universal
                ? 'Cliente Universal'
                : customer
                ? 'Editar Cliente'
                : 'Crear Nuevo Cliente'}
            </CardTitle>
            <CardDescription>
              {customer?.is_universal
                ? 'Este es un cliente universal y no puede ser modificado.'
                : customer
                ? 'Modifica los datos del cliente.'
                : 'Ingresa los datos del nuevo cliente.'}
            </CardDescription>
          </div>
          <div className='flex flex-1 w-full justify-end gap-2 px-2'>
            {!customer?.is_universal && (
              <Button
                variant='save'
                type='submit'
                size='icon'
                className='h-8 w-auto p-2'
              >
                <Save className='h-4 w-4 mr-2' />
                Guardar
              </Button>
            )}
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              size='icon'
              className='hidden md:flex absolute top-0 left-0 h-8 w-8 -translate-x-1/2 -translate-y-1/2'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-2 p-0 md:p-6 md:space-y-3'>
          <div>
            <Label htmlFor='name'>Nombre</Label>
            <Input
              id='name'
              disabled={customer?.is_universal}
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
              disabled={customer?.is_universal}
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
              disabled={customer?.is_universal}
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
          {!customer?.is_universal && (
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <Label className='text-lg font-semibold'>Contactos</Label>
                {!isAddingContact && (
                  <Button
                    variant='add'
                    type='button'
                    onClick={() => setIsAddingContact(true)}
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Nuevo
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
                      <div className='flex justify-between items-center cursor-pointer'>
                        <div className='flex flex-col'>
                          <span className='font-medium'>
                            {field.name || 'Sin nombre'}
                          </span>
                          <span className='text-sm text-gray-500'>
                            {field.position || 'Sin posición'}
                          </span>
                        </div>
                        <div className='flex items-center gap-1'>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(index);
                              setExpandedContact(null);
                            }}
                            className='h-8 w-8 text-destructive hover:text-destructive/90'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                            type='button'
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedContact(
                                expandedContact === index ? null : index
                              );
                            }}
                          >
                            {expandedContact === index ? (
                              <ListCollapse className='h-4 w-4' />
                            ) : (
                              <ListEnd className='h-4 w-4' />
                            )}
                          </Button>
                        </div>
                      </div>

                      {expandedContact === index ? (
                        <div className='space-y-2 pt-2'>
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
                              {...register(
                                `contacts.${index}.position` as const
                              )}
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
                              variant='delete'
                              onClick={() => {
                                remove(index);
                                setExpandedContact(null);
                              }}
                              className='w-full'
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className='relative grid grid-cols-2 gap-2 text-sm pt-2'>
                          <div className='flex flex-row'>
                            <span className='text-gray-500'>Email:</span>
                            <a
                              href={`mailto:${field.email}`}
                              className='ml-2 truncate hover:underline'
                              title={field.email}
                            >
                              {field.email || 'No disponible'}
                            </a>
                          </div>
                          <div className='flex flex-row'>
                            <span className='text-gray-500'>Teléfono:</span>
                            <a
                              href={`tel:${field.phone}`}
                              className='ml-2 truncate hover:underline'
                              title={field.phone}
                            >
                              {field.phone || 'No disponible'}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isAddingContact && (
                    <div className='bg-white rounded-lg shadow-md p-2 space-y-2 border border-primary'>
                      <div className='space-y-2'>
                        <Label htmlFor='new-contact-name'>Nombre</Label>
                        <Input
                          id='new-contact-name'
                          value={newContact.name}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              name: e.target.value,
                            })
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
                          type='email'
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
                          variant='default'
                          onClick={handleAddContact}
                          className='w-full'
                        >
                          <Plus className='h-4 w-4 mr-2' />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </form>
    </Card>
  );
};
