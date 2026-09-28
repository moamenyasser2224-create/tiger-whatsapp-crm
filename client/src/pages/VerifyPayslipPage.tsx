import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';
import { RubberStamp } from '../components/common/RubberStamp.js';

export const VerifyPayslipPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify-payslip', token],
    queryFn: async () => {
      if (!token) throw new Error('رمز التحقق مفقود');
      const res = await api.get(`/deductions/verify/${token}`);
      return res.data.data;
    },
    enabled: Boolean(token),
  });

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0e0e0e] text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center p-4 font-ledger antialiased">
      <div className="w-full max-w-md border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#121212] p-6 shadow-solid space-y-6 font-ledger">
        {/* Top Header */}
        <div className="border-b-2 border-neutral-900 dark:border-white pb-4 text-center space-y-1">
          <div className="inline-block border border-neutral-900 dark:border-white px-2 py-0.5 font-mono text-[10px] font-bold">
            بوابة التحقق الرقمي الرسمية
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-display text-neutral-950 dark:text-white mt-1">
            التحقق من صحة قسيمة الراتب
          </h1>
          <p className="text-xs text-neutral-500 font-mono">
            نظام التوقيع الرقمي المشفر HMAC-SHA256
          </p>
        </div>

        {/* Content */}
        {!token ? (
          <div className="border border-dashed border-neutral-400 p-6 text-center text-xs font-mono text-neutral-500 space-y-2">
            <LedgerIcon name="alert-triangle" size={24} className="mx-auto" />
            <p>لم يتم تمرير رمز التحقق في الرابط.</p>
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center font-mono text-xs text-neutral-500 space-y-2">
            <div className="animate-spin inline-block">
              <LedgerIcon name="clock" size={24} />
            </div>
            <p>جاري التحقق من التوقيع الرقمي في السجلات المحاسبية...</p>
          </div>
        ) : error || !data?.valid ? (
          <div className="border-2 border-neutral-900 dark:border-white p-6 text-center space-y-3 bg-neutral-100 dark:bg-neutral-900">
            <RubberStamp label="إيصال غير صالح" recordId="invalid-slip" subtext="تحذير أمني" />
            <p className="text-xs font-bold font-mono text-neutral-800 dark:text-neutral-200">
              {data?.error || 'فشل التحقق من التوقيع الرقمي أو تم التلاعب بالإيصال.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <RubberStamp label="معتمد وموثّق" recordId={token} subtext="مطابق للتوقيع المشفر" />
            </div>

            <div className="border border-neutral-900 dark:border-white p-4 font-mono text-xs space-y-2 bg-[#faf9f5] dark:bg-[#181818]">
              <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                <span className="text-neutral-500 font-ledger">الموظف المعني:</span>
                <span className="font-bold text-neutral-950 dark:text-white">{data.employee?.name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                <span className="text-neutral-500 font-ledger">البريد الإلكتروني:</span>
                <span>{data.employee?.email}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 dark:border-neutral-800 pb-1.5">
                <span className="text-neutral-500 font-ledger">دورة الشهر المالي:</span>
                <span className="font-bold tabular-nums">{data.period}</span>
              </div>
              <div className="flex justify-between border-b-2 border-neutral-900 dark:border-white pb-1.5 text-sm font-black">
                <span className="font-ledger">صافي الراتب المصروف:</span>
                <span className="tabular-nums">{Number(data.netPay).toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between pt-1 text-[10px] text-neutral-500">
                <span>تاريخ الفحص:</span>
                <span>{new Date(data.verifiedAt).toLocaleString('ar-EG')}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-400 font-ledger text-center leading-relaxed">
              هذه الوثيقة صادرة رسمياً ومسجلة في الدفتر المالي العام للمنظومة، وتتطابق مع البيانات الأصلية المحفوظة في قاعدة البيانات.
            </p>
          </div>
        )}

        {/* Back Link */}
        <div className="border-t border-neutral-300 dark:border-neutral-800 pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900 dark:text-white hover:underline"
          >
            <LedgerIcon name="arrow-right" size={14} />
            <span>تسجيل الدخول إلى دفتر الشركة</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
