import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, MessageTemplate, PaginatedCustomers, ListOption } from '../types/index.js';
import { CUSTOMER_SOURCES, CUSTOMER_STATUSES } from '../types/index.js';
import { CustomerModal } from '../components/CustomerModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { DueTodayBanner } from '../components/DueTodayBanner.js';
import { WhatsAppDispatchModal } from '../components/WhatsAppDispatchModal.js';
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
import { StatusBadge } from '../components/common/StatusBadge.js';
import {
  Plus,
  Upload,
  Download,
  Table as TableIcon,
  LayoutGrid,
  Kanban,
  Search,
  MessageCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

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
  const [dispatchCustomer, setDispatchCustomer] = useState<{ id: string; name: string; phone: string; message: string } | null>(null);
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

  // Save Customer (Create / Update)
  const handleCustomerSave = async (formData: any, force = false) => {
    if (editingCustomer) {
      await api.put(`/customers/${editingCustomer.id}`, formData);
    } else {
      await api.post('/customers', { ...formData, force });
    }
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
  };

  // Export CSV
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

  // Import CSV
  const handleImportCsv = async () => {
    if (!importCsvText.trim()) return;
    setImporting(true);
    try {
      const { data } = await api.post('/customers/import', { csvText: importCsvText });
      setImportResult(data.data);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (err) {
      console.error('Import error:', err);
    } finally {
      setImporting(false);
    }
  };

  // Template lookup helper
  const getTemplateForCustomer = (customer: Customer) => {
    const tpl = templates.find((t) => t.status === customer.status);
    return tpl ? tpl.body : undefined;
  };

  const rawCustomers: Customer[] = (customerData?.items || (customerData as any)?.customers || []) as Customer[];
  const displayedItems: Customer[] = search
    ? rawCustomers.filter(
        (c: Customer) =>
          matchesArabicSearch(c.name, search) ||
          (c.company && matchesArabicSearch(c.company, search)) ||
          c.phone.includes(search)
      )
    : rawCustomers;

  const availableStatuses = statusOptions.length > 0
    ? statusOptions.map((o) => o.label)
    : CUSTOMER_STATUSES;

  return (
    <MotionPage className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
            <span>Tiger CRM</span>
            <span>/</span>
            <span>Accounts &amp; Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
            Customers &amp; Pipeline
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage customer accounts, track lead stages, and coordinate follow-up schedules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <LedgerButton
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </LedgerButton>

          <LedgerButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setImportCsvText('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
          >
            <Upload className="h-4 w-4 text-muted" />
            <span>Import CSV</span>
          </LedgerButton>

          <LedgerButton
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
          >
            <Download className="h-4 w-4 text-muted" />
            <span>Export CSV</span>
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
      <div className="border border-border bg-card rounded-xl p-4 shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 3-Way View Switcher */}
          <div className="inline-flex rounded-lg border border-border bg-bg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-card text-text font-semibold shadow-subtle'
                  : 'text-muted hover:text-text font-normal'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-card text-text font-semibold shadow-subtle'
                  : 'text-muted hover:text-text font-normal'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-card text-text font-semibold shadow-subtle'
                  : 'text-muted hover:text-text font-normal'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Quick Record Counter */}
          <div className="text-xs text-muted flex items-center gap-2">
            <span>Records shown:</span>
            <span className="font-semibold text-text tabular-nums px-2 py-0.5 rounded-md bg-bg border border-border">
              {displayedItems.length}
            </span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-border">
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
              className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text outline-none focus:border-accent shadow-subtle"
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
              className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text outline-none focus:border-accent shadow-subtle"
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
              className="w-full bg-card border border-border rounded-lg px-2.5 py-2 text-xs text-text outline-none focus:border-accent shadow-subtle"
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

      {/* 4. VIEW 1: Table View */}
      {viewMode === 'ledger' && (
        <LedgerTable>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-bg text-muted font-medium text-xs border-b border-border">
                <th className="px-4 py-3 font-semibold">Client &amp; Organization</th>
                <th className="px-4 py-3 font-semibold font-mono">Phone Number</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Consent</th>
                <th className="px-4 py-3 font-semibold text-center">Stage</th>
                <th className="px-4 py-3 font-semibold">Next Follow-up</th>
                <th className="px-4 py-3 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-border/50 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : displayedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    No customer records match your filter criteria.
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
                      className="hover:bg-bg/40 transition-colors"
                    >
                      {/* Name & Company */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-text">
                          {customer.name}
                        </div>
                        {customer.company && (
                          <div className="text-[11px] text-muted mt-0.5">
                            {customer.company}
                          </div>
                        )}
                        {customer.city && (
                          <div className="text-[10px] text-muted">
                            {customer.city}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 font-mono tabular-nums text-text" dir="ltr">
                        {customer.phone}
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3 text-xs text-muted">
                        <span className="px-2 py-0.5 rounded-md bg-bg border border-border">
                          {getSourceLabel(customer.source)}
                        </span>
                      </td>

                      {/* Consent Verified */}
                      <td className="px-4 py-3">
                        {customer.consent ? (
                          <div className="text-xs">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-accent-soft text-accent text-xs font-medium">
                              Verified
                            </span>
                            <div className="text-[10px] text-muted mt-0.5 tabular-nums">
                              {formatDate(customer.consentDate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">
                            Unconfirmed
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3 text-center">
                        <StatusBadge
                          label={getStatusLabel(customer.status)}
                          statusKey={customer.status}
                        />
                      </td>

                      {/* Next Followup */}
                      <td className="px-4 py-3 text-xs">
                        {customer.next ? (
                          <div>
                            <span className={`tabular-nums ${overdue ? 'text-danger font-medium' : 'text-text'}`}>
                              {formatDate(customer.next)}
                            </span>
                            {overdue && (
                              <span className="block text-[10px] text-danger font-medium">
                                Overdue
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setDispatchCustomer({
                                id: customer.id,
                                name: customer.name,
                                phone: customer.phone,
                                message: (tplBody || 'Hello {name}!').replace(/\{name\}/g, customer.name),
                              });
                            }}
                            title="Send WhatsApp Message"
                            className="p-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsCustomerModalOpen(true);
                            }}
                            title="Edit Record"
                            className="p-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingCustomer(customer)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg border border-border text-muted hover:text-danger hover:bg-danger-soft transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
            <div className="flex items-center justify-between border-t border-border p-3 bg-card text-xs text-muted">
              <div>
                Total <span className="font-semibold text-text tabular-nums">{customerData.total}</span> records &bull; Page{' '}
                <span className="font-semibold text-text tabular-nums">{customerData.page}</span> of{' '}
                <span className="font-semibold text-text tabular-nums">{customerData.totalPages}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <LedgerButton
                  size="sm"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </LedgerButton>
                <span className="px-2 font-medium text-text tabular-nums">{page}</span>
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

      {/* 5. VIEW 2: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedItems.length === 0 ? (
            <div className="col-span-full border border-dashed border-border rounded-xl p-8 text-center text-muted text-xs">
              No customer accounts match current parameters.
            </div>
          ) : (
            displayedItems.map((customer) => {
              const overdue = isOverdue(customer.next);
              const tplBody = getTemplateForCustomer(customer);
              const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);

              return (
                <div
                  key={customer.id}
                  className="border border-border bg-card rounded-xl shadow-subtle p-5 flex flex-col justify-between hover:border-accent transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm text-text">
                          {customer.name}
                        </h3>
                        {customer.company && (
                          <p className="text-muted text-xs mt-0.5">
                            {customer.company}
                          </p>
                        )}
                        {customer.city && (
                          <p className="text-muted text-[11px]">{customer.city}</p>
                        )}
                      </div>

                      <StatusBadge
                        label={getStatusLabel(customer.status)}
                        statusKey={customer.status}
                      />
                    </div>

                    <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted">Phone:</span>
                        <span dir="ltr" className="tabular-nums font-mono text-text">
                          {customer.phone}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Consent:</span>
                        <span className="text-text font-medium">
                          {customer.consent ? `Verified (${formatDate(customer.consentDate)})` : 'Unconfirmed'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Next Action:</span>
                        <span className={`tabular-nums ${overdue ? 'text-danger font-medium' : 'text-text'}`}>
                          {formatDate(customer.next)} {overdue ? '(Overdue)' : ''}
                        </span>
                      </div>
                    </div>

                    {customer.notes && (
                      <div className="border border-border p-2.5 rounded-lg text-xs text-muted bg-bg line-clamp-2">
                        {customer.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-border pt-3 mt-4 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDispatchCustomer({
                          id: customer.id,
                          name: customer.name,
                          phone: customer.phone,
                          message: (tplBody || 'Hello {name}!').replace(/\{name\}/g, customer.name),
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-text hover:bg-bg transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-muted" />
                      <span>WhatsApp</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomer(customer);
                          setIsCustomerModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-border text-muted hover:text-text hover:bg-bg cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCustomer(customer)}
                        className="p-1.5 rounded-lg border border-border text-muted hover:text-danger hover:bg-danger-soft cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
                className="w-80 shrink-0 bg-bg/50 border border-border rounded-xl p-3.5 flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <StatusBadge label={getStatusLabel(st)} statusKey={st} />
                  </div>
                  <span className="text-xs font-semibold text-muted tabular-nums">
                    {stageCustomers.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
                  {stageCustomers.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted">
                      No accounts in this stage
                    </div>
                  ) : (
                    stageCustomers.map((c) => {
                      const overdue = isOverdue(c.next);
                      const tplBody = getTemplateForCustomer(c);
                      const waUrl = generateWhatsAppUrl(c.phone, tplBody, c.name);

                      return (
                        <div
                          key={c.id}
                          className="bg-card border border-border rounded-lg p-3 shadow-subtle hover:border-accent transition-colors space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-semibold text-xs text-text truncate">
                              {c.name}
                            </h4>
                            <span className="text-[10px] text-muted shrink-0">
                              {getSourceLabel(c.source)}
                            </span>
                          </div>

                          {c.company && (
                            <p className="text-[11px] text-muted truncate">
                              {c.company}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border text-muted">
                            <span className="font-mono tabular-nums">{c.phone}</span>
                            <span className={overdue ? 'text-danger font-medium' : ''}>
                              {c.next ? formatDate(c.next) : 'No Follow-up'}
                            </span>
                          </div>

                          <div className="flex items-center justify-end gap-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDispatchCustomer({
                                  id: c.id,
                                  name: c.name,
                                  phone: c.phone,
                                  message: (tplBody || 'Hello {name}!').replace(/\{name\}/g, c.name),
                                });
                              }}
                              className="p-1 rounded text-muted hover:text-text hover:bg-bg cursor-pointer"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(c);
                                setIsCustomerModalOpen(true);
                              }}
                              className="p-1 rounded text-muted hover:text-text hover:bg-bg"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCustomer(c)}
                              className="p-1 rounded text-muted hover:text-danger hover:bg-danger-soft"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
        message={`Are you sure you want to permanently delete "${deletingCustomer?.name}"?`}
        confirmText="Delete Record"
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
            <div className="border border-border bg-bg rounded-lg p-4 text-center space-y-1">
              <p className="font-semibold text-sm text-text">Batch import completed</p>
              <p className="text-xs text-muted">
                Imported: <span className="font-semibold text-accent tabular-nums">{importResult.importedCount}</span> records &bull;
                Skipped: <span className="font-semibold text-danger tabular-nums">{importResult.skippedCount}</span> duplicates
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted">
                Paste CSV content directly here (ensure columns for name and phone in international format):
              </p>
              <textarea
                rows={6}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="name,phone,company,source,status&#10;Alexander Vance,966501234567,Tiger Tech,WhatsApp,New"
                dir="ltr"
                className="w-full border border-border bg-card rounded-lg p-3 font-mono text-xs text-text outline-none focus:border-accent shadow-subtle"
              />
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
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

      {/* WhatsApp Cloud API & Web Dispatch Modal */}
      <WhatsAppDispatchModal
        isOpen={!!dispatchCustomer}
        onClose={() => setDispatchCustomer(null)}
        customer={dispatchCustomer}
        defaultMessage={dispatchCustomer?.message}
        onSent={() => {
          queryClient.invalidateQueries({ queryKey: ['customers'] });
        }}
      />
    </MotionPage>
  );
};
