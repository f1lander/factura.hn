"use client";

import { Button } from "@/components/ui/button";
import { useProductsStore } from "@/store/productsStore";
import { PlusCircleIcon } from "lucide-react";
import { toast } from "../ui/use-toast";

export default function CreateInvoiceButton() {
  const { products } = useProductsStore();
  const ensureProductsExistenceAndCreateInvoice = () => {
    if (products.length < 1) {
      return toast({
        variant: "destructive",
        title: "¡Aún no tenemos productos!",
        description:
          "Antes de poder crear facturas, debes crear al menos un producto. Ve a la pestaña de productos y agrega uno.",
      });
    }
    window.location.href = "/home/invoices/create-invoice";
  };
  return (
    <Button
      className="bg-[#00A1D4] text-white text-lg font-semibold flex gap-4 p-8"
      onClick={ensureProductsExistenceAndCreateInvoice}
    >
      <PlusCircleIcon />
      Crear factura
    </Button>
  );
}
