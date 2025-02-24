import React, {
  type ChangeEvent,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { FileSpreadsheet, Redo2Icon, Undo2Icon } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  GridReadyEvent,
  GridApi,
  CellValueChangedEvent,
  RowValueChangedEvent,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { Button } from '@/components/ui/button';
import { PlusIcon, Trash2Icon, SearchIcon } from 'lucide-react';
import { AG_GRID_LOCALE_ES } from '@ag-grid-community/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// New interface to track both edited and original data
interface EditedRowData<T> {
  current: T;
  original: T;
}

interface DataGridProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columnDefs: ColDef<T>[];
  onRowClick?: (data: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onCreateNew?: () => void;
  onDelete?: () => void;
  onAddExcelSpreadSheet?: () => void;
  handleOnUpdateRows?: (rows: T[]) => Promise<void>;
  searchPlaceholder?: string;
  height?: string;
  idField?: keyof T;
  pageSize?: number;
  pageSizeOptions?: number[];
  SearchBoxComponent?: React.ReactNode;
  ControlsComponents?: React.ReactNode;
  context?: any;
  onRowUpdate?: (index: number, newData: T) => Promise<void>;
  onRowDelete?: (index: number, data: T) => Promise<void>;
  autoUpdate?: boolean;
}

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  editable: true,
  enableCellChangeFlash: true,
};

export function DataGrid<T>({
  title,
  description,
  data,
  columnDefs,
  onRowClick,
  onSelectionChange,
  onCreateNew,
  onDelete,
  onAddExcelSpreadSheet,
  handleOnUpdateRows,
  searchPlaceholder,
  height = '500px',
  idField = 'id' as keyof T,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20],
  SearchBoxComponent,
  ControlsComponents,
  context,
  onRowDelete,
  autoUpdate,
}: DataGridProps<T>) {
  const gridRef = useRef<AgGridReact>(null);
  const gridStyle = useMemo(() => ({ height: '500px', width: '100%' }), []);
  const [originalData, setOriginalData] = useState<T[]>(
    data ? data.map((row) => ({ ...row })) : []
  );
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [quickFilterText, setQuickFilterText] = useState<string>();
  const [editedRows, setEditedRows] = useState<T[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const deleteActionsColumnDef: ColDef[] = onRowDelete
    ? [
        {
          headerName: 'Actions',
          field: 'actions',
          width: 50,
          sortable: false,
          filter: false,
          editable: false,
          cellRenderer: (params: any) => {
            const handleDelete = async () => {
              try {
                onRowDelete(params.node.rowIndex, params.data);
              } catch (error) {
                console.error('Error deleting row:', error);
              }
            };

            return (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
              >
                <Trash2Icon className='h-4 w-4' />
              </Button>
            );
          },
        },
      ]
    : [];

  const onRowValueChangedAuto = useCallback(
    async (event: RowValueChangedEvent) => {
      const newData = event.data;
      const rowId = newData[idField as keyof typeof newData] as string;

      try {
        gridApi?.applyTransaction({ update: [newData] });
      } catch (error) {
        console.error('Error updating row:', error);
        // Revert changes if update fails
        if (gridApi) {
          const originalRow = originalData.find(
            (row) => row[idField as keyof T] === rowId
          );
          if (originalRow) {
            gridApi.applyTransaction({ update: [originalRow] });
          }
        }
        return;
      }
    },
    [idField, originalData, gridApi]
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent) => {
      const { data, source } = event;

      if (source === 'redo') {
        setEditedRows((prev) => {
          const filtered = prev.filter(
            (row) => row[idField as keyof T] !== data[idField]
          );
          return [...filtered, data];
        });
      }
    },
    [idField]
  );

  const onRowValueChanged = useCallback(
    (event: RowValueChangedEvent) => {
      if (autoUpdate) {
        onRowValueChangedAuto(event);
        return;
      }

      const newData = event.data;
      // I can't do this because I need the id to locate the product I'm gonna update
      // if (newData.id !== undefined) delete newData.id;

      const rowId = newData[idField as keyof typeof newData] as string;

      setEditedRows((prev) => {
        const filtered = prev.filter(
          (row) => row[idField as keyof T] !== rowId
        );
        return [...filtered, newData];
      });
    },
    [idField, autoUpdate]
  );

  const handleSaveChanges = useCallback(async () => {
    if (handleOnUpdateRows) {
      try {
        await handleOnUpdateRows(editedRows);
        setEditedRows([]);
      } catch (error) {
        console.error('Error saving changes', error);
      }
    }
    setShowSaveDialog(false);
  }, [editedRows, handleOnUpdateRows]);

  const handleDiscardChanges = useCallback(() => {
    if (gridApi) {
      gridApi.setGridOption('rowData', [...originalData]);
      setEditedRows([]);
    }
    setShowDiscardDialog(false);
  }, [gridApi, originalData]);

  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
  };

  const onFilterTextBoxChanged = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
      setQuickFilterText(value),
    []
  );

  const handleSelectionChange = useCallback(() => {
    if (gridApi) {
      const selected = gridApi
        .getSelectedRows()
        .map((row) => row[idField] as string);
      setSelectedRows(selected);
      onSelectionChange?.(selected);
    }
  }, [gridApi, onSelectionChange, idField]);

  const handleRowClick = useCallback(
    (event: any) => {
      onRowClick?.(event.data);
    },
    [onRowClick]
  );

  const handleOnUndo = () => {
    gridApi?.undoCellEditing();
    // remove the last edited row from the editedRows array, but also need to save
    setEditedRows((prev) => {
      const lastEditedRow = prev[prev.length - 1];
      const filtered = prev.filter(
        (row) => row[idField as keyof T] !== lastEditedRow[idField as keyof T]
      );
      return filtered;
    });
  };

  const handleOnRedo = () => {
    gridApi?.redoCellEditing();
  };

  return (
    <div className='w-full bg-white p-4'>
      <div className='space-y-4 mb-4'>
        <div className='flex flex-col md:flex-row justify-between items-center'>
          <div>
            {title && <h2 className='text-lg font-semibold'>{title}</h2>}
            {description && (
              <p className='text-sm text-gray-500'>{description}</p>
            )}
          </div>
          <div className='flex gap-2 flex-col md:flex-row'>
            {onAddExcelSpreadSheet && (
              <Button
                onClick={onAddExcelSpreadSheet}
                variant='outline'
                className='flex gap-2 items-center border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700'
              >
                <FileSpreadsheet className='h-4 w-4' />
                <span>Añadir desde archivo de Excel</span>
              </Button>
            )}
            {onDelete && selectedRows.length > 0 && (
              <Button
                onClick={onDelete}
                variant='outline'
                className='border-red-600 text-gray-900 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center'
              >
                <Trash2Icon className='h-4 w-4 mr-2' />
                Eliminar
              </Button>
            )}
            {onCreateNew && (
              <Button
                onClick={onCreateNew}
                variant='outline'
                className='border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700 flex items-center'
              >
                <PlusIcon className='h-4 w-4 mr-2' />
                Nuevo
              </Button>
            )}
          </div>
        </div>
        <div className='flex flex-col md:flex-row items-center gap-4'>
          {SearchBoxComponent || (
            <div className='relative w-full md:w-1/3'>
              <SearchIcon className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-900' />
              <input
                type='text'
                placeholder={
                  searchPlaceholder ? searchPlaceholder : 'Buscar...'
                }
                onInput={onFilterTextBoxChanged}
                className='h-9 w-full rounded-md border px-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50'
              />
            </div>
          )}
          {ControlsComponents}
          {editedRows.length > 0 && (
            <div className='flex flex-col md:flex-row gap-2'>
              <Button
                onClick={() => setShowSaveDialog(true)}
                variant='outline'
                className='border-green-600 text-gray-900 hover:bg-green-50 hover:text-green-700'
              >
                Guardar Cambios ({editedRows.length})
              </Button>
              <Button
                onClick={() => setShowDiscardDialog(true)}
                variant='outline'
                className='border-red-600 text-gray-900 hover:bg-red-50 hover:text-red-700'
              >
                Descartar Cambios
              </Button>
              <Button
                onClick={() => handleOnUndo()}
                className='border-gray-600 bg-transparent text-gray-900 hover:bg-gray-200 hover:text-gray-700'
              >
                <Undo2Icon className='h-4 w-4' />
              </Button>
              <Button
                onClick={() => handleOnRedo()}
                className='border-gray-600 bg-transparent text-gray-900 hover:bg-gray-200 hover:text-gray-700'
              >
                <Redo2Icon className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className='ag-theme-quartz w-full' style={gridStyle}>
        <AgGridReact
          ref={gridRef}
          gridOptions={{
            localeText: AG_GRID_LOCALE_ES,
            undoRedoCellEditing: true,
          }}
          rowData={data}
          columnDefs={[...columnDefs, ...deleteActionsColumnDef]}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onSelectionChanged={handleSelectionChange}
          onRowClicked={handleRowClick}
          rowSelection='multiple'
          editType='fullRow'
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={pageSizeOptions}
          onCellValueChanged={onCellValueChanged}
          onRowValueChanged={onRowValueChanged}
          context={context}
        />
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción guardará los cambios realizados en {editedRows.length}{' '}
              fila(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveChanges}>
              Guardar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar cambios?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción descartará todos los cambios no guardados. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className='bg-red-600 hover:bg-red-700'
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
