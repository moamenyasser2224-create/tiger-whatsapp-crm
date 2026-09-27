import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import type { MessageTemplate, CustomerStatus } from '../types/index.js';
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
  const [activeStatus, setActiveStatus] = useState<CustomerStatus>('جديد');
  const [templateBodies, setTemplateBodies] = useState<Record<string, string>>({});
  const [previewName, setPreviewName] = useState('سعد العتيبي');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">قوالب رسائل واتساب</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          خصص نصوص الرسائل التلقائية لكل حالة من حالات العملاء، مع إمكانية المعاينة الحية واستبدال المتغيرات
        </p>
      </div>

      {/* Instruction Tip */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold">كيف تعمل قوالب الرسائل؟</p>
          <p className="opacity-90">
            عند الضغط على أيقونة واتساب بجانب أي عميل، يفتح النظام محادثة واتساب فوراً بالرسالة المناسبة لحالته الحالية، ويتم استبدال الرمز <code className="bg-blue-200/60 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono font-bold">{'{name}'}</code> باسم العميل الفعلي تلقائياً.
          </p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
        {CUSTOMER_STATUSES.map((st) => {
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
                  ? 'bg-whatsapp text-white shadow-md shadow-whatsapp/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
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
        <div className="lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-whatsapp" />
              <span>تحرير نص الرسالة لحالة ({activeStatus})</span>
            </h3>

            <button
              onClick={() => resetMutation.mutate(activeStatus)}
              disabled={resetMutation.isPending}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>استعادة النص الافتراضي</span>
            </button>
          </div>

          {saveSuccess && (
            <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {saveSuccess}
            </div>
          )}

          {saveError && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {saveError}
            </div>
          )}

          <div>
            <textarea
              rows={6}
              value={currentBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              placeholder="اكتب نص الرسالة هنا، وتأكد من تضمين {name}..."
              className="w-full rounded-2xl border border-gray-300 p-4 text-sm focus:border-whatsapp focus:outline-none focus:ring-1 focus:ring-whatsapp dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
              <span>المتغيرات المدعومة: <code className="text-whatsapp font-bold font-mono">{'{name}'}</code></span>
              <span>{currentBody.length} حرف</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-whatsapp px-6 py-2.5 text-xs font-bold text-white hover:bg-whatsapp-dark shadow-md shadow-whatsapp/20 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Live WhatsApp Chat Preview */}
        <div className="lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-600" />
              <span>معاينة حية للرسالة</span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-500">اسم تجريبي:</span>
              <input
                type="text"
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                className="w-24 rounded-lg border border-gray-300 px-2 py-0.5 text-xs text-center dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          </div>

          {/* WhatsApp UI Simulation Box */}
          <div className="rounded-2xl border border-emerald-800/20 bg-[#E5DDD5] dark:bg-[#0b141a] p-4 shadow-inner min-h-[220px] flex flex-col justify-end">
            {/* WhatsApp Chat Bubble */}
            <div className="self-end max-w-[85%] rounded-2xl rounded-tr-none bg-[#DCF8C6] dark:bg-[#005c4b] p-3.5 shadow-sm text-gray-900 dark:text-white">
              <p className="text-xs leading-relaxed whitespace-pre-wrap">{formattedPreview}</p>
              <div className="text-[10px] text-gray-400 dark:text-gray-300/60 text-left mt-1">
                12:45 م ✓✓
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
