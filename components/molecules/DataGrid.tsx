'use client';
import React, { type ChangeEvent, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent, GridApi } from 'ag-grid-community';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusIcon, Trash2Icon, SearchIcon } from 'lucide-react';
import { AG_GRID_LOCALE_ES } from '@ag-grid-community/locale';

interface DataGridProps<T> {
  title?: string;
  description?: string;
  data: T[];
  columnDefs: ColDef<T>[];
  onRowClick?: (data: T) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onCreateNew?: () => void;
  onDelete?: () => void;
  height?: string;
  idField?: keyof T;
  pageSize?: number;
  pageSizeOptions?: number[];
}

export function DataGrid<T>({
  title,
  description,
  data,
  columnDefs,
  onRowClick,
  onSelectionChange,
  onCreateNew,
  onDelete,
  height = '500px',
  idField = 'id' as keyof T,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20]
}: DataGridProps<T>) {
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [quickFilterText, setQuickFilterText] = useState<string>();

  const defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

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
      const selected = gridApi.getSelectedRows().map(row => row[idField] as string);
      setSelectedRows(selected);
      onSelectionChange?.(selected);
    }
  }, [gridApi, onSelectionChange, idField]);

  const handleRowClick = useCallback((event: any) => {
    onRowClick?.(event.data);
  }, [onRowClick]);

  return (
    <div className="w-full bg-white">
      <div className="space-y-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={selectedRows.length === 0}
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Eliminar
              </button>
            )}
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo
              </button>
            )}
          </div>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar producto..."
            onInput={onFilterTextBoxChanged}
            className="h-9 w-full max-w-sm rounded-md border px-8 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div className="ag-theme-quartz w-full" style={{ height }}>
        <AgGridReact
          gridOptions={{
            localeText: AG_GRID_LOCALE_ES
          }}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          onSelectionChanged={handleSelectionChange}
          onRowClicked={handleRowClick}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={pageSizeOptions}
        />
      </div>

    </div>
  );
}