"use client";

import { companyService } from "@/lib/supabase/services/company";
import { customerService } from "@/lib/supabase/services/customer";
import { invoiceService } from "@/lib/supabase/services/invoice";
import { productService } from "@/lib/supabase/services/product";
import { useCompanyStore } from "@/store/companyStore";
import { useCustomersStore } from "@/store/customersStore";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useIsLoadedStore } from "@/store/isLoadedStore";
import { useProductsStore } from "@/store/productsStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function LoadData() {
  const { isLoaded, setIsLoaded } = useIsLoadedStore();
  const { setCompany } = useCompanyStore();
  const { setCustomers } = useCustomersStore();
  const { setAllInvoices } = useInvoicesStore();
  const { setProducts } = useProductsStore();
  const router = useRouter();
  useEffect(() => {
    // 1. check if it has been already loaded
    if (!isLoaded) {
      const loadData = async function() {
        // 2. in case it hasn't been loaded, fetch the data first
        const fetchedInvoices = await invoiceService.getInvoices();
        const fetchedProducts = await productService.getProductsByCompany();
        const company = await companyService.getCompanyById();
        const fetchedCustomers = await customerService.getCustomersByCompany();

        // 3. update the stores
        setCompany(company!);
        setCustomers(fetchedCustomers);
        setAllInvoices(fetchedInvoices);
        setProducts(fetchedProducts);

        // And lastly, mark the flag as already loaded
        setIsLoaded();
      };
      loadData();
    }
    router.push("/home");
  }, [
    isLoaded,
    setIsLoaded,
    router,
    setAllInvoices,
    setCompany,
    setCustomers,
    setProducts,
  ]);

  return <div>Loading...</div>;
}
