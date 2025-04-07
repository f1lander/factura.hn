import { Customer } from '@/lib/supabase/services/customer';
import { Product, TaxType } from '@/lib/supabase/services/product';
import { ColDef, EditableCallback, ICellEditorParams } from 'ag-grid-community';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Custom cell editor for tax type
class TaxTypeCellEditor {
  private eGui: HTMLDivElement;
  private value: TaxType;
  private props: ICellEditorParams;

  constructor(props: ICellEditorParams) {
    this.props = props || {};
    // Initialize with default value first
    this.value = TaxType.GRAVADO_15;

    // Only try to validate and set value if props exists and has a value
    if (props && 'value' in props) {
      const validatedValue = this.validateTaxType(props.value);
      if (validatedValue) {
        this.value = validatedValue;
      }
    }

    this.eGui = document.createElement('div');
    this.eGui.className = 'h-full w-full';
    this.render();
  }

  private validateTaxType(value: any): TaxType | null {
    if (!value) return null;

    // Check if the value is a valid TaxType
    if (Object.values(TaxType).includes(value)) {
      return value as TaxType;
    }

    // If it's a string, try to match it with TaxType values
    if (typeof value === 'string') {
      const normalizedValue = value.toUpperCase();
      if (Object.values(TaxType).includes(normalizedValue as TaxType)) {
        return normalizedValue as TaxType;
      }
    }

    return null;
  }

  private render() {
    const select = document.createElement('select');
    select.className = 'w-full h-full border rounded px-2 py-1';

    // Add options
    Object.values(TaxType).forEach((type) => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = this.getTaxTypeLabel(type);
      if (type === this.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Handle change
    select.addEventListener('change', (e) => {
      const newValue = (e.target as HTMLSelectElement).value;
      if (this.validateTaxType(newValue)) {
        this.value = newValue as TaxType;
        // Check if stopEditing exists before calling it
        if (typeof this.props.stopEditing === 'function') {
          this.props.stopEditing();
        }
      }
    });

    this.eGui.appendChild(select);
  }

  private getTaxTypeLabel(type: TaxType): string {
    switch (type) {
      case TaxType.EXENTO:
        return '0% (Exento)';
      case TaxType.EXONERADO:
        return '0% (Exonerado)';
      case TaxType.GRAVADO_15:
        return '15%';
      case TaxType.GRAVADO_18:
        return '18%';
      default:
        return type;
    }
  }

  getGui() {
    return this.eGui;
  }

  getValue() {
    return this.value;
  }

  isPopup() {
    return false;
  }

  isCancelBeforeStart() {
    return false;
  }

  isCancelAfterEnd() {
    return false;
  }

  focusIn() {
    const select = this.eGui.querySelector('select');
    if (select) {
      select.focus();
    }
  }

  focusOut() {
    const select = this.eGui.querySelector('select');
    if (select) {
      select.blur();
    }
  }
}

export const productColumns: ColDef<Product>[] = [
  {
    field: 'sku',
    headerName: 'SKU',
    checkboxSelection: true,
    headerCheckboxSelection: true,
    editable: true,
  },
  { field: 'description', headerName: 'Descripción', minWidth: 500 },
  {
    field: 'unit_cost',
    headerName: 'Precio Unitario',
    valueFormatter: (params) => `Lps. ${params.value.toLocaleString('en')}`,
    editable: true,
  },
  {
    field: 'tax_type',
    headerName: 'Tipo de Impuesto',
    editable: true,
    cellEditor: TaxTypeCellEditor,
    valueFormatter: (params) => {
      switch (params.value) {
        case TaxType.EXENTO:
          return '0% (Exento)';
        case TaxType.EXONERADO:
          return '0% (Exonerado)';
        case TaxType.GRAVADO_15:
          return '15%';
        case TaxType.GRAVADO_18:
          return '18%';
        default:
          return params.value;
      }
    },
  },
  // {
  //   field: "is_service",
  //   headerName: "Inventario indefinido",

  //   valueFormatter: (params) => (params.value ? "Servicio" : "Producto"),
  // },
  {
    field: 'quantity_in_stock',
    headerName: 'Inventario',
    editable: false,
    valueFormatter: (params) =>
      params.data?.is_service ? 'N/A (Servicio)' : params.value,
  },
];

const validateEditableCustomer: EditableCallback<Customer, any> = (params) =>
  !params.data?.is_universal;

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

    if (validateEditableCustomer(props)) {
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
    field: 'name',
    headerName: 'Nombre',
    checkboxSelection: validateEditableCustomer,
    headerCheckboxSelection: true,
    editable: validateEditableCustomer,
  },
  { field: 'rtn', headerName: 'RTN', editable: validateEditableCustomer },
  {
    field: 'email',
    headerName: 'Email',
    editable: validateEditableCustomer,
  },
  {
    field: 'contacts',
    headerName: 'Contactos',
    editable: false,
    valueFormatter: (params) => (params.value ? params.value.length : 0),
  },
  {
    headerName: 'Acciones',
    editable: false,
    cellRenderer: CustomButtonComponent,
  },
];
