'use client';

import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  ModuleRegistry,
  AllCommunityModule,
  ColDef,
  RowClassRules,
  GridApi,
  GridReadyEvent,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

ModuleRegistry.registerModules([AllCommunityModule]);

const esLocale = {
  page: 'Página', more: 'más', to: 'a', of: 'de',
  next: 'Siguiente', last: 'Última', first: 'Primera', previous: 'Anterior',
  loadingOoo: 'Cargando…', pageSize: 'Filas por página', rowsPerPage: 'Filas por página',
  filterOoo: 'Filtrar…', equals: 'Igual a', notEqual: 'Distinto de', contains: 'Contiene',
  notContains: 'No contiene', startsWith: 'Empieza con', endsWith: 'Termina con',
  blank: 'Vacío', notBlank: 'No vacío', andCondition: 'Y', orCondition: 'O',
  clearFilter: 'Limpiar', applyFilter: 'Aplicar', cancel: 'Cancelar',
  reset: 'Reiniciar', searchOoo: 'Buscar…', noFilters: 'Sin filtros',
  columns: 'Columnas', filters: 'Filtros', done: 'Listo',
  selectAll: 'Seleccionar todo', selectAllSearchResults: 'Seleccionar resultados',
  addFilter: 'Añadir filtro',
};

export type AgTableProps<T> = {
  rows: T[];
  columns: ColDef<T>[];
  quickFilterText?: string;
  getRowId?: (data: T) => string;
  rowClassRules?: RowClassRules;
  onReady?: (api: GridApi) => void;
  height?: number;                // px
  pageSize?: number;
  className?: string;             // clases extra del wrapper
  themeClassName?: string;        // clase de tema (default incluida)
};

export default function AgTable<T>({
  rows,
  columns,
  quickFilterText,
  getRowId,
  rowClassRules,
  onReady,
  height = 440,
  pageSize = 10,
  className,
  themeClassName = 'ag-theme-alpine ag-theme-cifra',
}: AgTableProps<T>) {

  const defaultColDef = useMemo<ColDef>(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: 'ag-header-cell-label !font-semibold !text-gray-800',
  }), []);

  const gridOptions = useMemo(() => ({
    theme: 'legacy',
    quickFilterText,
  }), [quickFilterText]);

  const handleReady = (e: GridReadyEvent) => onReady?.(e.api);

  return (
    <div
      className={`${themeClassName} ring-1 ring-gray-200 rounded-xl overflow-hidden p-2 bg-white ${className ?? ''}`}
      style={{ height, width: '100%' }}
    >
      <AgGridReact<T>
        gridOptions={gridOptions}
        rowData={rows}
        columnDefs={columns}
        defaultColDef={defaultColDef}
        rowClassRules={rowClassRules}
        animateRows
        rowHeight={46}
        headerHeight={40}
        pagination
        paginationPageSize={pageSize}
        paginationPageSizeSelector={[10, 25, 50, 100]}
        localeText={esLocale}
        suppressCellFocus
        getRowId={getRowId ? (p => getRowId(p.data)) : undefined}
        onGridReady={handleReady}
      />
    </div>
  );
}
