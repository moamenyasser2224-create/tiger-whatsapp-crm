import React, { useState } from 'react';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';
import { LedgerButton, LedgerTable } from '../components/common/LedgerComponents.js';
import { RubberStamp } from '../components/common/RubberStamp.js';

export const CompanyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'portfolio' | 'partners'>('overview');

  return (
    <div className="space-y-10 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* ========================================================
          1. INDUSTRIAL HERO HEADER (الترويسة الهندسية الرسمية)
          ======================================================== */}
      <section className="relative border-2 border-neutral-900 dark:border-white p-6 sm:p-10 bg-white dark:bg-neutral-950 shadow-solid bg-industrial-grid">
        {/* Top Spec Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 mb-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="tech-spec-badge bg-neutral-900 text-white dark:bg-white dark:text-black">
              SYS-AUT-2026 // INDUSTRIAL SPEC
            </span>
            <span className="text-neutral-500 hidden sm:inline">
              مؤسسة النمر للأنظمة الهندسية والمقاولات والتشغيل
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-neutral-900 dark:border-white px-2 py-0.5 font-bold">
              معتمد ISO 9001:2015
            </span>
            <span className="text-neutral-600 dark:text-neutral-400">سجل تجاري #1010-TIGER</span>
          </div>
        </div>

        {/* Hero Title & Mission */}
        <div className="max-w-4xl space-y-4">
          <div className="inline-block text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-neutral-900 dark:border-white">
            YOUR EXPERT FOR INDUSTRIAL AUTOMATION & CONTRACTING
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-neutral-950 dark:text-white leading-tight tracking-normal">
            خبراء أنظمة المقاولات المتكاملة وأتمتة العمليات والتشغيل الذكي
          </h1>
          <p className="text-sm sm:text-base font-ledger text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
            منذ انطلاقنا، كرّسنا خبراتنا لتقديم حلول هندسية وتشغيلية متقدمة تدمج بين التنفيذ الميداني الصارم، وأحدث برمجيات الأتمتة وإدارة تدفق الأعمال. نضمن لعملائنا إدارة آمنة ودقيقة للمشاريع، الموارد، وسلاسل الإمداد بموثوقية كاملة.
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-dashed border-neutral-300 dark:border-neutral-700">
          {[
            { id: 'overview', label: 'من نحن ورؤيتنا' },
            { id: 'history', label: 'المسار التاريخي' },
            { id: 'portfolio', label: 'محفظة الحلول' },
            { id: 'partners', label: 'شبكة الشركاء' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-1.5 text-xs font-bold font-mono transition-all border-2 ${
                activeSection === tab.id
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black border-neutral-900 dark:border-white shadow-solid-sm'
                  : 'bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border-neutral-400 dark:border-neutral-700 hover:border-neutral-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================
          2. KEY INDUSTRIAL METRICS (أرقام الإنجاز الملموسة)
          ======================================================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { metric: '+4,500', label: 'مشروع وعملية منجزة', sub: 'عقود حكومية وخاصة كبرى' },
          { metric: '15+', label: 'عاماً من الخبرة الهندسية', sub: 'سجل حافل بالريادة والابتكار' },
          { metric: '99.8%', label: 'نسبة الدقة التشغيلية', sub: 'معايير جودة صارمة وموثقة' },
          { metric: '24/7', label: 'دعم وتشغيل ميداني', sub: 'استجابة فورية وفرق متأهبة' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="industrial-card p-5 space-y-1.5 border-2 border-neutral-900 dark:border-white"
          >
            <div className="font-mono text-3xl sm:text-4xl font-black text-neutral-950 dark:text-white tabular-nums">
              {stat.metric}
            </div>
            <div className="font-display font-bold text-sm text-neutral-900 dark:text-white">
              {stat.label}
            </div>
            <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
              {stat.sub}
            </div>
          </div>
        ))}
      </section>

      {/* ========================================================
          3. WHO WE ARE & PHILOSOPHY (من نحن وفلسفة العمل)
          ======================================================== */}
      {(activeSection === 'overview' || activeSection === 'portfolio') && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who We Are */}
          <div className="industrial-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
              <div className="flex items-center gap-2">
                <LedgerIcon name="building" size={20} />
                <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                  من نحن (WHO WE ARE)
                </h2>
              </div>
              <RubberStamp label="منشأة معتمدة" recordId="corp-tiger-01" />
            </div>

            <p className="font-ledger text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              تأسست <strong>مؤسسة النمر</strong> لتكون شريكاً استراتيجياً موثوقاً في مجالات المقاولات العامة، التجهيزات الهندسية، وحلول الأتمتة المتقدمة. نؤمن بأن النجاح التشغيلي يرتكز على دمج الإشراف البشري الخبير مع الأدوات الرقمية الصارمة.
            </p>

            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1.5">
                <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
                <span className="font-bold text-neutral-900 dark:text-white">الرؤية:</span>
                <span>الريادة الإقليمية في الربط بين الأعمال الإنشائية والأتمتة البرمجية.</span>
              </div>
              <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1.5">
                <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
                <span className="font-bold text-neutral-900 dark:text-white">المهمة:</span>
                <span>توفير حلول ذات جدوى اقتصادية مثبتة، خالية من الهدر، وموثقة رقمياً.</span>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="industrial-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
              <div className="flex items-center gap-2">
                <LedgerIcon name="target" size={20} />
                <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                  فلسفة العمل (PHILOSOPHY)
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 border border-current">
                قواعد الدقة الميكانيكية
              </span>
            </div>

            <p className="font-ledger text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              فلسفتنا في <strong>النمر</strong> مستلهمة من الهندسة الصناعية الدقيقة: لا مكان للارتجال أو للبيانات غير المؤكدة. كل إجراء، كل حركة تشغيل، وكل قيد مالي يخضع لدورة تحقق صارمة تضمن أعلى كفاءة وأقل تكلفة تشغيلية على المدى الطويل.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">1. دقة التنفيذ (Precision)</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">مطابقة تامة للمواصفات</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">2. الموثوقية (Reliability)</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">تشغيل متواصل بدون توقف</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">3. الشفافية (Auditability)</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">سلسلة تدقيق تشفيرية</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">4. الشراكة (Partnership)</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">التزام طويل الأمد بالنجاح</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          4. SERVICE PORTFOLIO (محفظة الحلول والخدمات المتكاملة)
          ======================================================== */}
      {(activeSection === 'overview' || activeSection === 'portfolio') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                CAPABILITIES & SOLUTIONS
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 dark:text-white">
                محفظة الخدمات والحلول الهندسية
              </h2>
            </div>
            <span className="text-xs font-mono border border-neutral-900 dark:border-white px-2 py-1 font-bold">
              05 ركائز تخصصية
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Capability 1 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="briefcase" size={24} />
                <span className="font-mono text-xs font-bold">[01]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                المقاولات العامة والتجهيزات الهندسية
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                تنفيذ مشاريع المقاولات المتكاملة من التصميم الهيكلي، شبكات التغذية، الأعمال الكهروميكانيكية، وحتى التشطيبات المعتمدة بمعايير الأمان العالمية.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #هندسة_مدنية • #إشراف_ميداني • #معايير_قياسية
              </div>
            </div>

            {/* Capability 2 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="cpu" size={24} />
                <span className="font-mono text-xs font-bold">[02]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                أنظمة الأتمتة وإدارة مسارات العمل (CRM)
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                حلول رقمية لأتمتة التواصل عبر واتساب، تصنيف العملاء، تتبع الصفقات، وجدولة المتابعات بدقة متناهية ودون أي تداخل بين الفرق.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #واتساب_CRM • #أتمتة_المبيعات • #سلاسل_المهام
              </div>
            </div>

            {/* Capability 3 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="punch-card" size={24} />
                <span className="font-mono text-xs font-bold">[03]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                إدارة القوى العاملة والتحقق البيومتري
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                نظام حضور وانصراف مدعوم ببصمة الوجه المضمنة رياضياً، حساب ساعات العمل الإضافي، وضبط الخصومات الآلية وفق لوائح العمل الصارمة.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #حضور_بيومتري • #رواتب_مؤتمتة • #إدارة_ورديات
              </div>
            </div>

            {/* Capability 4 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="shield" size={24} />
                <span className="font-mono text-xs font-bold">[04]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                التدقيق المشفر وسجلات الإدارة الرقمية
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                إصدار قسائم الرواتب والعقود بتوقيعات تشفيرية (HMAC-SHA256) وأكواد QR عامة للتحقق الفوري ومنع أي تعديل أو تزوير.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #تشفير_HMAC • #تحقق_QR • #سجلات_غير_قابلة_للتلاعب
              </div>
            </div>

            {/* Capability 5 */}
            <div className="industrial-card p-5 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <LedgerIcon name="globe" size={24} />
                <span className="font-mono text-xs font-bold">[05]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                التكامل اللوجستي وسلاسل التوريد (Supply Chain Integration)
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                ربط شامل للمستودعات مع خطوط الإنتاج والمواقع الإنشائية، تتبع حركة المواد الخام، وتزويد المشرفين بتقارير تدفق لحظية عبر لوحات تحكم هندسية مخصصة.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #إدارة_مستودعات • #سلاسل_إمداد • #تقارير_تشغيل
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================
          5. COMPANY HISTORY TIMELINE (المسار التاريخي)
          ======================================================== */}
      {(activeSection === 'overview' || activeSection === 'history') && (
        <section className="industrial-card p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LedgerIcon name="clock" size={22} />
              <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                المسار التاريخي ومحطات التطور (HISTORY)
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500">2011 — 2026</span>
          </div>

          <div className="space-y-6 border-r-2 border-neutral-900 dark:border-white pr-4 mr-2 font-ledger">
            {[
              {
                year: '2011',
                title: 'تأسيس المنشأة والانطلاق الميداني',
                desc: 'بداية العمل في المقاولات العامة وتجهيز المرافق التجارية والمباني الإدارية بالمملكة.',
              },
              {
                year: '2016',
                title: 'التوسع نحو التجهيزات الكهروميكانيكية المتطورة',
                desc: 'إنشاء قسم متخصص للأنظمة الكهروميكانيكية وإدارة منشآت الطاقة والمصانع.',
              },
              {
                year: '2020',
                title: 'أتمتة العمليات وإدارة الحضور البيومتري',
                desc: 'بناء المنصة الرقمية الداخلية لربط المواقع الإنشائية بنظام بصمة الوجه وسجلات الدوام.',
              },
              {
                year: '2024',
                title: 'تكامل منظومة CRM والمراسلات الفورية',
                desc: 'إطلاق نظام إدارة العملاء المعتمد على واتساب وشات الفرق الداخلي المقسم بالقنوات.',
              },
              {
                year: '2026',
                title: 'منظومة «دفتر الشركة» والتحقق المشفر',
                desc: 'اكتمال الهوية الهندسية الموحدة مع أمان تشفيري عالي وتوليد سندات الرواتب الرقمية المعتمدة.',
              },
            ].map((milestone, idx) => (
              <div key={idx} className="relative group">
                <span className="absolute -right-[23px] top-1.5 w-3 h-3 bg-neutral-900 dark:bg-white border-2 border-white dark:border-black rounded-none" />
                <div className="font-mono text-xs font-black text-neutral-950 dark:text-white">
                  [{milestone.year}]
                </div>
                <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white mt-0.5">
                  {milestone.title}
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                  {milestone.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          6. STRATEGIC PARTNERS (شبكة الشركاء المعتمدين)
          ======================================================== */}
      {(activeSection === 'overview' || activeSection === 'partners') && (
        <section className="space-y-4">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                ALLIANCES & ECOSYSTEM
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 dark:text-white">
                شبكة الشركاء الاستراتيجيين (PARTNER COMPANIES)
              </h2>
            </div>
            <span className="text-xs font-mono border border-neutral-900 dark:border-white px-2 py-0.5 font-bold">
              تكامل وتوافق شامل
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'TECHPLUS AUTOMATION',
                role: 'شريك تكامل الروبوتات والأنظمة الميكانيكية',
                desc: 'شراكة فنية لنقل تكنولوجيا الأتمتة الميكانيكية وخطوط النقل الآلي، مع أكثر من 600 تطبيق صناعي ناجح.',
                region: 'أوروبا / الشرق الأوسط',
              },
              {
                name: 'WES-TECH SOLUTIONS',
                role: 'شريك الحلول اللوجستية وتدفق المواد',
                desc: 'تعاون وثيق في تصميم أنظمة المناولة والتوزيع الآلي لضمان تدفق سلس وسريع للمواد في المشاريع الكبرى.',
                region: 'الولايات المتحدة / الخليج العربي',
              },
              {
                name: 'HEIDENHAIN COMPLIANCE',
                role: 'أنظمة التحكم والمطابقة الهندسية الدقيقة',
                desc: 'تنسيق تقني وتكامل مباشر للواجهات الرقمية للتحكم الآلي وأنظمة القياس فائقة الدقة.',
                region: 'ألمانيا / السعودية',
              },
              {
                name: 'SAUDI INDUSTRIAL HUBS',
                role: 'شبكة التوريد والإشراف المحلي',
                desc: 'توفير التواجد الميداني الفوري، الدعم الهندسي على مدار الساعة، وقطع الغيار الأصلية المعتمدة.',
                region: 'المملكة العربية السعودية',
              },
            ].map((partner, idx) => (
              <div key={idx} className="industrial-card p-5 space-y-2">
                <div className="flex items-center justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-2">
                  <h4 className="font-mono font-bold text-sm text-neutral-950 dark:text-white">
                    {partner.name}
                  </h4>
                  <span className="text-[10px] font-mono border border-current px-1 font-bold">
                    {partner.region}
                  </span>
                </div>
                <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                  {partner.role}
                </div>
                <p className="text-xs font-ledger text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {partner.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================
          7. OFFICIAL HEADQUARTERS & HOURS (المقر وساعات العمل)
          ======================================================== */}
      <section className="industrial-card p-6 sm:p-8 bg-[#fafafa] dark:bg-[#111111]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {/* Col 1: Contacts */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="building" size={16} />
              <span>المقر الرئيسي والاتصال</span>
            </div>
            <div className="space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <div className="font-bold">مؤسسة النمر للمقاولات والتشغيل</div>
              <div>طريق الملك فهد، المجمع الهندسي الحديث</div>
              <div>الرياض، المملكة العربية السعودية</div>
              <div className="pt-2">الهاتف الموحد: <span dir="ltr" className="font-bold">+966 11 400 9200</span></div>
              <div>البريد الرسمي: <span className="font-bold">contact@tiger-crm.sa</span></div>
            </div>
          </div>

          {/* Col 2: Office Hours */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="clock" size={16} />
              <span>أوقات العمل الإداري (OFFICE)</span>
            </div>
            <div className="space-y-1 text-neutral-700 dark:text-neutral-300">
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>الأحد – الخميس:</span>
                <span className="font-bold tabular-nums">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>الجمعة والسبت:</span>
                <span className="font-bold">عطلة إدارية</span>
              </div>
              <div className="text-[11px] text-neutral-500 pt-1">
                * الاستشارات الهندسية تتطلب موعداً مسبقاً
              </div>
            </div>
          </div>

          {/* Col 3: Logistics & Sites */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="shield" size={16} />
              <span>العمليات الميدانية واللوجستيات</span>
            </div>
            <div className="space-y-1 text-neutral-700 dark:text-neutral-300">
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>السبت – الخميس:</span>
                <span className="font-bold tabular-nums">07:00 – 19:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>فرق الطوارئ والصيانة:</span>
                <span className="font-bold">24 ساعة / 7 أيام</span>
              </div>
              <div className="text-[11px] text-neutral-500 pt-1">
                * فرق الصيانة الميدانية تغطي جميع مناطق المملكة
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal Stamp */}
      <div className="text-center font-mono text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-300 dark:border-neutral-800 pt-4">
        وثيقة تعريفية رسمية صادرة عن منظومة النمر الهندسية — جميع الحقوق محفوظة © 2026
      </div>
    </div>
  );
};
