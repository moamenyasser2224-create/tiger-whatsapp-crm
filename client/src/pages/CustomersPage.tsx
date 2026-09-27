import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, MessageTemplate, PaginatedCustomers, CustomerStatus, CustomerSource, ListOption } from '../types/index.js';
import { CUSTOMER_SOURCES, CUSTOMER_STATUSES } from '../types/index.js';
import { CustomerModal } from '../components/CustomerModal.js';
import { ConfirmModal } from '../components/ConfirmModal.js';
import { DueTodayBanner } from '../components/DueTodayBanner.js';
import {
  formatDateArabic,
  isOverdue,
  generateWhatsAppUrl,
  STATUS_COLORS,
} from '../lib/utils.js';
import {
  Search,
  Filter,
  UserPlus,
  FileSpreadsheet,
  Upload,
  MessageCircle,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Building,
  MapPin,
  ShieldCheck,
  X,
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

  // Filters and pagination state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [city, setCity] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'next' | 'last' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 15;

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
      link.setAttribute('download', `customers_full_${new Date().toISOString().split('T')[0]}.csv`);
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
      alert(e.response?.data?.error || 'فشل استيراد ملف CSV');
    } finally {
      setImporting(false);
    }
  };

  const getTemplateForCustomer = (c: Customer) => {
    const tpl = templates.find((t) => t.status === c.status);
    return tpl?.body;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">إدارة العملاء</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            عرض وتعديل وتصنيف العملاء وإرسال رسائل واتساب مخصصة بنقرة واحدة
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-4 py-2.5 text-xs font-bold transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>إضافة عميل</span>
          </button>

          <button
            onClick={() => {
              setImportCsvText('');
              setImportResult(null);
              setIsImportModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <Upload className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            <span>استيراد CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3.5 py-2.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
            <span>تصدير CSV</span>
          </button>
        </div>
      </div>

      {/* Due Today & Overdue Banner */}
      <DueTodayBanner
        onCustomerClick={(cust) => {
          setEditingCustomer(cust);
          setIsCustomerModalOpen(true);
        }}
      />

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="بحث بالاسم، الشركة، أو الملاحظات..."
              className="w-full rounded-xl border border-neutral-300 pr-9 pl-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
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
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            >
              <option value="">جميع الحالات</option>
              {statusOptions.length > 0
                ? statusOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))
                : CUSTOMER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
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
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            >
              <option value="">جميع المصادر</option>
              {sourceOptions.length > 0
                ? sourceOptions.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))
                : CUSTOMER_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as [any, any];
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            >
              <option value="createdAt-desc">الأحدث إضافة أولاً</option>
              <option value="createdAt-asc">الأقدم إضافة أولاً</option>
              <option value="next-asc">المتابعة القادمة الأقرب</option>
              <option value="name-asc">ترتيب أبجدي (الاسم أ-ي)</option>
              <option value="status-asc">الحالة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-gray-50/80 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">العميل</th>
                <th className="px-5 py-3.5 font-bold">رقم الجوال</th>
                <th className="px-5 py-3.5 font-bold">المصدر</th>
                <th className="px-5 py-3.5 font-bold">الحالة</th>
                <th className="px-5 py-3.5 font-bold">آخر تواصل</th>
                <th className="px-5 py-3.5 font-bold">المتابعة القادمة</th>
                <th className="px-5 py-3.5 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : customerData?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 dark:text-gray-400">
                    لا يوجد عملاء مطابقين للبحث أو الفلترة الحالية.
                  </td>
                </tr>
              ) : (
                customerData?.items.map((customer) => {
                  const overdue = isOverdue(customer.next);
                  const tplBody = getTemplateForCustomer(customer);
                  const waUrl = generateWhatsAppUrl(customer.phone, tplBody, customer.name);
                  const statusStyle = STATUS_COLORS[customer.status] || {
                    bg: 'bg-neutral-100 dark:bg-neutral-900',
                    text: 'text-neutral-900 dark:text-neutral-100 font-bold',
                    border: 'border-neutral-900 dark:border-neutral-300',
                  };

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Name & Company */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-neutral-900 dark:text-white">
                          {customer.name}
                        </div>
                        {customer.company && (
                          <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            <Building className="h-3 w-3" />
                            <span>{customer.company}</span>
                          </div>
                        )}
                        {customer.city && (
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400 dark:text-neutral-500">
                            <MapPin className="h-3 w-3" />
                            <span>{customer.city}</span>
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 font-mono text-neutral-700 dark:text-neutral-300" dir="ltr">
                        {customer.phone}
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3.5">
                        <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2 py-1 text-[11px] font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                          {customer.source}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">
                        {formatDateArabic(customer.last)}
                      </td>

                      {/* Next Followup */}
                      <td className="px-5 py-3.5">
                        {customer.next ? (
                          <div
                            className={`inline-flex items-center gap-1 font-semibold ${
                              overdue
                                ? 'text-black dark:text-white font-extrabold underline decoration-2'
                                : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDateArabic(customer.next)}</span>
                            {overdue && (
                              <span className="text-[10px] bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded font-bold">
                                متأخرة
                              </span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="إرسال رسالة واتساب بالقالب المخصص"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-900 text-neutral-900 hover:bg-black hover:text-white dark:border-neutral-300 dark:text-neutral-300 dark:hover:bg-white dark:hover:text-black transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </a>

                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsCustomerModalOpen(true);
                            }}
                            title="تعديل العميل"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => setDeletingCustomer(customer)}
                            title="حذف العميل"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-200 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {customerData && customerData.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              إجمالي {customerData.total} عميل • الصفحة {customerData.page} من {customerData.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold px-2">{page}</span>
              <button
                disabled={page >= customerData.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 disabled:opacity-40 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleCustomerSave}
        initialData={editingCustomer}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingCustomer)}
        onClose={() => setDeletingCustomer(null)}
        onConfirm={() => {
          if (deletingCustomer) {
            deleteMutation.mutate(deletingCustomer.id);
          }
        }}
        title="تأكيد حذف العميل"
        message={`هل أنت متأكد من رغبتك في حذف العميل "${deletingCustomer?.name}"؟ سيتم نقله إلى سلة المحذوفات.`}
        confirmText="نعم، احذف العميل"
        danger={true}
      />

      {/* Import CSV Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800 mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                استيراد عملاء من ملف CSV
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importResult ? (
              <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-4 text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white text-center mb-4 font-bold">
                <p className="font-black text-sm">اكتمل الاستيراد بنجاح!</p>
                <p className="text-xs mt-1 font-medium">
                  تم استيراد: {importResult.importedCount} عميل • تم تخطي: {importResult.skippedCount} عميل
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                  الصق محتوى ملف CSV هنا مباشرة (تأكد من وجود عمود الاسم ورقم الجوال بالصيغة الدولية):
                </p>
                <textarea
                  rows={6}
                  value={importCsvText}
                  onChange={(e) => setImportCsvText(e.target.value)}
                  placeholder="name,phone,company,source,status&#10;محمد أحمد,966501234567,شركة النور,واتساب,جديد"
                  dir="ltr"
                  className="w-full rounded-xl border border-neutral-300 p-3 font-mono text-xs focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
                />
              </>
            )}

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
              >
                إغلاق
              </button>
              {!importResult && (
                <button
                  onClick={handleImportCsv}
                  disabled={importing || !importCsvText.trim()}
                  className="rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-5 py-2 text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {importing ? 'جاري الاستيراد...' : 'بدء الاستيراد'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
