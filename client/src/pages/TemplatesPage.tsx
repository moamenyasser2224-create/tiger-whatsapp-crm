import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { MessageTemplate, ListOption } from '../types/index.js';
import { CUSTOMER_STATUSES } from '../types/index.js';
import { getStatusLabel } from '../lib/utils.js';
import {
  MessageSquareQuote,
  RotateCcw,
  Save,
  Eye,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { MotionPage } from '../components/motion/MotionPage.js';
import { LedgerButton } from '../components/common/LedgerComponents.js';

export const TemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string>('New');
  const [templateBodies, setTemplateBodies] = useState<Record<string, string>>({});
  const [previewName, setPreviewName] = useState('Alex Morgan');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Dynamic Status Options
  const { data: statusOptions = [] } = useQuery<ListOption[]>({
    queryKey: ['options', 'status'],
    queryFn: async () => {
      const res = await api.get('/options?type=status');
      return res.data.data;
    },
  });

  const availableStatuses = statusOptions.length > 0
    ? statusOptions.map((o) => o.label)
    : CUSTOMER_STATUSES;

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates');
      const map: Record<string, string> = {};
      data.data.forEach((t: MessageTemplate) => {
        map[t.status] = t.body;
      });
      setTemplateBodies(map);
      return data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ status, body }: { status: string; body: string }) => {
      await api.put(`/templates/${encodeURIComponent(status)}`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSaveSuccess('Message template updated successfully!');
      setSaveError(null);
      setTimeout(() => setSaveSuccess(null), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.error || 'Failed to save template');
      setSaveSuccess(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.post(`/templates/${encodeURIComponent(status)}/reset`);
      return data.data;
    },
    onSuccess: (data) => {
      setTemplateBodies((prev) => ({ ...prev, [data.status]: data.body }));
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setSaveSuccess('Default template restored successfully');
      setSaveError(null);
      setTimeout(() => setSaveSuccess(null), 3000);
    },
  });

  const currentBody = templateBodies[activeStatus] || '';

  const handleBodyChange = (text: string) => {
    setTemplateBodies((prev) => ({ ...prev, [activeStatus]: text }));
  };

  const handleSave = () => {
    if (!currentBody.includes('{name}')) {
      setSaveError('Template message must contain the {name} placeholder to interpolate client names');
      return;
    }
    saveMutation.mutate({ status: activeStatus, body: currentBody });
  };

  const formattedPreview = currentBody.replace(/\{name\}/g, previewName || 'Valued Client');

  return (
    <MotionPage className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted font-medium">
          <span>Communication</span>
          <span>/</span>
          <span>Messaging Templates</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-text mt-1">
          WhatsApp Message Templates
        </h1>
        <p className="text-xs text-muted mt-0.5">
          Standardized communication copy personalized for each customer pipeline stage.
        </p>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-bg border border-border rounded-lg">
        {availableStatuses.map((st) => {
          const isActive = activeStatus === st;
          return (
            <button
              key={st}
              onClick={() => {
                setActiveStatus(st);
                setSaveSuccess(null);
                setSaveError(null);
              }}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                isActive
                  ? 'bg-card text-accent font-semibold shadow-subtle border border-accent/20'
                  : 'text-muted hover:text-text font-normal'
              }`}
            >
              {getStatusLabel(st)}
            </button>
          );
        })}
      </div>

      {/* Notification Alerts */}
      {saveSuccess && (
        <div className="flex items-center gap-2 border border-accent/40 bg-accent-soft p-3 rounded-lg text-xs text-accent font-medium">
          <Check className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 border border-danger/40 bg-danger-soft p-3 rounded-lg text-xs text-danger font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Template Editor */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-accent" />
              <span>Editing: {getStatusLabel(activeStatus)}</span>
            </h2>
            <button
              onClick={() => resetMutation.mutate(activeStatus)}
              disabled={resetMutation.isPending}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors cursor-pointer"
              title="Reset to default text"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Default</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Message Content
            </label>
            <textarea
              rows={8}
              value={currentBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="Write your template message... (use {name} for customer name)"
              className="w-full rounded-lg border border-border bg-card p-3 text-xs sm:text-sm text-text placeholder:text-muted outline-none focus:border-accent shadow-subtle transition-colors leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted bg-bg p-3 rounded-lg border border-border">
            <Info className="h-4 w-4 shrink-0 text-accent" />
            <span>Use the <code className="bg-card px-1.5 py-0.5 rounded border border-border font-mono text-[11px] text-text font-semibold">&#123;name&#125;</code> variable to insert the recipient client's name automatically.</span>
          </div>

          <div className="flex justify-end pt-2">
            <LedgerButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              <span>{saveMutation.isPending ? 'Saving...' : 'Save Template'}</span>
            </LedgerButton>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              <span>Live WhatsApp Message Preview</span>
            </h2>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text mb-1">
              Simulated Client Name
            </label>
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              placeholder="Type a sample name..."
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs sm:text-sm text-text outline-none focus:border-accent shadow-subtle"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text">
              Rendered Outbound Bubble
            </label>
            <div className="rounded-xl border border-border bg-bg p-6 flex flex-col items-end">
              <div className="max-w-md rounded-xl rounded-tr-sm bg-accent p-4 text-xs sm:text-sm text-white shadow-subtle leading-relaxed whitespace-pre-wrap">
                {formattedPreview || <span className="opacity-60 italic">No content configured yet...</span>}
                <div className="mt-2 text-right text-[10px] text-white/70">
                  12:00 PM &bull; Delivered
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionPage>
  );
};
