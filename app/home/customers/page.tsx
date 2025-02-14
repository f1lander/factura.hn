'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { customerService, Customer } from '@/lib/supabase/services/customer';
import { CustomerForm } from '@/components/molecules/CustomerForm';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { useToast } from '@/components/ui/use-toast';
import { PlusIcon, Trash2Icon, Users } from 'lucide-react';
import GenericEmptyState from '@/components/molecules/GenericEmptyState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '@/components/molecules/DataGrid';
import { customerColumns } from '@/utils/tableColumns';
import useUploadXls from '@/hooks/useUploadXls';
import { Input } from '@/components/ui/input';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CustomerKeyMappings {
  name: string;
  rtn: string;
  email: string;
  contacts: string;
}

export default function CustomersPage() {
  const excelFileInputRef = useRef<HTMLInputElement | null>(null);
  const triggerFileInput = () => {
    if (excelFileInputRef.current) {
      excelFileInputRef.current.click();
    }
  };
  const { control, handleSubmit } = useForm<CustomerKeyMappings>({
    defaultValues: {
      name: '',
      rtn: '',
      email: '',
      contacts: '',
    },
  });
  const {
    handleXlsFileUpload,
    xlsFile,
    fileName,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    isTablePreviewDialogOpen,
    setIsTablePreviewDialogOpen,
    tableFieldnames,
    areProductsLoading,
    setAreProductsLoading,
    setXlsFile,
  } = useUploadXls();
  const queryClient = useQueryClient();
  const { data: customers, isLoading: areCustomersLoading } = useQuery(
    ['customers'], // unique query key
    () => customerService.getCustomersByCompany(), // the function for fetching
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    }
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [editContacts, setEditContacts] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const { toast } = useToast();

  // side effect for tracking screen width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (areCustomersLoading) return <div>cargando clientes...</div>;

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormVisible(true);
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (
    data: Partial<Customer>,
    _selectedCustomer?: Customer
  ) => {
    const customer = _selectedCustomer || selectedCustomer;
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id!, data);
      } else {
        await customerService.createCustomer(data as Customer);
      }
      queryClient.invalidateQueries(['customers']);
      setIsFormVisible(false);
      toast({
        title: customer ? 'Cliente Actualizado' : 'Cliente Creado',
        description: 'El cliente se ha guardado exitosamente.',
      });
    } catch (err) {
      console.error('Error al guardar el cliente:', err);
      setError('No se pudo guardar el cliente. Por favor, intente de nuevo.');
      toast({
        title: 'Error',
        description:
          'No se pudo guardar el cliente. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedCustomer(null);
    setEditContacts(null);
  };

  const handleOnUpdateRows = async (updatedRows: Customer[]) => {
    const { success } = await customerService.updateMultipleCustomers(
      updatedRows
    );
    if (!success)
      toast({
        title: 'Actualización de clientes fallido',
        description: 'Revisa si algún dato que ingresaste fue inválido',
      });
    toast({
      title: 'Actualización de clientes exitosa',
      description: 'Tus clientes se han actualizado en la base de datos',
    });
  };

  const handleCheckboxChange = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(
        customers!
          .filter((item) => !item.is_universal)
          .map((customer) => customer.id!)
      );
    } else {
      setSelectedCustomers([]);
    }
  };

  // const handleDeleteClick = () => {
  //   if (selectedCustomers.length > 0) {
  //     setIsDeleteDialogOpen(true);
  //   }
  // };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(
        selectedCustomers.map((id) => customerService.deleteCustomer(id))
      );
      queryClient.invalidateQueries(['customers']);
      setSelectedCustomers([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: 'Clientes Eliminados',
        description:
          'Los clientes seleccionados han sido eliminados exitosamente.',
      });
    } catch (err) {
      console.error('Error al eliminar clientes:', err);
      toast({
        title: 'Error',
        description:
          'No se pudieron eliminar los clientes. Por favor, intente de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit: SubmitHandler<CustomerKeyMappings> = async (data) => {
    setAreProductsLoading(true);
    if (!xlsFile) {
      setAreProductsLoading(false);
      return alert('No se ha subido ningún archivo de Excel');
    }
    const transformedRows = xlsFile.map((row) => {
      const newRow: Record<string, any> = {};
      for (const [newKey, oldKey] of Object.entries(data)) {
        newRow[newKey] = row[oldKey];
      }
      return newRow;
    });
    const { success, message } = await customerService.createMultipleCustomers(
      transformedRows
    );
    if (!success) {
      toast({
        title: 'No se pudieron subir los clientes',
        description: message,
      });
      return setAreProductsLoading(false);
    }
    toast({ title: 'Carga de clientes exitosa', description: message });
    setIsAddProductsWithSpreadsheetDialogOpen(false);
    setXlsFile(null);
    setAreProductsLoading(false);
  };

  if (error) {
    return <div className='p-12'>Error: {error}</div>;
  }
  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col sm:gap-4 p-2 sm:p-4'>
        <main className='flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
          <div
            className={`w-full xl:w-full transition-all duration-300 ease-in-out`}
          >
            {customers!.length === 0 ? (
              <GenericEmptyState
                icon={Users}
                title='No tienes clientes aún'
                description='Comienza agregando tus clientes para empezar a facturar'
                buttonText='Agregar Cliente'
                onAction={handleCreateCustomer}
              />
            ) : (
              <>
                <DataGrid
                  title='Clientes'
                  description='Gestiona tus clientes aquí'
                  data={customers!}
                  columnDefs={customerColumns}
                  onCreateNew={handleCreateCustomer}
                  onDelete={() => setIsDeleteDialogOpen(true)}
                  handleOnUpdateRows={handleOnUpdateRows}
                  pageSize={10}
                  pageSizeOptions={[5, 10, 20, 50]}
                  searchPlaceholder='Buscar clientes...'
                  onAddExcelSpreadSheet={triggerFileInput}
                  context={{
                    onEditContact: (data: Customer) => {
                      setEditContacts(data);
                    },
                  }}
                />
              </>
            )}
          </div>
          {editContacts && (
            <div className='w-full xl:w-1/2 transition-all duration-300 ease-in-out'>
              <CustomerForm
                key={editContacts.id}
                customer={editContacts}
                onSubmit={(data) => handleFormSubmit(data, editContacts)}
                onCancel={handleFormCancel}
              />
            </div>
          )}
          {isFormVisible &&
            (windowWidth >= 1280 ? (
              <div className='w-full xl:w-1/2 transition-all duration-300 ease-in-out'>
                <CustomerForm
                  customer={selectedCustomer || undefined}
                  onSubmit={(data) => handleFormSubmit(data)}
                  onCancel={handleFormCancel}
                />
              </div>
            ) : (
              <Dialog open={isFormVisible} onOpenChange={setIsFormVisible}>
                <DialogTrigger asChild></DialogTrigger>
                <DialogContent
                  className='w-[90%]'
                  id='contenido del dialogo papa'
                >
                  <div className='transition-all duration-300 ease-in-out'>
                    <CustomerForm
                      customer={selectedCustomer || undefined}
                      onSubmit={(data) => handleFormSubmit(data)}
                      onCancel={handleFormCancel}
                    />
                  </div>
                </DialogContent>
                <DialogClose asChild></DialogClose>
              </Dialog>
            ))}
        </main>
        <Input
          id='xls'
          name='xls'
          type='file'
          accept='.xlsx,.xls,.csv'
          className='hidden'
          onChange={handleXlsFileUpload}
          ref={excelFileInputRef}
        />
        {xlsFile && (
          <div className='flex gap-3 mt-2 w-[60%] mx-auto border-2 border-gray-300 rounded p-5 justify-around items-center'>
            <div className='flex flex-col gap-3'>
              <h2 className='text-lg font-medium'>Nombre de archivo subido:</h2>
              <span>{fileName}</span>
              <label
                htmlFor='xls'
                className='bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-fit cursor-pointer rounded'
              >
                cambiar archivo
              </label>
              <Input
                id='xls'
                name='xls'
                type='file'
                accept='.xlsx,.xls,.csv'
                className='hidden'
                onChange={handleXlsFileUpload}
              />
            </div>
            <div className='flex flex-col gap-4'>
              <Button onClick={() => setIsTablePreviewDialogOpen(true)}>
                Previsualizar tabla
              </Button>
              <Button
                onClick={() => setIsAddProductsWithSpreadsheetDialogOpen(true)}
              >
                Subir tabla de productos
              </Button>
            </div>
          </div>
        )}
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar{' '}
              {selectedCustomers.length === 1
                ? 'el cliente seleccionado'
                : `los ${selectedCustomers.length} clientes seleccionados`}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant='destructive' onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isAddProductsWithSpreadsheetDialogOpen}
        onOpenChange={setIsAddProductsWithSpreadsheetDialogOpen}
      >
        <DialogContent className='w-3/5 flex flex-col gap-5'>
          <h1 className='text-2xl font-medium'>Mapeo de columnas</h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='flex flex-col gap-3'
          >
            <div className='flex justify-between'>
              <span>Nombre</span>
              <Controller
                control={control}
                name='name'
                render={({ field }) => {
                  if (
                    tableFieldnames.includes('Nombre') &&
                    field.value === ''
                  ) {
                    field.onChange('Nombre'); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes('Nombre')
                          ? 'Nombre'
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-fit'>
                        <SelectValue placeholder='Selecciona una columna' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className='flex justify-between'>
              <span>RTN</span>
              <Controller
                control={control}
                name='rtn'
                render={({ field }) => {
                  if (tableFieldnames.includes('RTN') && field.value === '') {
                    field.onChange('RTN'); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes('RTN') ? 'RTN' : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-fit'>
                        <SelectValue placeholder='Selecciona una columna' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className='flex justify-between'>
              <span>Email</span>
              <Controller
                control={control}
                name='email'
                render={({ field }) => {
                  if (tableFieldnames.includes('Email') && field.value === '') {
                    field.onChange('Email'); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes('Email')
                          ? 'Email'
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-fit'>
                        <SelectValue placeholder='Selecciona una columna' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            <div className='flex justify-between'>
              <span>Tipo</span>
              <Controller
                control={control}
                name='contacts'
                render={({ field }) => {
                  if (
                    tableFieldnames.includes('Contactos') &&
                    field.value === ''
                  ) {
                    field.onChange('Contactos'); // Update the form state
                  }
                  return (
                    <Select
                      defaultValue={
                        tableFieldnames.includes('Contactos')
                          ? 'Contactos'
                          : field.value
                      }
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className='w-fit'>
                        <SelectValue placeholder='Selecciona una columna' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Columnas</SelectLabel>
                          {tableFieldnames.map((fieldName, index) => (
                            <SelectItem key={index} value={fieldName}>
                              {fieldName}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            </div>
            {/* <Button type="submit" disabled={areProductsLoading}>Subir productos</Button> */}
            <Button type='submit' disabled={areProductsLoading}>
              {areProductsLoading ? 'Subiendo clientes...' : 'Subir clientes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
