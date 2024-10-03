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
  const { isLoaded, setIsLoaded, hydrated } = useIsLoadedStore();
  const { setCompany } = useCompanyStore();
  const { setCustomers } = useCustomersStore();
  const { setAllInvoices } = useInvoicesStore();
  const { setProducts } = useProductsStore();
  const router = useRouter();
  useEffect(() => {
    if (!hydrated) return console.log("Hasn't been hydrated...");
    console.log("Hydrated. Now running...");
    if (!isLoaded) {
      const loadData = async function() {
        const [fetchedInvoices, fetchedProducts, company, fetchedCustomers] =
          await Promise.all([
            invoiceService.getInvoices(),
            productService.getProductsByCompany(),
            companyService.getCompanyById(),
            customerService.getCustomersByCompany(),
          ]);
        console.log("Yes, the data has been fetched");

        // 3. update the stores
        setCompany(company!);
        setCustomers(fetchedCustomers);
        setAllInvoices(fetchedInvoices);
        setProducts(fetchedProducts);

        // And lastly, mark the flag as already loaded
        setIsLoaded();
      };
      loadData();
    } else {
      console.log(
        "Don't worry, we haven't made the request because we already have data inside",
      );
    }
    // router.push("/home");
    console.log("The effect ends here. I hope it has worked as expected");
  }, [
    isLoaded,
    setIsLoaded,
    router,
    setAllInvoices,
    setCompany,
    setCustomers,
    setProducts,
    hydrated,
  ]);
  return (
    <div>{isLoaded ? "Se han cargado los datos" : "Cargando tus datos..."}</div>
  );
}
