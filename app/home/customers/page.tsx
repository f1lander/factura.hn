"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customerService, Customer } from "@/lib/supabase/services/customer";
import { CustomerForm } from "@/components/molecules/CustomerForm";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon, Trash2Icon, Users } from "lucide-react";
import GenericEmptyState from "@/components/molecules/GenericEmptyState";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const fetchedCustomers = await customerService.getCustomersByCompany();
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error("Error al obtener clientes:", err);
      setError(
        "No se pudieron cargar los clientes. Por favor, intente de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormVisible(true);
  };

  const handleCreateCustomer = () => {
    setSelectedCustomer(null);
    setIsFormVisible(true);
  };

  const handleFormSubmit = async (data: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id!, data);
      } else {
        await customerService.createCustomer(data as Customer);
      }
      fetchCustomers();
      setIsFormVisible(false);
      toast({
        title: selectedCustomer ? "Cliente Actualizado" : "Cliente Creado",
        description: "El cliente se ha guardado exitosamente.",
      });
    } catch (err) {
      console.error("Error al guardar el cliente:", err);
      setError("No se pudo guardar el cliente. Por favor, intente de nuevo.");
      toast({
        title: "Error",
        description:
          "No se pudo guardar el cliente. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedCustomer(null);
  };

  const handleCheckboxChange = (customerId: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(customerId)
        ? prev.filter((id) => id !== customerId)
        : [...prev, customerId],
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(customers.map((customer) => customer.id!));
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
      await Promise.all(
        selectedCustomers.map((id) => customerService.deleteCustomer(id)),
      );
      fetchCustomers();
      setSelectedCustomers([]);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Clientes Eliminados",
        description:
          "Los clientes seleccionados han sido eliminados exitosamente.",
      });
    } catch (err) {
      console.error("Error al eliminar clientes:", err);
      toast({
        title: "Error",
        description:
          "No se pudieron eliminar los clientes. Por favor, intente de nuevo.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="p-12">Cargando...</div>;
  }

  if (error) {
    return <div className="p-12">Error: {error}</div>;
  }
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 p-2 sm:p-4">
        <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div
            className={`w-full ${isFormVisible ? "xl:w-1/2" : "xl:w-full"} transition-all duration-300 ease-in-out`}
          >
            {customers.length === 0 ? (
              <GenericEmptyState
                icon={Users}
                title="No tienes clientes aún"
                description="Comienza agregando tus clientes para empezar a facturar"
                buttonText="Agregar Cliente"
                onAction={handleCreateCustomer}
              />
            ) : (
              <Card className="w-full">
                <CardHeader className="flex flex-col customersPageMin:flex-row items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle>Clientes</CardTitle>
                    <CardDescription>
                      Gestiona tus clientes aquí
                    </CardDescription>
                  </div>
                  {customers.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDeleteClick}
                        variant="destructive"
                        disabled={selectedCustomers.length === 0}
                      >
                        <Trash2Icon />
                        Eliminar
                      </Button>
                      <Button onClick={handleCreateCustomer}>
                        <PlusIcon />
                        Nuevo
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={
                              selectedCustomers.length === customers.length
                            }
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RTN</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Contactos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow
                          key={customer.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.includes(customer.id!)}
                              onCheckedChange={() =>
                                handleCheckboxChange(customer.id!)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            {customer.name}
                          </TableCell>
                          <TableCell
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            {customer.rtn}
                          </TableCell>
                          <TableCell
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            {customer.email}
                          </TableCell>
                          <TableCell
                            onClick={() => handleCustomerSelect(customer)}
                          >
                            {customer.contacts?.length || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
          {isFormVisible && (
            <div className="w-full xl:w-1/2 transition-all duration-300 ease-in-out">
              <CustomerForm
                customer={selectedCustomer || undefined}
                onSubmit={handleFormSubmit}
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
              ¿Está seguro de que desea eliminar{" "}
              {selectedCustomers.length === 1
                ? "el cliente seleccionado"
                : `los ${selectedCustomers.length} clientes seleccionados`}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
