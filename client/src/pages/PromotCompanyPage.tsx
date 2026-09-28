import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export const PromotCompanyPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'history' | 'philosophy' | 'portfolio' | 'partners'>('all');
  const [featuredVideoSource, setFeaturedVideoSource] = useState<'flow' | 'promot'>('flow');
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeModalVideo, setActiveModalVideo] = useState<string>('/videos/tiger_promo.mp4');
  const videoSectionRef = useRef<HTMLDivElement>(null);

  const scrollToVideo = () => {
    videoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openVideo = (url: string) => {
    setActiveModalVideo(url);
    setIsVideoModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0620] text-white font-sans antialiased selection:bg-[#381d92] selection:text-white" dir="ltr">
      {/* ========================================================
          1. TOP ANNOUNCEMENT & LOGISTICS BAR
          ======================================================== */}
      <div className="bg-[#070414] border-b border-white/10 px-4 sm:px-8 py-2 text-xs font-mono text-neutral-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LOGISTICS &amp; OPERATIONS:
            </span>
            <span className="text-neutral-400">
              Mon - Thu: 08:00 - 12:00 &amp; 12:30 - 17:00 / Fri: 08:00 - 11:30
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-neutral-400">Headquarters: Riyadh, Kingdom of Saudi Arabia</span>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="text-white underline cursor-pointer">EN</span>
              <span className="text-neutral-500">/</span>
              <span className="text-neutral-400 hover:text-white cursor-pointer">AR</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. MAIN CORPORATE NAVIGATION HEADER
          ======================================================== */}
      <header className="sticky top-0 z-50 bg-[#0b0620]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo: Tiger */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#381d92] via-[#5b21b6] to-[#1c0a63] flex items-center justify-center border border-white/20 shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-xl tracking-tighter">T</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                  Tiger
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-200">
                  AUTOMATION
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 tracking-wider">
                MACHINE &amp; WORKFLOW AUTOMATION EXPERTS
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-300">
            <a href="#about" className="hover:text-white transition-colors">Who We Are</a>
            <a href="#video-showcase" className="hover:text-white transition-colors">Video Showcase</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Automation Solutions</a>
            <a href="#history" className="hover:text-white transition-colors">History</a>
            <a href="#partners" className="hover:text-white transition-colors">Partner Companies</a>
            <a href="#contact" className="hover:text-white transition-colors">Operating Hours &amp; Contact</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#381d92] to-[#1c0a63] hover:from-[#4c28c4] hover:to-[#270e87] text-white text-xs sm:text-sm font-bold border border-purple-400/40 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              >
                <span>Access CRM Platform</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#381d92] to-[#1c0a63] hover:from-[#4c28c4] hover:to-[#270e87] text-white text-xs sm:text-sm font-bold border border-purple-400/40 shadow-lg hover:shadow-purple-500/20 transition-all cursor-pointer"
              >
                <span>Employee Login</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          3. HERO SECTION WITH HIGH-TECH VIDEO BACKGROUND
          ======================================================== */}
      <section className="relative min-h-[78vh] flex items-center justify-center overflow-hidden">
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
            <span>HOME // COMPANY // TIGER AUTOMATION</span>
          </div>

          {/* Promot Headline Style */}
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-mono uppercase tracking-widest text-purple-400 font-bold">
              YOUR EXPERT for customised automation solutions of machine tools
            </h2>
            <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              Your Expert for Machine Automation &amp; Intelligent Operations
            </h1>
          </div>

          <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            For over 15 years, Tiger has been pioneering intelligent, fully automatic and operationally reliable solutions for workpiece handling, workflow automation, and real-time CRM field synchronization with 100% precision.
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
              <span>Watch Official Film (1080p HD)</span>
            </button>

            <a
              href="#capabilities"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#1c0a63]/80 hover:bg-[#1c0a63] text-white font-bold text-sm sm:text-base border border-purple-500/40 shadow-lg transition-all"
            >
              <span>Explore Automation Systems</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-white/10 text-center">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">+6,000</div>
              <div className="text-xs text-neutral-300 mt-1">Realized Projects &amp; Installations</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">15+</div>
              <div className="text-xs text-neutral-300 mt-1">Years of Engineering Excellence</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">99.8%</div>
              <div className="text-xs text-neutral-300 mt-1">Operational Reliability</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="text-2xl sm:text-4xl font-black font-mono text-purple-400">24/7</div>
              <div className="text-xs text-neutral-300 mt-1">Real-Time Cloud Diagnostics</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. WHO WE ARE & OFFICIAL VIDEO EMBED SECTION
          ======================================================== */}
      <section id="about" ref={videoSectionRef} className="py-20 bg-[#100b2b] border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
              WHO WE ARE // TIGER
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Who We Are — Machine Tool &amp; Workflow Automation Experts
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
              Founded in 2011, Tiger has been dedicated to promoting your productivity through intelligent machine automation and operational control. More than 6,000 realized projects speak for themselves: Your success is our mission.
            </p>
          </div>

          {/* Video Switcher Tabs */}
          <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => setFeaturedVideoSource('flow')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                featuredVideoSource === 'flow'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              ★ Tiger Video (Flow Edition - 1080p)
            </button>
            <button
              type="button"
              onClick={() => setFeaturedVideoSource('promot')}
              className={`flex-1 py-2.5 px-4 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                featuredVideoSource === 'promot'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30 border border-purple-400'
                  : 'bg-white/10 text-neutral-300 hover:bg-white/20 border border-white/10'
              }`}
            >
              PROMOT Tech Showcase (4K)
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
                  title="Tiger Automation Company Video"
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
                  {featuredVideoSource === 'flow' ? 'Official Featured Production:' : 'PROMOT Automation Video:'}
                </span>
                <span className="text-neutral-400">
                  {featuredVideoSource === 'flow'
                    ? 'Tiger Exclusive Industrial Automation Video Production (Flow Edition)'
                    : 'Gantry Loader Systems & Flexible Robot Cells'}
                </span>
              </div>
              <span className="text-purple-300 font-bold">
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
              <h3 className="text-lg font-bold text-white">Modular Gantry Systems</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Extensive modular system for gantry robots, robot cells, and customized software solutions forming the foundation of our wide-ranging portfolio.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300 text-xl font-black">
                02
              </div>
              <h3 className="text-lg font-bold text-white">Hybrid Automation &amp; AGVs</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Seamless setup-free workpiece processing with autonomous mobile robots (AGVs), pallet changers, and intelligent bin-picking systems.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-400/30 flex items-center justify-center text-purple-300 text-xl font-black">
                03
              </div>
              <h3 className="text-lg font-bold text-white">Cloud Workflow Software</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Intuitive ProHMI operator touchscreens, ProMASTER production planning, and integrated WhatsApp CRM with cryptographic HMAC audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. 4 HALLMARK PILLARS (History, Philosophy, Portfolio, Stories)
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
            EXPLORE TIGER
          </div>
          <h2 className="text-3xl font-black text-white">Pillars of Operational Excellence</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: History */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-[#1c0a63]/40 to-[#0b0620] border border-purple-500/30 hover:border-purple-400 transition-all shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-purple-300 font-bold">HISTORY</span>
              <span className="text-xs font-mono text-neutral-400">15+ YEARS</span>
            </div>
            <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
              Company History
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              For over 15 years, the name Tiger has been standing for intelligent, fully automatic and operationally reliable handling of workpieces, pallets, and operational assets.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Historical Milestones</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Philosophy &amp; Standards
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Our constant goal at Tiger is to discover economical, zero-downtime automation solutions tailored to the exacting demands of modern enterprise projects.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Quality &amp; Zero-Waste Standards</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Service Portfolio
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              We provide enterprise clients with cost-effective, future-proof complete turnkey solutions from a single integrated engineering and software source.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Explore Capability Matrix</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              Success Stories
            </h3>
            <p className="text-sm text-neutral-300 leading-relaxed">
              Our flagship installations showcase real-world projects that stand out through unmatched throughput, precision engineering, and measurable ROI.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>Review Case Studies</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          6. VIDEO REELS & ROBOTICS GALLERY
          ======================================================== */}
      <section id="video-showcase" className="py-20 bg-[#070414] border-t border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
                AUTOMATION IN ACTION
              </span>
              <h2 className="text-3xl font-black text-white mt-1">
                Live Video Showcase &amp; Robotics Gallery
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
              Watch how our robotic handling systems, smart AGVs, and cloud telemetry operate seamlessly in live production environments.
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
                    <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600 text-[10px] font-mono font-bold text-white shadow">
                  ★ FLOW PRODUCTION (1080p)
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-400 font-bold">
                  Exclusive Tiger Film
                </span>
              </div>
              <div className="p-4 space-y-1">
                <h4 className="font-bold text-white group-hover:text-purple-300 transition-colors text-sm sm:text-base">
                  Tiger Official Promotional Film (Flow Edition)
                </h4>
                <p className="text-xs text-neutral-300 line-clamp-2">
                  Complete 1080p Full HD promotional reel showcasing Tiger's turnkey automation and engineering capabilities.
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
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
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
                  Autonomous AGVs &amp; Warehouse Dispatch
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  Unmanned mobile robotics linking storage racks directly to assembly lines without human bottleneck.
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
                    <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
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
                  Cloud CRM &amp; Field Telemetry Hub
                </h4>
                <p className="text-xs text-neutral-400 line-clamp-2">
                  End-to-end integration between WhatsApp client pipelines, biometric clocking, and payroll auditing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          7. PARTNER COMPANIES
          ======================================================== */}
      <section id="partners" className="py-20 max-w-7xl mx-auto px-4 sm:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">
            GLOBAL ALLIANCES // PARTNER COMPANIES
          </div>
          <h2 className="text-3xl font-black text-white">
            Our Certified International Network
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mx-auto">
            Working alongside an elite global partner network, Tiger delivers customized automation solutions with unmatched local responsiveness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">TECHPLUS</span>
              <span className="text-[10px] font-mono text-neutral-400">FRANCE</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Robotics integration pioneer since 1994 with over 600 successful manufacturing installations worldwide.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">WES-TECH</span>
              <span className="text-[10px] font-mono text-neutral-400">USA</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Official North American distribution and automation partner ensuring rapid on-site technical support.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">HEIDENHAIN</span>
              <span className="text-[10px] font-mono text-neutral-400">GERMANY</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Certified partner developing seamless digital interfaces between high-precision CNC controllers and robotic loaders.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="font-mono font-bold text-sm text-purple-300">BGTECHNOLOGY</span>
              <span className="text-[10px] font-mono text-neutral-400">BRAZIL</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Fusing German engineering excellence with emerging industrial market demands across South America.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          8. CORPORATE INDUSTRIAL FOOTER
          ======================================================== */}
      <footer id="contact" className="bg-[#070414] border-t border-white/10 pt-16 pb-12 text-xs font-mono text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="text-white font-black text-lg tracking-tight font-sans">
              Tiger
            </div>
            <p className="leading-relaxed">
              Your recognized expert for customized machine tool automation, industrial robotics, and intelligent operations.
            </p>
            <div className="space-y-1 text-[11px] text-neutral-300">
              <div>King Fahd Road, Modern Engineering Complex</div>
              <div>Riyadh, Kingdom of Saudi Arabia</div>
              <div className="font-bold pt-1">+966 11 400 9200</div>
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
                <span>Sunday – Thursday:</span>
                <span className="text-white font-bold">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between">
                <span>Friday &amp; Saturday:</span>
                <span className="text-neutral-500">Administrative Weekend</span>
              </div>
              <p className="text-neutral-500 pt-2 leading-relaxed">
                * Engineering consultations by appointment.
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
                <span>Saturday – Thursday:</span>
                <span className="text-white font-bold">07:00 – 19:00</span>
              </div>
              <div className="flex justify-between">
                <span>Field Emergency Teams:</span>
                <span className="text-emerald-400 font-bold">24 / 7 Active</span>
              </div>
            </div>
          </div>

          {/* Col 4: Quick Portal Access */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider border-b border-white/10 pb-2">
              Enterprise Work System
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Customers &amp; CRM Pipeline</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/attendance')}
                className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Attendance &amp; Biometrics</span>
                <span>→</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/chat')}
                className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Team Communication &amp; Channels</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-8 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © 2026 Tiger — All Rights Reserved.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between p-3.5 bg-[#070414] border-b border-white/10">
              <span className="text-xs font-mono font-bold text-purple-300">
                TIGER AUTOMATION // VIDEO PLAYER
              </span>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-white cursor-pointer font-bold"
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
