import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeliveryConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeliveryConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: DeliveryConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar entrega de productos</DialogTitle>
          <DialogDescription>
            ¿Los productos de esta factura ya han sido entregados al cliente?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            No, solo guardar
          </Button>
          <Button onClick={onConfirm}>
            Sí, actualizar inventario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}