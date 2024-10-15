import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
export default function CreateInvoiceButton() {
  const router = useRouter();
  return (
    <Button
      className="bg-[#00A1D4] text-white text-lg font-semibold flex gap-4 p-8"
      onClick={() => router.push("/home/invoices/create-invoice")}
    >
      <PlusCircleIcon />
      Crear factura
    </Button>
  );
}
