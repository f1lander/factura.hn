import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from "lucide-react";
interface CreateInvoiceButtonProps {
  handleCreateInvoice: () => void;
}
export default function CreateInvoiceButton({
  handleCreateInvoice,
}: CreateInvoiceButtonProps) {
  return (
    <Button
      className="bg-[#00A1D4] text-white text-lg font-semibold flex gap-4 p-8"
      onClick={handleCreateInvoice}
    >
      <PlusCircleIcon />
      Crear factura
    </Button>
  );
}
