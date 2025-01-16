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
  {
    field: "is_service",
    headerName: "Inventario indefinido", 
  
    valueFormatter: (params) => (params.value ? "Servicio" : "Producto"),
  },
  {
    field: "quantity_in_stock",
    headerName: "Inventario",
    editable: true,
    valueFormatter: (params) =>
      params.data?.is_service ? "N/A" : params.value,
  },
];

const validateEditableCustomer: EditableCallback<Customer, any> = (params) => !params.data?.is_universal;

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
];
