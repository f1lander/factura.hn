"use client";

import { useCompanyStore } from "@/store/companyStore";
import { useCustomersStore } from "@/store/customersStore";
import { useInvoicesStore } from "@/store/invoicesStore";
import { useIsLoadedStore } from "@/store/isLoadedStore";
import { useProductsStore } from "@/store/productsStore";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function LoadData() {
  const router = useRouter();
  const { isLoaded, setIsLoaded, hydrated } = useIsLoadedStore();
  const { syncCompany } = useCompanyStore();
  const { syncCustomers } = useCustomersStore();
  const { syncInvoices } = useInvoicesStore();
  const { syncProducts } = useProductsStore();
  useEffect(() => {
    if (!hydrated) return;
    if (!isLoaded) {
      const syncData = async () => {
        await Promise.all([
          syncCompany(),
          syncCustomers(),
          syncInvoices(),
          syncProducts(),
        ]);
        setIsLoaded();
      };
      syncData();
    }
    router.push("/home");
  }, [
    syncProducts,
    syncInvoices,
    syncCustomers,
    syncCompany,
    hydrated,
    isLoaded,
    router,
    setIsLoaded,
  ]);
  return (
    <div>{isLoaded ? "Se han cargado los datos" : "Cargando tus datos..."}</div>
  );
}
