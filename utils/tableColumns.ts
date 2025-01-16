import { Customer } from "@/lib/supabase/services/customer";
import { Product } from "@/lib/supabase/services/product";
import { ColDef } from "ag-grid-community";

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
    // TODO: https://github.com/f1lander/factura.hn/issues/56
    // editable: false, // Uncomment this line to disable editing until we implement inventory management
    valueFormatter: (params) =>
      params.data?.is_service ? "N/A" : params.value,
  },
];

export const customerColumns: ColDef<Customer>[] = [
  {
    field: "name",
    headerName: "Nombre",
    checkboxSelection: true,
    headerCheckboxSelection: true,
  },
  { field: "rtn", headerName: "RTN" },
  {
    field: "email",
    headerName: "Email",
  },
  {
    field: "contacts",
    headerName: "Contactos",
    valueFormatter: (params) => (params.value ? params.value.length : 0),
  },
];
