"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Inbox } from "lucide-react";
import { Pagination } from "@/components/molecules/Pagination";
import { cn } from "@/lib/cn";

export interface TableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField: (row: T) => string;
  emptyMessage?: string;
  /** Rows per page. Set to 0 to disable pagination entirely. Defaults to 10. */
  pageSize?: number;
}

export function Table<T>({
  columns,
  data,
  keyField,
  emptyMessage = "No data available.",
  pageSize = 10,
}: TableProps<T>) {
  const [page, setPage] = useState(1);

  const paginationEnabled = pageSize > 0;
  const totalPages = paginationEnabled ? Math.max(1, Math.ceil(data.length / pageSize)) : 1;
  // Clamp rather than reset-via-effect: if data shrinks (filtering, role change)
  // the current page just re-derives to a valid one on the next render.
  const currentPage = Math.min(page, totalPages);

  const visibleRows = useMemo(() => {
    if (!paginationEnabled) return data;
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize, paginationEnabled]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-card">
        <table className="w-full border-collapse text-left text-fs-base">
          <thead>
            <tr className="border-b border-border bg-surface">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn("whitespace-nowrap px-4 py-3 font-semibold text-ink", column.headerClassName)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-muted">
                    <Inbox className="size-6 text-muted-light" />
                    {emptyMessage}
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={keyField(row)} className="border-b border-border last:border-b-0 hover:bg-surface/50">
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3 align-middle", column.className)}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginationEnabled && data.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-fs-sm text-muted-light">
            Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, data.length)} of{" "}
            {data.length} entries
          </p>
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
