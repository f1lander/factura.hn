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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { PlusIcon, Trash2Icon, Users } from "lucide-react";
import GenericEmptyState from "@/components/molecules/GenericEmptyState";
import { DialogClose } from "@radix-ui/react-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { data: customers, isLoading: areCustomersLoading } = useQuery(
    ["customers"], // unique query key
    () => customerService.getCustomersByCompany(), // the function for fetching
    {
      staleTime: 300000,
      cacheTime: 600000,
      refetchOnWindowFocus: true,
    },
  );
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const { toast } = useToast();

  // side effect for tracking screen width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  const handleFormSubmit = async (data: Partial<Customer>) => {
    try {
      if (selectedCustomer) {
        await customerService.updateCustomer(selectedCustomer.id!, data);
      } else {
        await customerService.createCustomer(data as Customer);
      }
      queryClient.invalidateQueries(["customers"]);
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
    if (checked && customers) {
      setSelectedCustomers(customers.filter(item => !item.is_universal).map((customer) => customer.id!));

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
      queryClient.invalidateQueries(["customers"]);
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
            {customers!.length === 0 ? (
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
                  {customers!.length > 0 && (
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
                            disabled={customers?.every((c) => c.is_universal)}
                            checked={
                              selectedCustomers.length === customers?.filter(item => !item.is_universal).length
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
                      {customers!.map((customer) => (
                        <TableRow
                          onClick={!customer.is_universal ? () => handleCustomerSelect(customer) : () => null}
                          key={customer.id}
                          className="cursor-pointer hover:bg-muted/50"
                        >
                          <TableCell>
                            {
                              !customer.is_universal &&
                              <Checkbox
                                checked={selectedCustomers.includes(customer.id!)}
                                onCheckedChange={() =>
                                  handleCheckboxChange(customer.id!)
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                            }
                          </TableCell>
                          <TableCell

                          >
                            {customer.name}
                          </TableCell>
                          <TableCell

                          >
                            {customer.rtn}
                          </TableCell>
                          <TableCell

                          >
                            {customer.email}
                          </TableCell>
                          <TableCell

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
          {isFormVisible &&
            (windowWidth >= 1280 ? (
              <div className="w-full xl:w-1/2 transition-all duration-300 ease-in-out">
                <CustomerForm
                  customer={selectedCustomer || undefined}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </div>
            ) : (
              <Dialog open={isFormVisible} onOpenChange={setIsFormVisible}>
                <DialogTrigger asChild></DialogTrigger>
                <DialogContent
                  className="w-[90%]"
                  id="contenido del dialogo papa"
                >
                  <div className="transition-all duration-300 ease-in-out">
                    <CustomerForm
                      customer={selectedCustomer || undefined}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </div>
                </DialogContent>
                <DialogClose asChild></DialogClose>
              </Dialog>
            ))}
        </main>
      </div >
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
    </div >
  );
}
