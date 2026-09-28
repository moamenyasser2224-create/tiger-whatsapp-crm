import React, { useState } from 'react';
import { LedgerButton, LedgerInput, LedgerTable, LedgerModal, PunchedCard } from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';
import { PayslipReceipt } from '../components/common/PayslipReceipt.js';
import { HatchedChart } from '../components/common/HatchedChart.js';
import { OdometerClock } from '../components/common/OdometerClock.js';
import { LedgerIcon, LedgerIconName } from '../components/icons/LedgerIcons.js';

export const DesignLabPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [punchState, setPunchState] = useState<'checked-in' | 'checked-out' | 'initial'>('checked-in');
  const [isPunching, setIsPunching] = useState(false);
  const [paperTextureActive, setPaperTextureActive] = useState(true);

  const handlePunchDemo = () => {
    setIsPunching(true);
    setTimeout(() => {
      setPunchState(punchState === 'checked-in' ? 'checked-out' : 'checked-in');
      setIsPunching(false);
    }, 400);
  };

  const chartData = [
    { label: 'السبت', value: 8 },
    { label: 'الأحد', value: 14, annotation: 'ذروة التفاعل' },
    { label: 'الاثنين', value: 11 },
    { label: 'الثلاثاء', value: 9 },
    { label: 'الأربعاء', value: 16 },
    { label: 'الخميس', value: 12 },
  ];

  const sampleIcons: LedgerIconName[] = [
    'ledger-book',
    'users',
    'clock',
    'receipt',
    'chat',
    'dashboard',
    'punch-card',
    'stamp',
    'plus',
    'check',
    'x',
    'search',
    'filter',
    'printer',
    'download',
    'lock',
    'eye',
    'trash',
    'edit',
    'bell',
    'qr-code',
    'kanban',
    'table',
    'cards',
    'timeline',
    'dollar',
  ];

  return (
    <div className="space-y-12">
      {/* Lab Masthead Notice */}
      <div className="border-b-2 border-neutral-900 dark:border-white pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold uppercase tracking-widest px-1.5 py-0.5 border border-neutral-900 dark:border-white">
            مختبر الهوية البصرية الرسمية
          </span>
          <span className="text-xs font-mono text-neutral-500">ISO-LEDGER-V2</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-neutral-950 dark:text-white">
          مختبر مكونات «دفتر الشركة» (Design Lab)
        </h2>
        <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
          فحص دقيق لكافة مكونات الهوية البصرية الجديدة في حالاتها المختلفة: زوايا حادة، أختام مطاطية، كروت حضور مثقوبة، إيصالات رواتب، وجداول مسطرة بنظام الدفاتر المحاسبية.
        </p>
      </div>

      {/* 1. Typography & Mega Numerals Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">1. تباين الطباعة والأرقام الضخمة (Typography)</h3>
          <span className="text-xs font-mono text-neutral-500">Reem Kufi + IBM Plex Sans Arabic + IBM Plex Mono</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#121212]">
          <div>
            <span className="text-xs font-mono text-neutral-500 block mb-1">رقم إحصائي رئيسي (Mega Display)</span>
            <div className="text-7xl sm:text-8xl font-mono font-black tabular-nums text-neutral-950 dark:text-white">
              98.4
            </div>
            <span className="text-xs font-bold font-ledger mt-2 block">نسبة الالتزام بالدوام هذا الشهر</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">خط العرض الرسمي (Reem Kufi)</span>
            <div className="text-2xl font-display font-bold text-neutral-900 dark:text-white">
              سجل الحسابات والمعاملات الإدارية
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-ledger">
              هذا النص مكتوب بخط IBM Plex Sans Arabic المعتمد للقراءة المكتبية الهادئة بدون أي letter-spacing مشوه للنص العربي.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-mono text-neutral-500 block">ساعة أودوميتر ميكانيكية دوارة</span>
            <div>
              <OdometerClock className="text-lg" />
            </div>
            <span className="text-[11px] font-mono text-neutral-500 block">
              أرقام أحادية موحدة العرض (Tabular Numerals)
            </span>
          </div>
        </div>
      </section>

      {/* 2. Rubber Stamps (أختام الحالات) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">2. الحالات كأختام مطاطية (Rubber Stamps)</h3>
          <span className="text-xs font-mono text-neutral-500">إطار مزدوج + زاوية ميلان ثابتة مشتقة من المعرف</span>
        </div>

        <div className="p-6 border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 flex flex-wrap items-center gap-6">
          <RubberStamp label="معتمد" recordId="rec-appr-01" subtext="بقرار الإدارة" />
          <RubberStamp label="مرفوض" recordId="rec-rej-02" subtext="مخالف للائحة" />
          <RubberStamp label="غياب غير مبرر" recordId="rec-abs-03" subtext="خصم 1.0 يوم" />
          <RubberStamp label="متأخر 25 دقيقة" recordId="rec-late-04" subtext="شريحة 2" />
          <RubberStamp label="محل نزاع" recordId="rec-disp-05" subtext="قيد الدراسة" />
          <RubberStamp label="مغلق نهائياً" recordId="rec-close-06" subtext="دورة 2026-09" />
        </div>
      </section>

      {/* 3. Hallmark Components: Punched Attendance Card & Payslip Receipt */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">3. الشاشات النموذجية (كارت الحضور وإيصال الراتب)</h3>
          <span className="text-xs font-mono text-neutral-500">Punched Card & Perforated Receipt</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Punched Card Demo */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">أ. كارت الحضور المثقوب مع تأثير التثقيب الحي:</span>
            <PunchedCard
              employeeName="م/ مؤمن ياسر"
              employeeId="EMP-00918"
              date="2026-09-28"
              punches={[
                {
                  type: 'حضور',
                  time: '08:58:12',
                  isPunched: true,
                  statusBadge: 'في الموعد',
                },
                {
                  type: 'انصراف',
                  time: punchState === 'checked-out' ? '17:02:45' : '',
                  isPunched: punchState === 'checked-out',
                  statusBadge: punchState === 'checked-out' ? 'مكتمل' : undefined,
                },
              ]}
              onPunchClick={handlePunchDemo}
              isPunching={isPunching}
            />
          </div>

          {/* Payslip Receipt Demo */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">ب. إيصال مسير الراتب بحواف مثقبة وخط مزدوج:</span>
            <PayslipReceipt
              serialNumber="9082-2026-09"
              employeeName="م/ مؤمن ياسر"
              employeeEmail="momen@tiger-crm.local"
              period="2026-09"
              baseSalary={6000}
              dayWage={200}
              deductions={150}
              disciplinaryCapLimit={600}
              bonuses={500}
              netPay={6350}
              isClosed={true}
              onPrint={() => window.print()}
            />
          </div>
        </div>
      </section>

      {/* 4. Ledger Table & Hatched Chart */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">4. جدول الدفتر المسطر والمخطط المهشر (Table & Chart)</h3>
          <span className="text-xs font-mono text-neutral-500">خطوط رفيعة + خط إجمالي مزدوج + أنماط تهشير</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Ledger Table */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">أ. جدول دفتر مسطر بخطوط أفقية:</span>
            <LedgerTable>
              <thead>
                <tr className="border-b-2 border-neutral-900 dark:border-white font-bold bg-neutral-100 dark:bg-neutral-900">
                  <th className="p-3">رقم القيد</th>
                  <th className="p-3">اسم الموظف / العميل</th>
                  <th className="p-3">الحالة المحاسبية</th>
                  <th className="p-3 text-left">المبلغ الصافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono">
                <tr>
                  <td className="p-3 font-bold">#TR-01</td>
                  <td className="p-3 font-ledger font-semibold">شركة النور للتجارة</td>
                  <td className="p-3">
                    <RubberStamp label="تم البيع" recordId="tr-01" />
                  </td>
                  <td className="p-3 text-left tabular-nums font-bold">25,000.00 ر.س</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">#TR-02</td>
                  <td className="p-3 font-ledger font-semibold">مؤسسة الأفق العقارية</td>
                  <td className="p-3">
                    <RubberStamp label="مهتم" recordId="tr-02" />
                  </td>
                  <td className="p-3 text-left tabular-nums font-bold">12,500.00 ر.س</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold">#TR-03</td>
                  <td className="p-3 font-ledger font-semibold">مكتب الرواد للاستشارات</td>
                  <td className="p-3">
                    <RubberStamp label="قيد المتابعة" recordId="tr-03" />
                  </td>
                  <td className="p-3 text-left tabular-nums font-bold">8,000.00 ر.س</td>
                </tr>
                {/* Total Row with Double Underline */}
                <tr className="border-t-2 border-neutral-900 dark:border-white border-double-bottom font-bold text-sm bg-neutral-50 dark:bg-neutral-900/50">
                  <td colSpan={3} className="p-3 font-display">إجمالي القيود المعتمدة في الدفتر</td>
                  <td className="p-3 text-left tabular-nums font-black">45,500.00 ر.س</td>
                </tr>
              </tbody>
            </LedgerTable>
          </div>

          {/* Hatched Chart */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-500 block">ب. رسم بياني بأنماط تهشير ونقاط نصف-تون:</span>
            <HatchedChart
              title="معدل المتابعات اليومية المسجلة هذا الأسبوع"
              data={chartData}
              unit=" متابعة"
              height={220}
            />
          </div>
        </div>
      </section>

      {/* 5. Controls, Buttons & Modals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">5. الأزرار والمداخل والطبقات المنبثقة (Controls & Modals)</h3>
          <span className="text-xs font-mono text-neutral-500">حواف حادة + انخفاض 1px + خلفية تهشير للنافذة</span>
        </div>

        <div className="p-6 border-2 border-neutral-900 dark:border-white bg-white dark:bg-neutral-950 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <LedgerButton variant="primary" icon="plus">زر أساسي بتعبئة كاملة</LedgerButton>
            <LedgerButton variant="secondary" icon="printer">زر ثانوي بإطار رسمي</LedgerButton>
            <LedgerButton variant="danger" icon="trash">زر إجراء حرج</LedgerButton>
            <LedgerButton variant="ghost" icon="search">زر شفاف</LedgerButton>
            <LedgerButton variant="primary" disabled icon="lock">زر معطل</LedgerButton>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <LedgerInput label="اسم العميل أو جهة القيد" placeholder="أدخل الاسم..." />
            <LedgerInput label="رقم الجوال (فحص التكرار)" placeholder="05XXXXXXXX" isMono />
            <LedgerInput label="حقل بقيمة خاطئة (Error State)" defaultValue="قيمة غير صالحة" error="رقم الهاتف مسجل مسبقاً في الدفتر" isMono />
          </div>

          <div className="pt-2">
            <LedgerButton variant="primary" onClick={() => setIsModalOpen(true)}>
              فتح نافذة منبثقة تجريبية (Hatched Backdrop Modal)
            </LedgerButton>
          </div>
        </div>
      </section>

      {/* 6. Hand-drawn 24px SVG Icons Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-300 dark:border-neutral-700 pb-2">
          <h3 className="font-display font-bold text-lg">6. مصفوفة الأيقونات الرسمية (Hand-crafted 24px Grid)</h3>
          <span className="text-xs font-mono text-neutral-500">خط 2px + نهايات مربعة + بدون أي مكتبة خارجية</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-9 gap-3 p-5 border-2 border-neutral-900 dark:border-white bg-[#fafafa] dark:bg-[#121212]">
          {sampleIcons.map((iconName) => (
            <div
              key={iconName}
              className="flex flex-col items-center justify-center p-2.5 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 space-y-1 hover:border-neutral-900 dark:hover:border-white transition-colors"
            >
              <LedgerIcon name={iconName} size={22} />
              <span className="text-[9px] font-mono truncate max-w-full opacity-70">
                {iconName}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Modal */}
      <LedgerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="تأكيد إجراء مكتبي في الدفتر"
      >
        <div className="space-y-4 font-ledger text-xs sm:text-sm">
          <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
            تنبيه: الخلفية خلف هذه النافذة مغطاة بنمط تهشير قطري رفيع (بدون تمويه Glassmorphism)، والنافذة محاطة بإطار سميك مع ظل صلب صريح مزاح بمقدار 4px.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <LedgerButton variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              إلغاء التراجع
            </LedgerButton>
            <LedgerButton variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
              تأكيد التوثيق
            </LedgerButton>
          </div>
        </div>
      </LedgerModal>
    </div>
  );
};

export default DesignLabPage;
