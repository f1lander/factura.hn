'use client';

import React, { useEffect, useState } from 'react';
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
import { Users } from 'lucide-react';
import GenericEmptyState from '@/components/molecules/GenericEmptyState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataGrid } from '@/components/molecules/DataGrid';
import { customerColumns } from '@/utils/tableColumns';
import useUploadXls from '@/hooks/useUploadXls';
import { CustomerImportStepper } from '@/components/organisms/customers/CustomerImportStepper';

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
    setEditContacts(null);
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
        <main className='flex flex-col-reverse xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8'>
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
                  onAddExcelSpreadSheet={() =>
                    setIsAddProductsWithSpreadsheetDialogOpen(true)
                  }
                  context={{
                    onEditContact: (data: Customer) => {
                      setEditContacts(data);
                    },
                  }}
                />
              </>
            )}
          </div>
          {(isFormVisible || editContacts) && (
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
