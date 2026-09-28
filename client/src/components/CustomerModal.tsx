import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { Customer, ListOption } from '../types/index.js';
import { LedgerIcon } from './icons/LedgerIcons.js';
import { LedgerButton } from './common/LedgerComponents.js';
import { DuplicatePhoneModal } from './DuplicatePhoneModal.js';
import { formatDate, getStatusLabel, getSourceLabel } from '../lib/utils.js';

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

  // Add Activity Mutation
  const addActivityMutation = useMutation({
    mutationFn: async (payload: { type: string; content: string }) => {
      if (!initialData?.id) return;
      const res = await api.post(`/crm/customers/${initialData.id}/activities`, payload);
      return res.data.data;
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
      return res.data.data;
    },
    onSuccess: () => {
      setTaskTitle('');
      setTaskDueAt('');
      refetchTasks();
    },
  });

  // Toggle Task Status Mutation
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, done }: { taskId: string; done: boolean }) => {
      const res = await api.patch(`/crm/tasks/${taskId}`, { done });
      return res.data.data;
    },
    onSuccess: () => {
      refetchTasks();
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
      sourceId: sources[0]?.id || '',
      statusId: statuses[0]?.id || '',
      source: 'WhatsApp',
      status: 'New',
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
      const matchedSource = sources.find((s) => s.id === initialData.sourceId || s.label === initialData.source);
      const matchedStatus = statuses.find((s) => s.id === initialData.statusId || s.label === initialData.status);

      reset({
        name: initialData.name,
        company: initialData.company || '',
        phone: initialData.phone,
        city: initialData.city || '',
        sourceId: matchedSource?.id || initialData.sourceId || '',
        statusId: matchedStatus?.id || initialData.statusId || '',
        source: initialData.source,
        status: initialData.status,
        dealValue: initialData.dealValue || null,
        expectedCloseDate: initialData.expectedCloseDate ? new Date(initialData.expectedCloseDate).toISOString().split('T')[0] : '',
        last: initialData.last ? new Date(initialData.last).toISOString().split('T')[0] : '',
        next: initialData.next ? new Date(initialData.next).toISOString().split('T')[0] : '',
        notes: initialData.notes || '',
        consent: initialData.consent,
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
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-5 bg-diagonal-hatch overflow-y-auto" dir="ltr">
        <div className="relative w-full max-w-3xl border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#141414] shadow-solid-lg my-8 p-4 sm:p-6 select-text">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-neutral-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-neutral-900 dark:bg-white" />
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-neutral-950 dark:text-white">
                  {initialData ? `Customer File: ${initialData.name}` : 'New Customer Record'}
                </h2>
                <div className="text-[11px] font-mono text-neutral-500">
                  {initialData ? `Record ID #${initialData.id.slice(0, 8)}` : 'Tiger Sales & Client Directory'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 border border-neutral-900 dark:border-white hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <LedgerIcon name="x" size={16} />
            </button>
          </div>

          {/* Tab Switcher */}
          {initialData && (
            <div className="flex border-b-2 border-neutral-900 dark:border-white mb-4 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-4 py-1.5 text-xs font-bold border-t-2 border-x-2 transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                Record Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-1.5 text-xs font-bold border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'activities'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <span>Activity Timeline</span>
                <span className="font-mono text-[10px] px-1 border border-current">
                  {activities.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-1.5 text-xs font-bold border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white'
                    : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700'
                }`}
              >
                <span>Tasks &amp; Follow-ups</span>
                <span className="font-mono text-[10px] px-1 border border-current">
                  {tasks.length}
                </span>
              </button>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-4 border-2 border-neutral-900 bg-neutral-100 p-2.5 text-xs font-mono font-bold text-neutral-900 dark:border-white dark:bg-neutral-900 dark:text-white flex items-center gap-2">
              <LedgerIcon name="alert-triangle" size={16} />
              <span>{serverError}</span>
            </div>
          )}

          {/* TAB 1: CUSTOMER DETAILS FORM */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Customer Name (*)
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="e.g. Alexander Vance"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white rounded-none"
                  />
                  {errors.name && (
                    <p className="mt-1 text-[11px] font-mono font-bold text-neutral-900 dark:text-white underline">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Phone Number (digits only, int'l format without +) (*)
                  </label>
                  <input
                    {...register('phone')}
                    type="text"
                    placeholder="966501234567"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-mono text-left text-neutral-950 dark:text-white outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white rounded-none"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-[11px] font-mono font-bold text-neutral-900 dark:text-white underline">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Company / Organization
                  </label>
                  <input
                    {...register('company')}
                    type="text"
                    placeholder="Optional"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    City
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    placeholder="e.g. Riyadh"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Lead Source
                  </label>
                  <select
                    {...register('sourceId')}
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none rounded-none"
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
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Pipeline Status
                  </label>
                  <select
                    {...register('statusId')}
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none rounded-none"
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
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Deal Value (SAR)
                  </label>
                  <input
                    {...register('dealValue')}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-mono text-left text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>

                {/* Expected Close Date */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Expected Close Date
                  </label>
                  <input
                    {...register('expectedCloseDate')}
                    type="date"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-mono text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>

                {/* Last Follow-up */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Last Contacted Date
                  </label>
                  <input
                    {...register('last')}
                    type="date"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-mono text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>

                {/* Next Follow-up */}
                <div>
                  <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                    Next Follow-up Due Date
                  </label>
                  <input
                    {...register('next')}
                    type="date"
                    className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs sm:text-sm font-mono text-neutral-950 dark:text-white outline-none rounded-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-900 dark:text-neutral-200 mb-1">
                  Notes &amp; Interaction Details
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Record customer preferences, requirements, or conversation summaries..."
                  className="w-full border-1.5 border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 p-2 text-xs sm:text-sm text-neutral-950 dark:text-white outline-none rounded-none"
                />
              </div>

              {/* Consent Checkbox */}
              <div className="border-2 border-neutral-900 dark:border-white p-3 bg-[#fafafa] dark:bg-[#111111]">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" {...register('consent')} className="mt-1" />
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                      I confirm explicit customer consent to be contacted via WhatsApp (Mandatory)
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
                      Consent timestamp is cryptographically archived in the audit log.
                      {initialData?.consentDate && (
                        <span className="block mt-0.5 font-bold">
                          Original recorded date: {formatDate(initialData.consentDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
                {errors.consent && (
                  <p className="mt-1 text-[11px] font-mono font-bold text-neutral-900 dark:text-white underline">
                    {errors.consent.message}
                  </p>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-neutral-900 dark:border-white">
                <LedgerButton type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                  Cancel
                </LedgerButton>
                <LedgerButton type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : initialData ? 'Update Record' : 'Save & Register Customer'}
                </LedgerButton>
              </div>
            </form>
          )}

          {/* TAB 2: ACTIVITY TIMELINE */}
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
                className="border-2 border-neutral-900 dark:border-white p-3 bg-[#fafafa] dark:bg-[#111111] space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono uppercase">Record New Activity</span>
                  <div className="flex items-center gap-1">
                    {(['note', 'call', 'whatsapp', 'meeting'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setActivityType(t)}
                        className={`px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer ${
                          activityType === t
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white'
                            : 'border-neutral-400 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-800'
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
                  placeholder="Enter call notes, action taken, or meeting takeaway..."
                  rows={2}
                  className="w-full border border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 p-2 text-xs text-neutral-950 dark:text-white outline-none rounded-none"
                />

                <div className="flex justify-end">
                  <LedgerButton
                    type="submit"
                    size="sm"
                    disabled={!activityContent.trim() || addActivityMutation.isPending}
                  >
                    <LedgerIcon name="plus" size={13} />
                    <span>Log Activity</span>
                  </LedgerButton>
                </div>
              </form>

              {/* Timeline List */}
              <div className="max-h-72 overflow-y-auto space-y-2 font-mono text-xs pl-1">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 font-mono">
                    No activities recorded yet for this customer.
                  </div>
                ) : (
                  activities.map((act) => (
                    <div
                      key={act.id}
                      className="border border-neutral-900 dark:border-white p-2.5 bg-white dark:bg-neutral-900 shadow-solid-sm space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900 dark:text-white uppercase px-1 border border-current">
                            {act.type}
                          </span>
                          <span>By: {act.user?.name || 'Staff'}</span>
                        </div>
                        <span>{formatDate(act.createdAt)}</span>
                      </div>
                      <p className="text-xs text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap pt-0.5">
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
                className="border-2 border-neutral-900 dark:border-white p-3 bg-[#fafafa] dark:bg-[#111111] space-y-2.5"
              >
                <div className="text-xs font-bold font-mono uppercase">Assign New Action Item / Task</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Task description (e.g. send quotation, verify milestone)"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="w-full border border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs text-neutral-950 dark:text-white outline-none rounded-none"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={taskDueAt}
                      onChange={(e) => setTaskDueAt(e.target.value)}
                      className="w-full border border-neutral-900 dark:border-white bg-white dark:bg-neutral-900 px-3 py-1.5 text-xs font-mono text-neutral-950 dark:text-white outline-none rounded-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <LedgerButton
                    type="submit"
                    size="sm"
                    disabled={!taskTitle.trim() || !taskDueAt || addTaskMutation.isPending}
                  >
                    <LedgerIcon name="plus" size={13} />
                    <span>Assign Task</span>
                  </LedgerButton>
                </div>
              </form>

              {/* Tasks List */}
              <div className="max-h-72 overflow-y-auto space-y-2 font-mono text-xs pl-1">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 text-neutral-500 font-mono">
                    No pending tasks for this client record.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`border border-neutral-900 dark:border-white p-2.5 flex items-center justify-between bg-white dark:bg-neutral-900 ${
                        task.done ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 select-none">
                        <input
                          type="checkbox"
                          checked={Boolean(task.done)}
                          onChange={() =>
                            toggleTaskMutation.mutate({
                              taskId: task.id,
                              done: !task.done,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <span className="font-bold text-sm text-neutral-950 dark:text-white">
                          {task.title}
                        </span>
                      </label>
                      <div className="text-[11px] font-mono text-neutral-500 text-right">
                        <span>Due: {formatDate(task.dueAt)}</span>
                        {task.done && <span className="block text-[10px] font-bold text-emerald-600">[COMPLETED]</span>}
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
