import { Customer } from "@/lib/supabase/services/customer";
import { Product } from "@/lib/supabase/services/product";
import { ColDef } from "ag-grid-community";

export const productColumns: ColDef<Product>[] = [
  {
    field: "sku",
    headerName: "SKU",
    checkboxSelection: true,
    headerCheckboxSelection: true,
  },
  { field: "description", headerName: "Descripción" },
  {
    field: "unit_cost",
    headerName: "Precio Unitario",
    valueFormatter: (params) => `Lps. ${params.value.toFixed(2)}`,
  },
  {
    field: "is_service",
    headerName: "Tipo",
    valueFormatter: (params) => (params.value ? "Servicio" : "Producto"),
  },
  {
    field: "quantity_in_stock",
    headerName: "Inventario",
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
