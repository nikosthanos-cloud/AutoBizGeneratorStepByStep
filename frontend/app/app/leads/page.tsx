'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/app/auth/auth-context';
import { getAdminLeads, type AdminLead } from '@/lib/api';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Όλα' },
  { value: 'NEW', label: 'Νέα' },
  { value: 'CONTACTED', label: 'Επικοινωνήθηκε' },
  { value: 'QUALIFIED', label: 'Qualified' },
  { value: 'PROPOSAL_SENT', label: 'Proposal απεστάλη' },
  { value: 'WON', label: 'Κερδισμένο' },
  { value: 'LOST', label: 'Χαμένο' },
  { value: 'SENT_TO_BUILDER', label: 'Σε builder' },
];

const PACKAGE_OPTIONS = [
  { value: '', label: 'Όλα' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

export default function LeadsPage() {
  const { user } = useAuth();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const adminUser = user
    ? { id: user.id, email: user.email, role: user.role }
    : null;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      'admin-leads',
      pageIndex,
      pageSize,
      statusFilter || null,
      packageFilter || null,
    ],
    queryFn: () =>
      getAdminLeads(
        {
          page: pageIndex + 1,
          limit: pageSize,
          ...(statusFilter && { status: statusFilter }),
          ...(packageFilter && { selected_package: packageFilter }),
        },
        adminUser!,
      ),
    enabled: !!adminUser && adminUser.role === 'ADMIN',
  });

  const columns = useMemo<ColumnDef<AdminLead>[]>(
    () => [
      {
        accessorKey: 'customerName',
        header: 'Όνομα',
        cell: (c) => c.getValue() ?? '—',
      },
      {
        accessorKey: 'customerEmail',
        header: 'Email',
        cell: (c) => c.getValue() ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (c) => String(c.getValue()),
      },
      {
        accessorKey: 'selectedPackage',
        header: 'Πακέτο',
        cell: (c) => c.getValue() ?? '—',
      },
      {
        accessorKey: 'source',
        header: 'Πηγή',
        cell: (c) => c.getValue() ?? '—',
      },
      {
        accessorKey: 'createdAt',
        header: 'Ημ/νία',
        cell: (c) =>
          new Date(String(c.getValue())).toLocaleDateString('el-GR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <Link
            href={`/app/leads/${row.original.id}`}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary hover:bg-primary/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Details
          </Link>
        ),
      },
    ],
    [],
  );

  const tableData = useMemo(() => data?.data ?? [], [data?.data]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!adminUser || adminUser.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          Δεν έχετε δικαιώματα για προβολή leads. Απαιτείται ρόλος Admin.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">
          Σφάλμα: {error instanceof Error ? error.message : 'Άγνωστο'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Leads</h1>

      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="mr-2 text-sm text-muted-foreground">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPageIndex(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 text-sm text-muted-foreground">Πακέτο</label>
          <select
            value={packageFilter}
            onChange={(e) => {
              setPackageFilter(e.target.value);
              setPageIndex(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {PACKAGE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mr-2 text-sm text-muted-foreground">Αναζήτηση</label>
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Φίλτρο..."
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm w-48"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            Φόρτωση...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-border bg-muted/30">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left font-medium px-4 py-3"
                    >
                      <div
                        className={cn(
                          h.column.getCanSort() && 'cursor-pointer select-none flex items-center gap-1',
                        )}
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === 'asc' && (
                          <ChevronUp className="h-4 w-4" />
                        )}
                        {h.column.getIsSorted() === 'desc' && (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Δεν βρέθηκαν leads
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-muted/20"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {data && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Σύνολο {data.total} leads · Σελίδα {data.page} / {data.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0 || isLoading}
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Προηγούμενο
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={
                pageIndex >= (data.totalPages - 1) || isLoading
              }
              className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50"
            >
              Επόμενο
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
