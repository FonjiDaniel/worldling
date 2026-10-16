"use client";

import {
  type ColumnDef,
  type RowData,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, text: sortFn_text },
});

export type DataTableColumn<TData extends RowData> = ColumnDef<typeof dataTableFeatures, TData>;

interface DataTableProps<TData extends RowData> {
  /** Visible caption, also the table's accessible name. */
  caption: string;
  columns: DataTableColumn<TData>[];
  data: TData[];
  empty?: ReactNode;
  className?: string;
}

export function DataTable<TData extends RowData>({
  caption,
  columns,
  data,
  empty = "Nothing here yet.",
  className,
}: DataTableProps<TData>) {
  const table = useTable({ features: dataTableFeatures, columns, data });
  const rows = table.getRowModel().rows;

  return (
    <div className={cn("overflow-x-auto rounded-md border border-line", className)}>
      <table className="w-full border-collapse text-left text-sm">
        <caption className="p-4 text-left font-display text-base font-semibold text-text">
          {caption}
        </caption>
        <thead className="bg-surface-raised">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id}>
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined
                    }
                    className="border-b border-line px-4 py-2 font-medium text-text-muted"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="-mx-2 inline-flex min-h-touch items-center gap-1.5 rounded-sm px-2 hover:text-text"
                      >
                        <table.FlexRender header={header} />
                        <SortIcon sorted={sorted} />
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="border-b border-line last:border-0 hover:bg-surface">
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-text">
                    <table.FlexRender cell={cell} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp aria-hidden className="size-3.5" />;
  if (sorted === "desc") return <ArrowDown aria-hidden className="size-3.5" />;
  return <ArrowUpDown aria-hidden className="size-3.5 opacity-60" />;
}
