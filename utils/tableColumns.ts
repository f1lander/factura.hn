import { Customer } from "@/lib/supabase/services/customer";
import { Product } from "@/lib/supabase/services/product";
import { ColDef, EditableCallback } from "ag-grid-community";

export const productColumns: ColDef<Product>[] = [
  {
    field: "sku",
    headerName: "SKU",
    checkboxSelection: true,
    headerCheckboxSelection: true,
    editable: true,
  },
  { field: "description", headerName: "Descripción", minWidth:500 },
  {
    field: "unit_cost",
    headerName: "Precio Unitario",
    valueFormatter: (params) => `Lps. ${params.value.toLocaleString('en')}`,
    editable: true,
  },
  // {
  //   field: "is_service",
  //   headerName: "Inventario indefinido", 
  
  //   valueFormatter: (params) => (params.value ? "Servicio" : "Producto"),
  // },
  {
    field: "quantity_in_stock",
    headerName: "Inventario",
    editable: false,
    valueFormatter: (params) =>
      params.data?.is_service ? "N/A (Servicio)" : params.value,
  },
];

const validateEditableCustomer: EditableCallback<Customer, any> = (params) => !params.data?.is_universal;

export class CustomButtonComponent {
  eGui!: HTMLDivElement;
  eButton: any;
  eventListener!: () => void;

  init(props: any) {
      console.log(props);
      this.eGui = document.createElement('div');
      const eButton = document.createElement('button');
      eButton.className = 'btn-simple';
      eButton.textContent = 'Editar';
      this.eventListener = () => {
        props.context.onEditContact(props.data);
      };
      eButton.addEventListener('click', this.eventListener);

      if(validateEditableCustomer(props)) {
        this.eGui.appendChild(eButton);
      }
  }

  getGui() {
      return this.eGui;
  }

  refresh() {
      return true;
  }

  destroy() {
      if (this.eButton) {
          this.eButton.removeEventListener('click', this.eventListener);
      }
  }
}

export const customerColumns: ColDef<Customer>[] = [
  {
    field: "name",
    headerName: "Nombre",
    checkboxSelection: true,
    headerCheckboxSelection: true,
    editable: validateEditableCustomer,
  },
  { field: "rtn", headerName: "RTN", editable: validateEditableCustomer, },
  {
    field: "email",
    headerName: "Email",
    editable: validateEditableCustomer,
  },
  {
    field: "contacts",
    headerName: "Contactos",
    editable: false,
    valueFormatter: (params) => (params.value ? params.value.length : 0),
  },
  {
    headerName: "Acciones",
    editable: false,
    cellRenderer: CustomButtonComponent,
  },
];
