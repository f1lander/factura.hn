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

const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const fetchedCustomers = await customerService.getCustomersByCompany();
      setCustomers(fetchedCustomers);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to fetch customers. Please try again.");
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
        // Update existing customer
        await customerService.updateCustomer(selectedCustomer.id!, data);
      } else {
        // Create new customer
        await customerService.createCustomer(data as Customer);
      }
      fetchCustomers(); // Refresh the customer list
      setIsFormVisible(false);
    } catch (err) {
      console.error("Error saving customer:", err);
      setError("Failed to save customer. Please try again.");
    }
  };

  const handleFormCancel = () => {
    setIsFormVisible(false);
    setSelectedCustomer(null);
  };

  if (isLoading) {
    return <div className="p-12">Cargando...</div>;
  }

  if (error) {
    return <div className="p-12">Error: {error}</div>;
  }

  return (
    <main className="flex flex-col xl:flex-row items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className={`w-full ${isFormVisible ? 'xl:w-1/2' : 'xl:w-full'} transition-all duration-300 ease-in-out`}>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Clientes</CardTitle>
              <CardDescription>Gestiona tus clientes aquí</CardDescription>
            </div>
            <Button onClick={handleCreateCustomer}>+ Nuevo</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                    onClick={() => handleCustomerSelect(customer)}
                  >
                    <TableCell>{customer.name}</TableCell>
                    <TableCell>{customer.rtn}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.contacts?.length || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
  );
};

export default CustomersPage;