"use client"; // Add this if using App Router

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
import { companyService } from "@/lib/supabase/services/company";
import { CustomerForm } from "@/components/molecules/CustomerForm";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  useEffect(() => {
    logIn();
    fetchCustomers();
  }, []);

  const logIn = async () => {
    try {
      const data = await companyService.login(
        "filanderuclez@gmail.com",
        "tipNuv-7wiffo-migfyx"
      );
      if (!data) {
        console.error("Error signing in:");
        setError("Failed to sign in. Please try again.");
      } else {
        console.log("Signed in successfully");
      }
    } catch (err) {
      console.error("Error signing in:", err);
      setError("An error occurred while signing in. Please try again.");
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const company = await companyService.getCompany();
      if (!company || !company.id) {
        throw new Error("No company found");
      }
      const fetchedCustomers = await customerService.getCustomersByCompany(
        company.id
      );
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
        const company = await companyService.getCompany();
        if (!company || !company.id) {
          throw new Error("No company found");
        }
        await customerService.createCustomer({
          ...data,
          company_id: company.id,
        } as Customer);
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
    return <div className="p-12">Loading...</div>;
  }

  if (error) {
    return <div className="p-12">Error: {error}</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
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
      </div>
    </div>
  );
}
