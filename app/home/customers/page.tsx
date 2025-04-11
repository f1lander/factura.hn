'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { customerService, Customer } from '@/lib/supabase/services/customer';
import { CustomerForm } from '@/components/molecules/CustomerForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Users,
  FileSpreadsheet,
  PlusIcon,
  Trash2Icon,
  SearchIcon,
  X,
  UserIcon,
} from 'lucide-react';
import GenericEmptyState from '@/components/molecules/GenericEmptyState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '@/components/molecules/DataGrid';
import { customerColumns } from '@/utils/tableColumns';
import useUploadXls from '@/hooks/useUploadXls';
import { CustomerImportStepper } from '@/components/organisms/customers/CustomerImportStepper';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomerKeyMappings {
  name: string;
  rtn: string;
  email: string;
  contacts: string;
}

export default function CustomersPage() {
  const {
    handleXlsFileUpload,
    fileName,
    isAddProductsWithSpreadsheetDialogOpen,
    setIsAddProductsWithSpreadsheetDialogOpen,
    setXlsFile,
    getCurrentSheeData,
    getCurrentSheetFieldNames,
    setCurrentSheet,
    currentSheet,
    sheets,
    sheetNames,
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [editContacts, setEditContacts] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const isMobile = useIsMobile();

  // Add filter function for customers
  const filteredCustomers = useMemo(() => {
    if (!customers || !searchQuery.trim()) return customers;

    const query = searchQuery.toLowerCase().trim();
    return customers.filter(
      (customer) =>
        customer.name?.toLowerCase().includes(query) ||
        customer.rtn?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  if (areCustomersLoading)
    return (
      <div className='w-full p-4 space-y-6'>
        {/* Skeleton for DataGrid header */}
        <div className='flex flex-col md:flex-row justify-between items-center mb-4'>
          <div>
            <div className='h-6 w-48 bg-gray-200 animate-pulse rounded-md mb-2'></div>
            <div className='h-4 w-72 bg-gray-200 animate-pulse rounded-md'></div>
          </div>
          <div className='flex gap-2 mt-4 md:mt-0'>
            <div className='h-10 w-32 bg-gray-200 animate-pulse rounded-md'></div>
          </div>
        </div>

        {/* Skeleton for search bar */}
        <div className='flex items-center mb-6'>
          <div className='h-9 w-full md:w-1/3 bg-gray-200 animate-pulse rounded-md'></div>
        </div>

        {/* Skeleton for DataGrid */}
        <div className='h-[500px] w-full bg-white rounded-md overflow-hidden'>
          {/* Skeleton for table header */}
          <div className='h-12 bg-gray-100 flex border-b'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='flex-1 p-2'>
                <div className='h-6 bg-gray-200 animate-pulse rounded-md'></div>
              </div>
            ))}
          </div>

          {/* Skeleton for table rows */}
          {[...Array(10)].map((_, i) => (
            <div key={i} className='flex h-12 border-b hover:bg-gray-50'>
              {[...Array(5)].map((_, j) => (
                <div key={j} className='flex-1 p-2'>
                  <div className='h-5 bg-gray-200 animate-pulse rounded-md'></div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Skeleton for pagination */}
        <div className='flex justify-end mt-4'>
          <div className='h-8 w-64 bg-gray-200 animate-pulse rounded-md'></div>
        </div>
      </div>
    );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);

    // Use drawer for mobile, form view for desktop
    if (isMobile) {
      setIsDrawerOpen(true);
    } else {
      setIsFormVisible(true);
    }
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setEditContacts(null);

    // Use drawer for mobile, form view for desktop
    if (isMobile) {
      setIsDrawerOpen(true);
    } else {
      setIsFormVisible(true);
    }
  };

  const handleFormSubmit = async (data: Partial<Customer>) => {
    const customer = selectedCustomer || editContacts;

    try {
      if (customer) {
        await customerService.updateCustomer(customer.id!, data);
      } else {
        await customerService.createCustomer(data as Customer);
      }
      queryClient.invalidateQueries(['customers']);

      // Close the appropriate UI component based on screen size
      if (isMobile) {
        setIsDrawerOpen(false);
      } else {
        setIsFormVisible(false);
      }

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
    // Close the appropriate UI component based on screen size
    if (isMobile) {
      setIsDrawerOpen(false);
    } else {
      setIsFormVisible(false);
    }

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

  const handleDeleteClick = () => {
    if (selectedCustomers.length > 0) {
      setIsDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await customerService.archiveCustomers(selectedCustomers);
      // await Promise.all(
      //   selectedCustomers.map((id) => customerService.deleteCustomer(id))
      // );
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

  if (error) {
    return <div className='p-12'>Error: {error}</div>;
  }

  if (isAddProductsWithSpreadsheetDialogOpen) {
    return (
      <CustomerImportStepper
        onCancel={() => {
          setIsAddProductsWithSpreadsheetDialogOpen(false);
          setXlsFile(null);
        }}
        onComplete={async (mappedData) => {
          const { success, message } =
            await customerService.createMultipleCustomers(mappedData);
          if (!success) {
            toast({
              title: 'No se pudieron subir los clientes',
              description: message,
            });
            return;
          }
          toast({ title: 'Carga de clientes exitosa', description: message });
          queryClient.invalidateQueries(['customers']);
          setIsAddProductsWithSpreadsheetDialogOpen(false);
          setXlsFile(null);
        }}
        xlsFile={getCurrentSheeData()}
        fileName={fileName}
        tableFieldnames={getCurrentSheetFieldNames()}
        sheetNames={sheetNames}
        handleXlsFileUpload={handleXlsFileUpload}
        setCurrentSheet={setCurrentSheet}
        currentSheet={currentSheet}
        sheets={sheets}
        // requiredFields={['name', 'rtn']}
        fieldMappings={[
          { label: 'Nombre', value: 'name' },
          { label: 'RTN', value: 'rtn' },
          { label: 'Email', value: 'email' },
          // { label: 'Contactos', value: 'contacts' },
        ]}
      />
    );
  }

  return (
    <div className='flex min-h-screen w-full flex-col bg-muted/40'>
      <div className='flex flex-col sm:gap-4 p-2 sm:p-4'>
        {/* Header section with buttons outside DataGrid */}
        <div className='bg-white hidden md:block rounded-lg shadow p-4 mb-4'>
          <div className='flex flex-col items-centerspace-y-3 sm:flex-row sm:justify-between sm:space-y-0 sm:space-x-4 mb-4'>
            <p className='text-sm font-medium md:text-lg md:font-semibold'>
              Gestiona y organiza tus clientes
            </p>

            <div className='flex flex-col sm:flex-row gap-2'>
              <Button
                onClick={() => setIsAddProductsWithSpreadsheetDialogOpen(true)}
                variant='outline'
                className='flex gap-2 items-center border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700'
              >
                <FileSpreadsheet className='h-4 w-4' />
                <span className='hidden sm:inline'>Añadir desde Excel</span>
                <span className='sm:hidden'>Excel</span>
              </Button>
              <Button
                onClick={handleCreateCustomer}
                variant='outline'
                className='border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center'
              >
                <PlusIcon className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>Nuevo Cliente</span>
                <span className='sm:hidden'>Nuevo</span>
              </Button>
              {selectedCustomers.length > 0 && (
                <Button
                  onClick={handleDeleteClick}
                  variant='outline'
                  className='border-red-600 text-gray-900 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
                >
                  <Trash2Icon className='h-4 w-4 mr-2' />
                  <span className='hidden sm:inline'>
                    Eliminar{' '}
                    {selectedCustomers.length > 1
                      ? `(${selectedCustomers.length})`
                      : ''}
                  </span>
                  <span className='sm:hidden'>Eliminar</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main content area - Restore the original desktop layout with inline form */}
        <main className='flex flex-col-reverse xl:flex-row items-start gap-4 p-0 sm:px-0 md:gap-8'>
          <div
            className={`w-full ${
              (isFormVisible || editContacts) && !isMobile
                ? 'xl:w-1/2'
                : 'xl:w-full'
            } transition-all duration-300 ease-in-out`}
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
              <div className='bg-white rounded-lg border shadow-sm'>
                {isMobile ? (
                  <div className='flex flex-col'>
                    {/* Mobile Header with count */}
                    <div className='md:hidden p-4 border-b flex gap-2 justify-between items-center'>
                      {customers && (
                        <p className='text-sm text-muted-foreground font-medium'>
                          Total ({filteredCustomers?.length || 0})
                        </p>
                      )}
                      <div className='flex gap-2 items-center'>
                        <Button
                          onClick={() =>
                            setIsAddProductsWithSpreadsheetDialogOpen(true)
                          }
                          variant='outline'
                          className='flex gap-1 items-center border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700 px-2 py-1'
                        >
                          <FileSpreadsheet className='h-4 w-4' />
                          <span className='hidden sm:inline'>
                            Añadir desde Excel
                          </span>
                          <span className='sm:hidden'>Excel</span>
                        </Button>
                        <Button
                          onClick={handleCreateCustomer}
                          variant='outline'
                          className='border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center px-2 py-1'
                        >
                          <PlusIcon className='h-4 w-4 mr-1' />
                          <span className='hidden sm:inline'>
                            Nuevo Cliente
                          </span>
                          <span className='sm:hidden'>Nuevo</span>
                        </Button>
                      </div>
                    </div>

                    {/* Add search input for mobile */}
                    <div className='px-4 py-2 border-b'>
                      <div className='relative'>
                        <SearchIcon className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                        <input
                          type='text'
                          placeholder='Buscar clientes...'
                          className='w-full h-10 pl-8 pr-4 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                          value={searchQuery}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearchQuery(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    {/* Mobile Customer List with filtering applied */}
                    <div className='flex flex-col divide-y'>
                      {filteredCustomers && filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className='p-4 flex items-center gap-3 relative h-[114px]'
                          >
                            <div
                              className='flex items-center gap-3 flex-grow hover:bg-muted/20 cursor-pointer w-full'
                              onClick={() => handleCustomerSelect(customer)}
                            >
                              <div className='flex-shrink-0 w-12 h-12 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center'>
                                <UserIcon className='h-6 w-6 text-gray-400' />
                              </div>

                              <div className='flex-grow pr-10 overflow-hidden flex flex-col'>
                                <div className='font-medium line-clamp-2'>
                                  {customer.name}
                                </div>
                                {customer.rtn && (
                                  <div className='text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis'>
                                    RTN: {customer.rtn}
                                  </div>
                                )}
                                {customer.email && (
                                  <div className='text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis'>
                                    {customer.email}
                                  </div>
                                )}
                              </div>
                            </div>

                            {!customer.is_universal && (
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8 absolute right-3 top-1/2 transform -translate-y-1/2 text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomers([customer.id!]);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2Icon className='h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className='p-8 text-center'>
                          <p className='text-gray-500'>
                            No se encontraron clientes con tu búsqueda
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <DataGrid
                    title=''
                    description=''
                    data={filteredCustomers || []}
                    columnDefs={customerColumns}
                    onRowClick={handleCustomerSelect}
                    onSelectionChange={setSelectedCustomers}
                    canSelect={(rowItem) => !rowItem.is_universal}
                    handleOnUpdateRows={handleOnUpdateRows}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 20, 50]}
                    context={{
                      onEditContact: (data: Customer) => {
                        setEditContacts(data);
                      },
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Show form inline only on desktop */}
          {(isFormVisible || editContacts) && !isMobile && (
            <div className='w-full xl:w-1/2 transition-all duration-300 ease-in-out'>
              <CustomerForm
                key={selectedCustomer?.id || editContacts?.id || ''}
                customer={selectedCustomer || editContacts || undefined}
                onSubmit={(data) => handleFormSubmit(data)}
                onCancel={handleFormCancel}
              />
            </div>
          )}
        </main>
      </div>

      {/* Drawer for Customer Form - only for mobile */}
      <Drawer open={isDrawerOpen && isMobile} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className='mx-auto w-full max-w-4xl'>
            <DrawerHeader className='relative py-4'>
              <div className='pr-8'>
                <DrawerTitle>
                  {/* {selectedCustomer || editContacts ? 'Editar Cliente' : 'Nuevo Cliente'} */}
                  {(selectedCustomer || editContacts)?.is_universal
                    ? 'Cliente Universal'
                    : selectedCustomer || editContacts
                    ? 'Editar Cliente'
                    : 'Crear Nuevo Cliente'}
                </DrawerTitle>
                <DrawerDescription>
                  {(selectedCustomer || editContacts)?.is_universal
                    ? 'Este es un cliente universal y no puede ser modificado.'
                    : selectedCustomer || editContacts
                    ? 'Modifica la información de tu cliente'
                    : 'Ingresa los datos de tu nuevo cliente'}
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={handleFormCancel}
                  className='h-8 w-8 absolute top-4 right-4'
                >
                  <X className='h-4 w-4' />
                </Button>
              </DrawerClose>
            </DrawerHeader>
            <div className='p-4'>
              <CustomerForm
                key={selectedCustomer?.id || editContacts?.id || ''}
                customer={selectedCustomer || editContacts || undefined}
                onSubmit={(data) => handleFormSubmit(data)}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
    </div>
  );
}
