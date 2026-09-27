import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { MessageTemplate, CustomerStatus, ListOption } from '../types/index.js';
import { CUSTOMER_STATUSES } from '../types/index.js';
import { STATUS_COLORS } from '../lib/utils.js';
import {
  MessageSquareQuote,
  RotateCcw,
  Save,
  CheckCircle2,
  Smartphone,
  Eye,
  Info,
} from 'lucide-react';

export const TemplatesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState<string>('جديد');
  const [templateBodies, setTemplateBodies] = useState<Record<string, string>>({});
  const [previewName, setPreviewName] = useState('سعد العتيبي');
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

  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
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
      setSaveSuccess('تم حفظ القالب بنجاح!');
      setSaveError(null);
      setTimeout(() => setSaveSuccess(null), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.error || 'فشل حفظ القالب');
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
      setSaveSuccess('تمت استعادة النص الافتراضي بنجاح');
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
      setSaveError('يجب أن يحتوي نص الرسالة على المتغير {name} لاستبداله باسم العميل');
      return;
    }
    saveMutation.mutate({ status: activeStatus, body: currentBody });
  };

  const formattedPreview = currentBody.replace(/\{name\}/g, previewName || 'العميل');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-neutral-900 dark:text-white">قوالب رسائل واتساب</h1>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
          خصص نصوص الرسائل التلقائية لكل حالة من حالات العملاء، مع إمكانية المعاينة الحية واستبدال المتغيرات
        </p>
      </div>

      {/* Instruction Tip */}
      <div className="flex items-start gap-3 rounded-2xl border border-neutral-300 bg-neutral-100/60 p-4 dark:border-neutral-700 dark:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200">
        <Info className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-300 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">كيف تعمل قوالب الرسائل؟</p>
          <p className="opacity-90">
            عند الضغط على أيقونة واتساب بجانب أي عميل، يفتح النظام محادثة واتساب فوراً بالرسالة المناسبة لحالته الحالية، ويتم استبدال الرمز <code className="bg-neutral-200 dark:bg-neutral-700 px-1 py-0.5 rounded font-mono font-bold">{'{name}'}</code> باسم العميل الفعلي تلقائياً.
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {availableStatuses.map((st) => {
          const isActive = activeStatus === st;
          return (
            <button
              key={st}
              onClick={() => {
                setActiveStatus(st);
                setSaveError(null);
                setSaveSuccess(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-black text-white dark:bg-white dark:text-black border border-neutral-900 dark:border-white shadow-sm'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <span>قالب حالة: {st}</span>
            </button>
          );
        })}
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Box */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-neutral-800 dark:text-neutral-200" />
              <span>تحرير نص الرسالة لحالة ({activeStatus})</span>
            </h3>

            <button
              onClick={() => resetMutation.mutate(activeStatus)}
              disabled={resetMutation.isPending}
              className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>استعادة النص الافتراضي</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="rounded-xl border border-neutral-900 bg-neutral-100 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-800 dark:text-white">
              {saveSuccess}
            </div>
          )}

          {saveError && (
            <div className="rounded-xl border-2 border-neutral-900 bg-neutral-200 p-3 text-xs font-bold text-neutral-900 dark:border-white dark:bg-neutral-950 dark:text-white">
              {saveError}
            </div>
          )}

          <div>
            <textarea
              rows={6}
              value={currentBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="اكتب نص الرسالة هنا، وتأكد من تضمين {name}..."
              className="w-full rounded-2xl border border-neutral-300 p-4 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:focus:border-white dark:focus:ring-white"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-neutral-400">
              <span>المتغيرات المدعومة: <code className="text-black dark:text-white font-bold font-mono">{'{name}'}</code></span>
              <span>{currentBody.length} حرف</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border border-neutral-900 dark:border-white px-6 py-2.5 text-xs font-bold disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Live WhatsApp Chat Preview */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              <span>معاينة حية للرسالة</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-neutral-500">اسم تجريبي:</span>
              <input
                type="text"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                className="w-24 rounded-lg border border-neutral-300 px-2 py-0.5 text-xs text-center dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
              />
            </div>
          </div>

          {/* WhatsApp UI Simulation Box (Monochrome) */}
          <div className="rounded-2xl border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 p-4 shadow-inner min-h-[220px] flex flex-col justify-end">
            {/* WhatsApp Chat Bubble */}
            <div className="self-end max-w-[85%] rounded-2xl rounded-tr-none bg-white border border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700 p-3.5 shadow-sm text-neutral-900 dark:text-white">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{formattedPreview}</p>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-400 text-left mt-1">
                12:45 م ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
