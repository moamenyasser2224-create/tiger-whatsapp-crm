import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, MessageTemplate, PaginatedCustomers, ListOption } from '../types/index.js';
import { CUSTOMER_SOURCES, CUSTOMER_STATUSES } from '../types/index.js';
import { CustomerModal } from '../components/CustomerModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { DueTodayBanner } from '../components/DueTodayBanner.js';
import {
  formatDate,
  isOverdue,
  generateWhatsAppUrl,
  matchesArabicSearch,
  getStatusLabel,
  getSourceLabel,
} from '../lib/utils.js';
import { MotionPage } from '../components/motion/MotionPage.js';
import {
  LedgerButton,
  LedgerInput,
  LedgerTable,
  LedgerModal,
} from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';

export const CustomersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Dynamic Options (Statuses and Sources)
  const { data: statusOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options', 'status'],
    queryFn: async () => {
      const res = await api.get('/options?type=status');
      return res.data.data;
    },
  });

  const { data: sourceOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options', 'source'],
    queryFn: async () => {
      const res = await api.get('/options?type=source');
      return res.data.data;
    },
  });

  // View state: 'ledger' (table), 'cards' (index cards), 'kanban' (stages board)
  const [viewMode, setViewMode] = useState<'ledger' | 'cards' | 'kanban'>('ledger');

  // Filters and pagination state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'next' | 'last' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = viewMode === 'kanban' ? 50 : 15;

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [importResult, setImportResult] = useState<{ importedCount: number; skippedCount: number } | null>(null);
  const [importing, setImporting] = useState(false);

  // Fetch Customers
  const { data: customerData, isLoading } = useQuery<PaginatedCustomers>({
    queryKey: ['customers', { search, status, source, city, sortBy, sortOrder, page, limit }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (source) params.append('source', source);
      if (city) params.append('city', city);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);
      params.append('page', String(page));
      params.append('limit', String(limit));

      const { data } = await api.get(`/customers?${params.toString()}`);
      return data.data;
    },
  });

  // Fetch Message Templates for WhatsApp click action
  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates');
      return data.data || [];
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeletingCustomer(null);
    },
  });

  // Fast Status Change Mutation for Kanban & Quick Actions
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      await api.put(`/customers/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleCustomerSave = async (formData: any, force = false) => {
    if (editingCustomer) {
      await api.put(`/customers/${editingCustomer.id}`, formData);
    } else {
      await api.post('/customers', { ...formData, force });
    }
    queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleExportCsv = async () => {
    try {
      const response = await api.get('/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tiger_customers_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    setImporting(true);
    try {
      const { data } = await api.post('/customers/import', { csvText: importCsvText });
      setImportResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to import CSV file');
    } finally {
      setImporting(false);
    }
  };

  const getTemplateForCustomer = (c: Customer) => {
    const tpl = templates.find((t) => t.status === c.status);
    return tpl?.body;
  };

  // Status list to render Kanban columns
  const availableStatuses = statusOptions.length > 0
    ? statusOptions.map((opt) => opt.label)
    : (CUSTOMER_STATUSES as readonly string[]);

  // Filtered customers locally if search query is active
  const displayedItems = (customerData?.items || []).filter((item) => {
    if (!search) return true;
    return (
      matchesArabicSearch(item.name, search) ||
      matchesArabicSearch(item.company || '', search) ||
      matchesArabicSearch(item.phone, search) ||
      matchesArabicSearch(item.city || '', search) ||
      matchesArabicSearch(item.notes || '', search)
    );
  });

  return (
    <MotionPage className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-500">
            <span>Tiger Operations</span>
            <span>/</span>
            <span>Customers Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white mt-1 flex items-center gap-2.5">
            <LedgerIcon name="ledger-book" size={26} />
            <span>Customers &amp; Pipeline</span>
          </h1>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
            Manage customer accounts, verify communication consents, and track deal stages across certified ledger entries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <LedgerButton
            variant="primary"
            size="sm"
            icon="plus"
            onClick={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
          >
            Add Customer
          </LedgerButton>

          <LedgerButton
            variant="secondary"
            size="sm"
            icon="upload"
            onClick={() => {
              setImportCsvText('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
          >
            Import CSV
          </LedgerButton>

          <LedgerButton
            variant="secondary"
            size="sm"
            icon="download"
            onClick={handleExportCsv}
          >
            Export CSV
          </LedgerButton>
        </div>
      </div>

      {/* 2. Due Today Banner */}
      <DueTodayBanner
        onCustomerClick={(cust) => {
          setEditingCustomer(cust);
          setIsCustomerModalOpen(true);
        }}
      />

      {/* 3. Filter Bar & 3-Way View Switcher */}
      <div className="border-2 border-neutral-900 dark:border-white bg-[#faf9f5] dark:bg-[#151515] p-3 shadow-solid-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 3-Way View Switcher */}
          <div className="inline-flex border-2 border-neutral-900 dark:border-white bg-white dark:bg-black p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <LedgerIcon name="table" size={14} />
              <span>Ledger Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <LedgerIcon name="cards" size={14} />
              <span>Index Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900'
              }`}
            >
              <LedgerIcon name="kanban" size={14} />
              <span>Stages Board</span>
            </button>
          </div>

          {/* Quick Record Counter */}
          <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
            <span>Records shown:</span>
            <span className="font-bold tabular-nums border border-neutral-400 dark:border-neutral-600 px-1.5 py-0.5 bg-white dark:bg-black">
              {displayedItems.length}
            </span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-dashed border-neutral-300 dark:border-neutral-700">
          {/* Search */}
          <div className="relative">
            <LedgerInput
              placeholder="Search by name, company, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="text-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-black border-1.5 border-neutral-900 dark:border-white px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            >
              <option value="">All Pipeline Stages</option>
              {availableStatuses.map((st) => (
                <option key={st} value={st}>
                  {getStatusLabel(st)}
                </option>
              ))}
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-black border-1.5 border-neutral-900 dark:border-white px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            >
              <option value="">All Lead Sources</option>
              {sourceOptions.length > 0
                ? sourceOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {getSourceLabel(opt.label)}
                    </option>
                  ))
                : CUSTOMER_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {getSourceLabel(src)}
                    </option>
                  ))}
            </select>
          </div>

          {/* Sort Control */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [any, any];
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full bg-white dark:bg-black border-1.5 border-neutral-900 dark:border-white px-2.5 py-2 text-xs outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
            >
              <option value="createdAt-desc">Newest Added First</option>
              <option value="createdAt-asc">Oldest Added First</option>
              <option value="next-asc">Upcoming Follow-up Soonest</option>
              <option value="name-asc">Alphabetical (A - Z)</option>
              <option value="status-asc">Group by Stage</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. VIEW 1: Ledger Table View */}
      {viewMode === 'ledger' && (
        <LedgerTable>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200">
                <th className="px-4 py-3 font-bold">Client &amp; Organization</th>
                <th className="px-4 py-3 font-bold font-mono">Phone Number</th>
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">Consent Verified</th>
                <th className="px-4 py-3 font-bold text-center">Stage Stamp</th>
                <th className="px-4 py-3 font-bold">Next Follow-up</th>
                <th className="px-4 py-3 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-full" />
                    </td>
                  </tr>
                ))
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500 font-mono">
                    No customer records match your filter criteria in the ledger.
                  </td>
                </tr>
              ) : (
                displayedItems.map((customer) => {
                  const overdue = isOverdue(customer.next);
                  const tplBody = getTemplateForCustomer(customer);
                  const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-neutral-100/50 dark:hover:bg-neutral-900/50 transition-colors"
                    >
                      {/* Name & Company */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-neutral-950 dark:text-white">
                          {customer.name}
                        </div>
                        {customer.company && (
                          <div className="text-[11px] text-neutral-600 dark:text-neutral-400 font-mono mt-0.5">
                            {customer.company}
                          </div>
                        )}
                        {customer.city && (
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {customer.city}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 font-mono tabular-nums text-neutral-800 dark:text-neutral-200" dir="ltr">
                        {customer.phone}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="border border-neutral-400 dark:border-neutral-600 px-1.5 py-0.5">
                          {getSourceLabel(customer.source)}
                        </span>
                      </td>

                      {/* Explicit Consent & Date */}
                      <td className="px-4 py-3">
                        {customer.consent ? (
                          <div className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300">
                            <span className="inline-block border border-neutral-900 dark:border-white px-1 font-bold text-emerald-600 dark:text-emerald-400">
                              VERIFIED ✓
                            </span>
                            <div className="text-[10px] text-neutral-500 mt-0.5 tabular-nums">
                              {formatDate(customer.consentDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono border border-dashed border-neutral-400 px-1 text-neutral-500">
                            Unconfirmed
                          </span>
                        )}
                      </td>

                      {/* Status Stamp */}
                      <td className="px-4 py-3 text-center">
                        <RubberStamp
                          label={getStatusLabel(customer.status)}
                          recordId={customer.id}
                        />
                      </td>

                      {/* Next Followup */}
                      <td className="px-4 py-3 font-mono text-xs">
                        {customer.next ? (
                          <div>
                            <span
                              className={`tabular-nums ${
                                overdue
                                  ? 'font-bold underline decoration-2 text-black dark:text-white'
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              {formatDate(customer.next)}
                            </span>
                            {overdue && (
                              <span className="block text-[10px] font-bold text-neutral-900 dark:text-white">
                                [ OVERDUE ]
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Direct WhatsApp Messaging"
                            className="p-1.5 border border-neutral-900 dark:border-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            <LedgerIcon name="chat" size={14} />
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsCustomerModalOpen(true);
                            }}
                            title="Edit Record"
                            className="p-1.5 border border-neutral-400 dark:border-neutral-600 hover:border-neutral-900 dark:hover:border-white transition-colors cursor-pointer"
                          >
                            <LedgerIcon name="edit" size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCustomer(customer)}
                            title="Delete Record"
                            className="p-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <LedgerIcon name="trash" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {customerData && customerData.totalPages > 1 && (
            <div className="flex items-center justify-between border-t-2 border-neutral-900 dark:border-neutral-100 p-3 bg-neutral-50 dark:bg-neutral-900 font-mono text-xs">
              <div>
                Total <span className="font-bold tabular-nums">{customerData.total}</span> records • Page{' '}
                <span className="font-bold tabular-nums">{customerData.page}</span> of{' '}
                <span className="font-bold tabular-nums">{customerData.totalPages}</span>
              </div>
              <div className="flex items-center gap-1">
                <LedgerButton
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </LedgerButton>
                <span className="px-2 font-bold tabular-nums">{page}</span>
                <LedgerButton
                  size="sm"
                  variant="secondary"
                  disabled={page >= customerData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </LedgerButton>
              </div>
            </div>
          )}
        </LedgerTable>
      )}

      {/* 5. VIEW 2: Index Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-neutral-400 p-8 text-center text-neutral-500 font-mono text-xs">
              No index cards match current parameters.
            </div>
          ) : (
            displayedItems.map((customer) => {
              const overdue = isOverdue(customer.next);
              const tplBody = getTemplateForCustomer(customer);
              const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);

              return (
                <div
                  key={customer.id}
                  className="border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#121212] shadow-solid-sm flex flex-col justify-between relative"
                >
                  {/* Top Index Card Raised Tab */}
                  <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono">
                    <span className="font-bold">RECORD #{customer.id.slice(-6).toUpperCase()}</span>
                    <span className="text-[10px] text-neutral-500">{getSourceLabel(customer.source)}</span>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-neutral-950 dark:text-white">
                          {customer.name}
                        </h3>
                        {customer.company && (
                          <p className="text-neutral-600 dark:text-neutral-400 font-mono text-xs mt-0.5">
                            {customer.company}
                          </p>
                        )}
                        {customer.city && (
                          <p className="text-neutral-500 font-mono text-[11px]">{customer.city}</p>
                        )}
                      </div>

                      {/* Stamp on Card */}
                      <RubberStamp
                        label={getStatusLabel(customer.status)}
                        recordId={customer.id}
                      />
                    </div>

                    <div className="border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2 space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Phone:</span>
                        <span dir="ltr" className="tabular-nums font-bold">
                          {customer.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Consent:</span>
                        <span className="font-bold">
                          {customer.consent ? `Verified (${formatDate(customer.consentDate)})` : 'Unconfirmed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Next Action:</span>
                        <span
                          className={`tabular-nums ${
                            overdue ? 'font-bold underline decoration-2' : ''
                          }`}
                        >
                          {formatDate(customer.next)} {overdue ? '[OVERDUE]' : ''}
                        </span>
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="border border-neutral-300 dark:border-neutral-800 p-2 text-[11px] text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-950 font-mono line-clamp-2">
                        {customer.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t-2 border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-900 dark:border-white font-bold text-xs hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                      <LedgerIcon name="chat" size={14} />
                      <span>WhatsApp</span>
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsCustomerModalOpen(true);
                        }}
                        className="p-1.5 border border-neutral-400 dark:border-neutral-600 hover:border-neutral-900 cursor-pointer"
                        title="Edit"
                      >
                        <LedgerIcon name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCustomer(customer)}
                        className="p-1.5 border border-neutral-400 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800 cursor-pointer"
                        title="Delete"
                      >
                        <LedgerIcon name="trash" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 6. VIEW 3: Stages Board View (Kanban) */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {availableStatuses.map((st) => {
            const stageCustomers = displayedItems.filter((c) => c.status === st);

            return (
              <div
                key={st}
                className="w-72 sm:w-80 flex-shrink-0 border-2 border-neutral-900 dark:border-white bg-[#faf9f5] dark:bg-[#141414] shadow-solid-sm flex flex-col max-h-[75vh]"
              >
                {/* Stage Header */}
                <div className="border-b-2 border-neutral-900 dark:border-white p-3 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-neutral-950 dark:text-white">
                      {getStatusLabel(st)}
                    </span>
                    <span className="font-mono text-xs border border-neutral-900 dark:border-white px-1.5 py-0.5 bg-white dark:bg-black font-bold tabular-nums">
                      {stageCustomers.length}
                    </span>
                  </div>
                </div>

                {/* Cards Column */}
                <div className="p-3 space-y-3 overflow-y-auto flex-1">
                  {stageCustomers.length === 0 ? (
                    <div className="border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center text-neutral-400 font-mono text-[11px]">
                      No records in this stage.
                    </div>
                  ) : (
                    stageCustomers.map((customer) => {
                      const overdue = isOverdue(customer.next);
                      const tplBody = getTemplateForCustomer(customer);
                      const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);

                      return (
                        <div
                          key={customer.id}
                          className="border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-[#1e1e1e] p-3 shadow-xs space-y-2 select-none"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <h4 className="font-bold text-xs text-neutral-950 dark:text-white">
                                {customer.name}
                              </h4>
                              {customer.company && (
                                <p className="text-[11px] text-neutral-500 font-mono">
                                  {customer.company}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-neutral-400 border border-neutral-300 dark:border-neutral-700 px-1">
                              {getSourceLabel(customer.source)}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono tabular-nums text-neutral-700 dark:text-neutral-300 flex justify-between">
                            <span dir="ltr">{customer.phone}</span>
                            {customer.next && (
                              <span className={overdue ? 'font-bold underline decoration-2' : ''}>
                                {formatDate(customer.next)}
                              </span>
                            )}
                          </div>

                          {/* Quick Stage Mover Selector */}
                          <div className="pt-2 border-t border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
                            <select
                              value={customer.status}
                              onChange={(e) =>
                                updateStatusMutation.mutate({
                                  id: customer.id,
                                  newStatus: e.target.value,
                                })
                              }
                              className="text-[10px] font-mono border border-neutral-400 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 px-1 py-0.5 outline-none cursor-pointer"
                              title="Transition customer to another stage"
                            >
                              {availableStatuses.map((opt) => (
                                <option key={opt} value={opt}>
                                  → {getStatusLabel(opt)}
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black cursor-pointer"
                                title="WhatsApp"
                              >
                                <LedgerIcon name="chat" size={12} />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCustomer(customer);
                                  setIsCustomerModalOpen(true);
                                }}
                                className="p-1 border border-neutral-400 hover:border-neutral-900 cursor-pointer"
                                title="Edit"
                              >
                                <LedgerIcon name="edit" size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleCustomerSave}
        initialData={editingCustomer}
      />

      {/* 8. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={() => {
          if (deletingCustomer) {
            deleteMutation.mutate(deletingCustomer.id);
          }
        }}
        title="Confirm Record Deletion"
        message={`Are you sure you want to permanently delete "${deletingCustomer?.name}" from the customers ledger?`}
        confirmText="Yes, Delete Record"
        danger={true}
      />

      {/* 9. Import CSV Modal */}
      <LedgerModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Customer Records from CSV"
      >
        <div className="space-y-4">
          {importResult ? (
            <div className="border-2 border-neutral-900 dark:border-white p-4 text-center font-mono space-y-1">
              <p className="font-bold text-sm">Batch import completed</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Imported: <span className="font-bold tabular-nums">{importResult.importedCount}</span> records •
                Skipped: <span className="font-bold tabular-nums">{importResult.skippedCount}</span> duplicates
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                Paste CSV content directly here (ensure columns for name and phone in international format):
              </p>
              <textarea
                rows={6}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="name,phone,company,source,status&#10;Alexander Vance,966501234567,Tiger Tech,WhatsApp,New"
                dir="ltr"
                className="w-full border-1.5 border-neutral-900 dark:border-white p-3 font-mono text-xs bg-white dark:bg-black text-neutral-950 dark:text-white outline-none"
              />
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton
              variant="secondary"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Close
            </LedgerButton>
            {!importResult && (
              <LedgerButton
                variant="primary"
                size="sm"
                disabled={importing || !importCsvText.trim()}
                onClick={handleImportCsv}
              >
                {importing ? 'Importing...' : 'Begin Batch Import'}
              </LedgerButton>
            )}
          </div>
        </div>
      </LedgerModal>
    </MotionPage>
  );
};
