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
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2">
            {onDelete && (
              <Button
                onClick={onDelete}
                variant="destructive"
                disabled={selectedRows.length === 0}
              >
                <Trash2Icon className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo
              </Button>
            )}
          </div>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto..."
            onInput={onFilterTextBoxChanged}
            className="h-9 w-full max-w-sm rounded-md border border-input bg-background px-8 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}