import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, ListOption } from '../types/index.js';
import { LedgerButton } from './common/LedgerComponents.js';
import { DuplicatePhoneModal } from './DuplicatePhoneModal.js';
import { formatDate, getStatusLabel, getSourceLabel } from '../lib/utils.js';
import { X, AlertCircle, Plus, Calendar, Clock, Check } from 'lucide-react';

const customerFormSchema = z.object({
  name: z.string().min(2, 'Customer name must be at least 2 characters').max(120, 'Name is too long'),
  company: z.string().max(120).optional().nullable(),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^[0-9]{8,15}$/.test(v), {
      message: 'Phone number must be digits only in international format without + (8 to 15 digits)',
    }),
  city: z.string().max(100).optional().nullable(),
  sourceId: z.string().optional().nullable(),
  statusId: z.string().optional().nullable(),
  source: z.string().optional(),
  status: z.string().optional(),
  dealValue: z.preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().nullable().optional()),
  expectedCloseDate: z.string().optional().nullable(),
  last: z.string().optional().nullable(),
  next: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  consent: z.boolean().refine((val) => val === true, {
    message: 'Explicit customer consent for messaging is mandatory prior to saving',
  }),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData, force?: boolean) => Promise<any>;
  initialData?: Customer | null;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'activities' | 'tasks'>('details');

  const [duplicateWarning, setDuplicateWarning] = useState<{
    existingCustomer: Customer | null;
    attemptedPhone: string;
    pendingData: CustomerFormData | null;
  } | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // New activity form state
  const [activityType, setActivityType] = useState<'note' | 'call' | 'whatsapp' | 'meeting'>('note');
  const [activityContent, setActivityContent] = useState('');

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueAt, setTaskDueAt] = useState('');

  // Fetch dynamic list options
  const { data: listOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options'],
    queryFn: async () => {
      const res = await api.get('/options');
      return res.data.data;
    },
    staleTime: 60000,
  });

  const sources = listOptions.filter((o) => o.type === 'source');
  const statuses = listOptions.filter((o) => o.type === 'status');

  // Customer Activities Query
  const { data: activities = [], refetch: refetchActivities } = useQuery<any[]>({
    queryKey: ['crm', 'activities', initialData?.id],
    queryFn: async () => {
      if (!initialData?.id) return [];
      const res = await api.get(`/crm/customers/${initialData.id}/activities`);
      return res.data.data || [];
    },
    enabled: Boolean(initialData?.id && isOpen),
  });

  // Customer Tasks Query
  const { data: tasks = [], refetch: refetchTasks } = useQuery<any[]>({
    queryKey: ['crm', 'tasks', initialData?.id],
    queryFn: async () => {
      if (!initialData?.id) return [];
      const res = await api.get(`/crm/customers/${initialData.id}/tasks`);
      return res.data.data || [];
    },
    enabled: Boolean(initialData?.id && isOpen),
  });

  const queryClient = useQueryClient();

  // Add Activity Mutation
  const addActivityMutation = useMutation({
    mutationFn: async (payload: { type: string; content: string }) => {
      if (!initialData?.id) return;
      const res = await api.post(`/crm/customers/${initialData.id}/activities`, payload);
      return res.data;
    },
    onSuccess: () => {
      setActivityContent('');
      refetchActivities();
    },
  });

  // Add Task Mutation
  const addTaskMutation = useMutation({
    mutationFn: async (payload: { title: string; dueAt: string }) => {
      if (!initialData?.id) return;
      const res = await api.post(`/crm/customers/${initialData.id}/tasks`, payload);
      return res.data;
    },
    onSuccess: () => {
      setTaskTitle('');
      setTaskDueAt('');
      refetchTasks();
    },
  });

  // Toggle Task Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, done }: { taskId: string; done: boolean }) => {
      const res = await api.put(`/crm/tasks/${taskId}`, { done });
      return res.data;
    },
    onSuccess: () => {
      refetchTasks();
      queryClient.invalidateQueries({ queryKey: ['customers', 'due-today'] });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: '',
      company: '',
      phone: '',
      city: '',
      sourceId: '',
      statusId: '',
      dealValue: null,
      expectedCloseDate: '',
      last: '',
      next: '',
      notes: '',
      consent: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        company: initialData.company || '',
        phone: initialData.phone || '',
        city: initialData.city || '',
        sourceId: initialData.sourceId || (sources.find((s) => s.label === initialData.source)?.id || ''),
        statusId: initialData.statusId || (statuses.find((s) => s.label === initialData.status)?.id || ''),
        dealValue: initialData.dealValue || null,
        expectedCloseDate: initialData.expectedCloseDate ? initialData.expectedCloseDate.split('T')[0] : '',
        last: initialData.last ? initialData.last.split('T')[0] : '',
        next: initialData.next ? initialData.next.split('T')[0] : '',
        notes: initialData.notes || '',
        consent: Boolean(initialData.consent),
      });
    } else {
      reset({
        name: '',
        company: '',
        phone: '',
        city: '',
        sourceId: sources[0]?.id || '',
        statusId: statuses[0]?.id || '',
        source: sources[0]?.label || 'WhatsApp',
        status: statuses[0]?.label || 'New',
        dealValue: null,
        expectedCloseDate: '',
        last: '',
        next: '',
        notes: '',
        consent: false,
      });
    }
    setServerError(null);
    setDuplicateWarning(null);
    setActiveTab('details');
  }, [initialData, reset, isOpen, listOptions.length]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: CustomerFormData) => {
    setServerError(null);
    setSubmitting(true);

    try {
      const selectedSource = sources.find((s) => s.id === data.sourceId);
      const selectedStatus = statuses.find((s) => s.id === data.statusId);
      if (selectedSource) data.source = selectedSource.label;
      if (selectedStatus) data.status = selectedStatus.label;

      await onSubmit(data, false);
      onClose();
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.details?.duplicate) {
        setDuplicateWarning({
          existingCustomer: err.response.data.details.existingCustomer,
          attemptedPhone: data.phone,
          pendingData: data,
        });
      } else {
        setServerError(err.response?.data?.error || err.message || 'An error occurred while saving.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceConfirm = async () => {
    if (!duplicateWarning?.pendingData) return;
    setSubmitting(true);
    try {
      await onSubmit(duplicateWarning.pendingData, true);
      setDuplicateWarning(null);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Failed to force insert record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-black/40 overflow-y-auto" dir="ltr">
        <div className="relative w-full max-w-3xl border border-border bg-card rounded-xl shadow-subtle my-8 p-6 select-text">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-text">
                {initialData ? `Customer File: ${initialData.name}` : 'New Customer Account'}
              </h2>
              <div className="text-xs text-muted">
                {initialData ? `Record ID #${initialData.id.slice(0, 8)}` : 'Tiger Sales & Client Directory'}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted hover:text-text hover:bg-bg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Switcher */}
          {initialData && (
            <div className="flex bg-bg p-1 rounded-lg border border-border mb-5 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-card text-text font-semibold shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                Record Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-card text-text font-semibold shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                <span>Activity Timeline</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-border text-muted">
                  {activities.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-card text-text font-semibold shadow-subtle'
                    : 'text-muted hover:text-text font-normal'
                }`}
              >
                <span>Tasks &amp; Follow-ups</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-border text-muted">
                  {tasks.length}
                </span>
              </button>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-4 border border-danger/40 bg-danger-soft text-danger p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER DETAILS FORM */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Customer Name (*)
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="e.g. Alexander Vance"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Phone Number (int'l digits without +) (*)
                  </label>
                  <input
                    {...register('phone')}
                    type="text"
                    placeholder="966501234567"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm font-mono text-left text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-danger">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Company / Organization
                  </label>
                  <input
                    {...register('company')}
                    type="text"
                    placeholder="Optional"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    City
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    placeholder="e.g. Riyadh"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Lead Source
                  </label>
                  <select
                    {...register('sourceId')}
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getSourceLabel(s.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Pipeline Status
                  </label>
                  <select
                    {...register('statusId')}
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {getStatusLabel(s.label)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Deal Value */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Deal Value (SAR)
                  </label>
                  <input
                    {...register('dealValue')}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm font-mono text-left text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>

                {/* Expected Close Date */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Expected Close Date
                  </label>
                  <input
                    {...register('expectedCloseDate')}
                    type="date"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm font-mono text-text rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>

                {/* Last Follow-up */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Last Interaction Date
                  </label>
                  <input
                    {...register('last')}
                    type="date"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm font-mono text-text rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>

                {/* Next Follow-up */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">
                    Next Follow-up Due
                  </label>
                  <input
                    {...register('next')}
                    type="date"
                    className="w-full border border-border bg-card px-3 py-2 text-xs sm:text-sm font-mono text-text rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  Customer Profile &amp; Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Record customer preferences, timeline expectations, background notes..."
                  className="w-full border border-border bg-card p-3 text-xs sm:text-sm text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle transition-colors"
                />
              </div>

              {/* Explicit Consent Requirement */}
              <div className="border border-border bg-bg p-3.5 rounded-lg">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    {...register('consent')}
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <span className="text-xs font-semibold text-text block">
                      Explicit Consent Confirmed
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      The client has explicitly opted in to receive business communications and updates via WhatsApp in compliance with privacy guidelines.
                    </span>
                  </div>
                </label>
                {errors.consent && (
                  <p className="mt-1.5 text-xs text-danger font-medium">
                    {errors.consent.message}
                  </p>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <LedgerButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                >
                  Cancel
                </LedgerButton>
                <LedgerButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                >
                  <span>{submitting ? 'Saving Account...' : initialData ? 'Update Record' : 'Create Account'}</span>
                </LedgerButton>
              </div>
            </form>
          )}

          {/* TAB 2: ACTIVITIES TIMELINE */}
          {activeTab === 'activities' && initialData && (
            <div className="space-y-4">
              {/* Add Activity Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!activityContent.trim()) return;
                  addActivityMutation.mutate({
                    type: activityType,
                    content: activityContent.trim(),
                  });
                }}
                className="border border-border rounded-lg p-3.5 bg-bg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text uppercase tracking-wider">Record New Activity</span>
                  <div className="flex items-center gap-1">
                    {(['note', 'call', 'whatsapp', 'meeting'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivityType(t)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                          activityType === t
                            ? 'bg-card text-accent font-semibold shadow-subtle border border-accent/30'
                            : 'text-muted hover:text-text'
                        }`}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={activityContent}
                  onChange={(e) => setActivityContent(e.target.value)}
                  placeholder="Enter interaction notes, meeting takeaways, or next steps..."
                  rows={2}
                  className="w-full border border-border bg-card p-2.5 text-xs text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle"
                />

                <div className="flex justify-end">
                  <LedgerButton
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={!activityContent.trim() || addActivityMutation.isPending}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Activity</span>
                  </LedgerButton>
                </div>
              </form>

              {/* Timeline List */}
              <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-muted">
                    No activities recorded yet for this client account.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="border border-border p-3 rounded-lg bg-card shadow-subtle space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs text-muted border-b border-border pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-text uppercase px-2 py-0.5 rounded-full bg-accent-soft text-accent text-[10px]">
                            {act.type}
                          </span>
                          <span>By {act.user?.name || 'Staff'}</span>
                        </div>
                        <span className="tabular-nums">{formatDate(act.createdAt)}</span>
                      </div>
                      <p className="text-xs text-text whitespace-pre-wrap leading-relaxed">
                        {act.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TASKS & TO-DOS */}
          {activeTab === 'tasks' && initialData && (
            <div className="space-y-4">
              {/* Add Task Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!taskTitle.trim() || !taskDueAt) return;
                  addTaskMutation.mutate({
                    title: taskTitle.trim(),
                    dueAt: taskDueAt,
                  });
                }}
                className="border border-border rounded-lg p-3.5 bg-bg space-y-3"
              >
                <div className="text-xs font-semibold text-text uppercase tracking-wider">Assign Action Item / Task</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Task description (e.g. send quotation, verify milestone)"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full border border-border bg-card px-3 py-2 text-xs text-text placeholder:text-muted rounded-lg outline-none focus:border-accent shadow-subtle"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={taskDueAt}
                      onChange={(e) => setTaskDueAt(e.target.value)}
                      className="w-full border border-border bg-card px-3 py-2 text-xs font-mono text-text rounded-lg outline-none focus:border-accent shadow-subtle"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <LedgerButton
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={!taskTitle.trim() || !taskDueAt || addTaskMutation.isPending}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task</span>
                  </LedgerButton>
                </div>
              </form>

              {/* Tasks List */}
              <div className="max-h-72 overflow-y-auto space-y-2 text-xs pr-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 text-muted">
                    No pending tasks for this client account.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border border-border p-3 rounded-lg flex items-center justify-between bg-card shadow-subtle transition-colors ${
                        task.done ? 'opacity-60 line-through' : ''
                      }`}
                    >
                      <label className="flex items-center gap-2.5 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(task.done)}
                          onChange={() =>
                            toggleTaskMutation.mutate({
                              taskId: task.id,
                              done: !task.done,
                            })
                          }
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                        />
                        <span className="font-medium text-xs text-text">
                          {task.title}
                        </span>
                      </label>
                      <div className="text-xs text-muted text-right">
                        <span className="tabular-nums">Due: {formatDate(task.dueAt)}</span>
                        {task.done && <span className="block text-[10px] text-accent font-semibold">[Completed]</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Phone Warning Modal */}
      {duplicateWarning && (
        <DuplicatePhoneModal
          isOpen={true}
          onClose={() => setDuplicateWarning(null)}
          onConfirmForce={handleForceConfirm}
          attemptedPhone={duplicateWarning.attemptedPhone}
          existingCustomer={duplicateWarning.existingCustomer}
        />
      )}
    </>
  );
};
