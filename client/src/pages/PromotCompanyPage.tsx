import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export const PromotCompanyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'history' | 'philosophy' | 'portfolio' | 'partners'>('all');
  const [featuredVideoSource, setFeaturedVideoSource] = useState<'flow' | 'promot'>('flow');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeModalVideo, setActiveModalVideo] = useState<string>('https://www.youtube-nocookie.com/embed/Zjv8MfmMtNw');
  const videoSectionRef = useRef<HTMLDivElement>(null);

  const scrollToVideo = () => {
    videoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openVideo = (url: string) => {
    setActiveModalVideo(url);
    setIsVideoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0620] text-white font-sans antialiased selection:bg-[#381d92] selection:text-white" dir="rtl">
      {/* ========================================================
          1. TOP ANNOUNCEMENT & LOGISTICS BAR (نفس الشريط العلوي لـ Promot)
          ======================================================== */}
      <div className="bg-[#070414] border-b border-white/10 px-4 sm:px-8 py-2 text-xs font-mono text-neutral-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LOGISTICS & OPERATIONS:
            </span>
            <span className="text-neutral-400" dir="ltr">
              Mon - Thu: 08:00 - 12:00 &amp; 12:30 - 17:00 / Fri: 08:00 - 11:30
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-neutral-400">المقر: الرياض، المملكة العربية السعودية</span>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <span className="text-white underline cursor-pointer">العربية</span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400 hover:text-white cursor-pointer" dir="ltr">EN</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MAIN CORPORATE NAVIGATION HEADER (ترويسة PROMOT العصرية)
          ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#0b0620]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo with Industrial Aesthetic */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#381d92] via-[#5b21b6] to-[#1c0a63] flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tighter">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
                  TIGER <span className="text-purple-400 font-normal">AUTOMATION</span>
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-200">
                  EST. 2011
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 tracking-wider">
                MACHINE &amp; WORKFLOW AUTOMATION EXPERTS
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <a href="#about" className="hover:text-white transition-colors">من نحن</a>
            <a href="#video-showcase" className="hover:text-white transition-colors">عروض الفيديو</a>
            <a href="#capabilities" className="hover:text-white transition-colors">حلول الأتمتة</a>
            <a href="#history" className="hover:text-white transition-colors">المسار التاريخي</a>
            <a href="#partners" className="hover:text-white transition-colors">الشركاء الدوليين</a>
            <a href="#contact" className="hover:text-white transition-colors">ساعات العمل والتواصل</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#381d92] to-[#1c0a63] hover:from-[#4c28c4] hover:to-[#270e87] text-white text-xs sm:text-sm font-bold border border-purple-400/40 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              >
                <span>الدخول لمنصة الإدارة (CRM)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#381d92] to-[#1c0a63] hover:from-[#4c28c4] hover:to-[#270e87] text-white text-xs sm:text-sm font-bold border border-purple-400/40 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              >
                <span>تسجيل دخول الموظفين</span>
                <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          3. HERO SECTION WITH HIGH-TECH VIDEO BACKGROUND (نفس PROMOT)
          ======================================================== */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
        {/* Background Looping Video from User Flow Video & Promot Robotics */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="w-full h-full object-cover opacity-45 scale-105"
            poster="https://www.promot-automation.com/wp-content/uploads/2026/02/Promot_Social.jpg"
          >
            {/* User Flow promotional video as primary source */}
            <source
              src="/videos/tiger_promo.mp4"
              type="video/mp4"
            />
            {/* Fallback Promot Machine Automation video */}
            <source
              src="https://www.promot-automation.com/wp-content/uploads/2026/01/header-test-Unternehmen.mp4"
              type="video/mp4"
            />
            {/* Fallback robotics loop */}
            <source
              src="https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-working-in-a-factory-42898-large.mp4"
              type="video/mp4"
            />
          </video>
          {/* Tech Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0620] via-[#0b0620]/80 to-[#1c0a63]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 py-20 text-center space-y-6">
          {/* Breadcrumb & Spec Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono text-purple-200">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
            <span>HOME // COMPANY // TIGER AUTOMATION GMBH</span>
          </div>

          {/* Promot Headline Style */}
          <div className="space-y-3">
            <h2 className="text-sm sm:text-base font-mono uppercase tracking-widest text-purple-400 font-bold">
              YOUR EXPERT for customised automation solutions of metal cutting machine tools
            </h2>
            <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              شريكك الخبير لأنظمة الأتمتة الصناعية والتشغيل الهندسي المتكامل
            </h1>
          </div>

          <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            منذ أكثر من 15 عاماً، نبتكر حلولاً متقدمة لمناولة المواد، إدارة خطوط الإنتاج، والربط الرقمي الكامل بين الفرق الميدانية وقواعد البيانات بموثوقية بنسبة 100%.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              type="button"
              onClick={scrollToVideo}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white text-[#0b0620] hover:bg-neutral-200 font-bold text-sm sm:text-base shadow-xl transition-all cursor-pointer group"
            >
              <span className="w-7 h-7 rounded-full bg-[#1c0a63] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </span>
              <span>شاهد الفيلم التعريفي (HD Video)</span>
            </button>

            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1c0a63]/80 hover:bg-[#1c0a63] text-white font-bold text-sm sm:text-base border border-purple-500/40 shadow-lg transition-all"
            >
              <span>استكشف حلول الأتمتة</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-white/10 text-right sm:text-center">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">+6,000</div>
              <div className="text-xs text-neutral-300 mt-1">مشروع وتطبيق منجز</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">15+</div>
              <div className="text-xs text-neutral-300 mt-1">عاماً من الخبرة الهندسية</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">99.8%</div>
              <div className="text-xs text-neutral-300 mt-1">دقة وموثوقية التشغيل</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">24/7</div>
              <div className="text-xs text-neutral-300 mt-1">دعم وتحكم سحابي فوري</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. WHO WE ARE & OFFICIAL VIDEO EMBED SECTION (فيديو PROMOT الرسمي)
          ======================================================== */}
      <section id="about" ref={videoSectionRef} className="py-20 bg-[#100b2b] border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
              WHO WE ARE // TIGER AUTOMATION COMPANY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              من نحن — خبراء أتمتة الأنظمة والمعدات الصناعية
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              تأسست المنشأة عام 2011 بهدف دعم وتطوير كفاءة المنشآت الصناعية والمقاولات عبر أتمتة العمليات ومناولة الموارد. أكثر من 6,000 مشروع منجز يتحدث عن نفسه: نجاحكم هو مهمتنا.
            </p>
          </div>

          {/* Video Switcher Tabs */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setFeaturedVideoSource('flow')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-mono font-bold transition-all ${
                featuredVideoSource === 'flow'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              ★ فيديو النمر (إصدار فلو - 1080p)
            </button>
            <button
              type="button"
              onClick={() => setFeaturedVideoSource('promot')}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-mono font-bold transition-all ${
                featuredVideoSource === 'promot'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              عرض تقنيات PROMOT (4K)
            </button>
          </div>

          {/* Embedded HD Video Player with Flow Video & PROMOT */}
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden border-2 border-purple-500/40 shadow-2xl bg-black">
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {featuredVideoSource === 'flow' ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  src="/videos/tiger_promo.mp4"
                  poster="https://www.promot-automation.com/wp-content/uploads/2026/02/Promot_Social.jpg"
                >
                  <source src="/videos/tiger_promo.mp4" type="video/mp4" />
                </video>
              ) : (
                <iframe
                  src="https://www.youtube-nocookie.com/embed/Zjv8MfmMtNw?autoplay=1&rel=0&modestbranding=1"
                  title="PROMOT Automation Company Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>

            {/* Video Caption Bar */}
            <div className="p-4 bg-[#070414] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">
                  {featuredVideoSource === 'flow' ? 'فيديو المنظومة الترويجي:' : 'الفيلم التعريفي لـ PROMOT:'}
                </span>
                <span className="text-neutral-400">
                  {featuredVideoSource === 'flow'
                    ? 'الإنتاج الحصري المعتمد لمنظومة النمر للأتمتة الصناعية (Flow Edition)'
                    : 'تقنيات الأتمتة المتقدمة ومناولة الأدوات والقطع الهندسية'}
                </span>
              </div>
              <span className="text-purple-300 font-bold" dir="ltr">
                {featuredVideoSource === 'flow' ? 'FLOW // 1080p FULL HD' : '4K ULTRA HD // OFFICIAL'}
              </span>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300 text-xl font-black">
                01
              </div>
              <h3 className="text-lg font-bold text-white">الهندسة المعيارية المتكاملة</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                نظام نمطي شامل لروبوتات الجانتري، خلايا الروبوت، وحلول البرمجيات المخصصة التي تلبي جميع متطلبات أتمتة الورش والمصانع.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300 text-xl font-black">
                02
              </div>
              <h3 className="text-lg font-bold text-white">الأتمتة الهجينة (Hybrid Automation)</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                معالجة القطع وتجهيزها بدون توقف مع تكامل كامل لتدفق المواد ومناولة الصناديق عبر عربات AGVs الذكية.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300 text-xl font-black">
                03
              </div>
              <h3 className="text-lg font-bold text-white">برمجيات التحكم السحابية (PROMRO)</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                واجهات تشغيل بديهية (ProHMI)، إدارة أوامر الإنتاج (ProMASTER)، والتحكم بالمراسلات اللحظية للفرق والمبيعات.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. 4 INTERACTIVE HALLMARK CARDS (History, Philosophy, Portfolio, Stories)
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
            EXPLORE PROMOT &amp; TIGER
          </div>
          <h2 className="text-3xl font-black text-white">أركان الريادة المؤسسية</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: History */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1c0a63]/40 to-[#0b0620] border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">HISTORY</span>
              <span className="text-xs font-mono text-neutral-400">15+ YEARS</span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
              المسار التاريخي (History)
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              لأكثر من 15 عاماً، يمثل اسم النمر مرادفاً للمناولة الذكية، التلقائية بالكامل، والآمنة تشغيلياً لكافة مراحل المشاريع الهندسية وخطوط الإنتاج.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
              <span>استعراض المحطات الزمنية</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Card 2: Philosophy */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1c0a63]/40 to-[#0b0620] border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">PHILOSOPHY</span>
              <span className="text-xs font-mono text-neutral-400">OUR GOAL</span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
              فلسفة العمل (Philosophy)
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              هدفنا الدائم هو إيجاد حلول أتمتة وتشغيل اقتصادية ومستدامة لمهام عملائنا مع تقليل زمن التجهيز والهدر إلى الصفر.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
              <span>معايير الجودة والاستدامة</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Card 3: Service Portfolio */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1c0a63]/40 to-[#0b0620] border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">SERVICE PORTFOLIO</span>
              <span className="text-xs font-mono text-neutral-400">TURNKEY SOLUTIONS</span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
              محفظة الخدمات والحلول (Service Portfolio)
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              نزود المنشآت بحلول شاملة جاهزة للتسليم (Turnkey)، ذات تكلفة اقتصادية ومستقبلية واعدة من مصدر واحد متكامل.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
              <span>تفاصيل الخدمات والمنتجات</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>

          {/* Card 4: Success Stories */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1c0a63]/40 to-[#0b0620] border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">SUCCESS STORIES</span>
              <span className="text-xs font-mono text-neutral-400">MEASURABLE VALUE</span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
              قصص النجاح (Success Stories)
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              مشاريع استثنائية تتميز بالأداء العالي، الابتكار الهندسي، والقيمة المضافة الملموسة في مختلف القطاعات الحيوية.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform">
              <span>استعراض دراسات الحالة</span>
              <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. VIDEO REELS & ROBOTICS GALLERY (معرض الفيديوهات والتطبيقات)
          ======================================================== */}
      <section id="video-showcase" className="py-20 bg-[#070414] border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                AUTOMATION IN ACTION
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                معرض الفيديوهات الحية والتطبيقات الذكية
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
              شاهد كيف تعمل روبوتات المناولة وخوارزميات التحكم في بيئة عمل حقيقية بدون توقف.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Video Card 1: User's Flow Video */}
            <div
              onClick={() => openVideo('/videos/tiger_promo.mp4')}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white/5 border-2 border-purple-500/50 hover:border-purple-400 transition-all space-y-3 relative shadow-xl shadow-purple-950/40"
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform opacity-90"
                  src="/videos/tiger_promo.mp4"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform border border-white/30">
                    <svg className="w-6 h-6 fill-current mr-0.5" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-600 text-[10px] font-mono font-bold text-white shadow">
                  ★ إنتاج فلو (FLOW HD)
                </span>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400 font-bold">
                  فيديو المنظومة الحصري
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm sm:text-base">
                  فيديو النمر التعريفي (Flow Edition)
                </h4>
                <p className="text-xs text-neutral-300 line-clamp-2">
                  الإنتاج الترويجي المتكامل بدقة 1080p Full HD لاستعراض قدرات المنظومة الصناعية والتشغيل المتكامل.
                </p>
              </div>
            </div>

            {/* Video Card 2 */}
            <div
              onClick={() => openVideo('https://www.youtube-nocookie.com/embed/Zjv8MfmMtNw')}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-400 transition-all space-y-3"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                >
                  <source
                    src="https://assets.mixkit.co/videos/preview/mixkit-robotic-arm-working-in-a-factory-42898-large.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                  02:10 4K
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                  التحكم اللوجستي وعربات AGVs الذكية
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  ربط حركة المواد بين المستودعات والمواقع الإنشائية بدون أي تدخل يدوي.
                </p>
              </div>
            </div>

            {/* Video Card 3 */}
            <div
              onClick={() => openVideo('https://www.youtube-nocookie.com/embed/Zjv8MfmMtNw')}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-400 transition-all space-y-3"
            >
              <div className="relative aspect-video bg-black/60 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                >
                  <source
                    src="https://www.promot-automation.com/wp-content/uploads/2026/01/header-test-Unternehmen.mp4"
                    type="video/mp4"
                  />
                </video>
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                  04:20 HD
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                  منظومة CRM والربط الميداني اللحظي
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  شرح التكامل السحابي بين تطبيق العملاء والحضور البيومتري وتتبع الصفقات.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. PARTNER COMPANIES (نفس شبكة الشركاء لـ PROMOT)
          ======================================================== */}
      <section id="partners" className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
            GLOBAL NETWORK // PARTNER COMPANIES
          </div>
          <h2 className="text-3xl font-black text-white">
            شبكة الشركاء الدوليين المعتمدين
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto">
            بالتعاون مع نخبة من الشركاء الدوليين، تقدم النمر حلول أتمتة مخصصة تضمن أعلى درجات الكفاءة والتميز الهندسي.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">TECHPLUS</span>
              <span className="text-[10px] font-mono text-neutral-400">FRANCE</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              رائد تكامل الروبوتات منذ 1994 مع أكثر من 600 منشأة صناعية ناجحة تعتمد حلول الأتمتة الميكانيكية عالية الأداء.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">WES-TECH</span>
              <span className="text-[10px] font-mono text-neutral-400">USA</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              شريك التوزيع والحلول اللوجستية في أمريكا الشمالية لضمان الدعم الهندسي المباشر وسرعة الاستجابة التشغيلية.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">HEIDENHAIN</span>
              <span className="text-[10px] font-mono text-neutral-400">GERMANY</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              عضو برنامج الشركاء المعتمد لتطوير واجهات الربط الرقمية بين أنظمة التحكم فائقة الدقة ووحدات الأتمتة.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">BGTECHNOLOGY</span>
              <span className="text-[10px] font-mono text-neutral-400">BRAZIL</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              شراكة هندسية تدمج بين التميز الألماني والمتطلبات الصناعية المتنامية في الأسواق الدولية.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. CORPORATE INDUSTRIAL FOOTER (مواقيت العمل والمقر)
          ======================================================== */}
      <footer id="contact" className="bg-[#070414] border-t border-white/10 pt-16 pb-12 text-xs font-mono text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="text-white font-black text-base font-sans">
              TIGER AUTOMATION GMBH
            </div>
            <p className="leading-relaxed">
              الخبير المعتمد لأنظمة المقاولات المتكاملة وأتمتة خطوط الإنتاج والبرمجيات التشغيلية.
            </p>
            <div className="space-y-1 text-[11px] text-neutral-300">
              <div>طريق الملك فهد، المجمع الهندسي المركزي</div>
              <div>الرياض، المملكة العربية السعودية</div>
              <div dir="ltr" className="font-bold pt-1">+966 11 400 9200</div>
              <div>contact@tiger-automation.sa</div>
            </div>
          </div>

          {/* Col 2: Office Hours */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
              OPENING HOURS OFFICE
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>الأحد – الخميس:</span>
                <span className="text-white font-bold" dir="ltr">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between">
                <span>الجمعة والسبت:</span>
                <span className="text-neutral-500">عطلة إدارية</span>
              </div>
              <p className="text-neutral-500 pt-2 leading-relaxed">
                * المقابلات والاستشارات تتطلب حجزاً مسبقاً.
              </p>
            </div>
          </div>

          {/* Col 3: Logistics Hours */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
              LOGISTICS &amp; WORKSHOPS
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span>السبت – الخميس:</span>
                <span className="text-white font-bold" dir="ltr">07:00 – 19:00</span>
              </div>
              <div className="flex justify-between">
                <span>فرق الطوارئ الميدانية:</span>
                <span className="text-emerald-400 font-bold">24 ساعة / 7 أيام</span>
              </div>
            </div>
          </div>

          {/* Col 4: Quick Portal Access */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
              منظومة العمل الداخلية
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="w-full text-right p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between"
              >
                <span>سجل العملاء والمبيعات (CRM)</span>
                <span>←</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/attendance')}
                className="w-full text-right p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between"
              >
                <span>كارت الدوام وبصمة الوجه</span>
                <span>←</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="w-full text-right p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between"
              >
                <span>الشات الداخلي والقنوات</span>
                <span>←</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © 2026 TIGER AUTOMATION GMBH — ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <span>ISO 9001:2015</span>
            <span>CE COMPLIANCE</span>
            <span>INDUSTRY 4.0</span>
          </div>
        </div>
      </footer>

      {/* ========================================================
          9. VIDEO MODAL POPUP
          ======================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-3 bg-[#070414] border-b border-white/10">
              <span className="text-xs font-mono font-bold text-purple-300">
                PROMOT &amp; TIGER AUTOMATION // VIDEO PLAYER
              </span>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {activeModalVideo.endsWith('.mp4') ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  src={activeModalVideo}
                >
                  <source src={activeModalVideo} type="video/mp4" />
                </video>
              ) : (
                <iframe
                  src={`${activeModalVideo}?autoplay=1&rel=0`}
                  title="Automation Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
