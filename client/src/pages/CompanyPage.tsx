import React, { useState } from 'react';
import { LedgerIcon } from '../components/icons/LedgerIcons.js';
import { RubberStamp } from '../components/common/RubberStamp.js';

export const CompanyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'history' | 'portfolio' | 'partners'>('overview');

  return (
    <div className="space-y-10 selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* 1. INDUSTRIAL HERO HEADER */}
      <section className="relative border-2 border-neutral-900 dark:border-white p-6 sm:p-10 bg-white dark:bg-neutral-950 shadow-solid bg-industrial-grid">
        {/* Top Spec Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-neutral-900 dark:border-neutral-100 pb-4 mb-6 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="tech-spec-badge bg-neutral-900 text-white dark:bg-white dark:text-black px-2 py-0.5 font-bold">
              SYS-AUT-2026 // INDUSTRIAL SPEC
            </span>
            <span className="text-neutral-500 hidden sm:inline">
              Tiger Machine Automation & Industrial Systems
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="border border-neutral-900 dark:border-white px-2 py-0.5 font-bold">
              Certified ISO 9001:2015
            </span>
            <span className="text-neutral-600 dark:text-neutral-400">CR #1010-TIGER</span>
          </div>
        </div>

        {/* Hero Title & Mission */}
        <div className="max-w-4xl space-y-4">
          <div className="inline-block text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-neutral-900 dark:border-white">
            YOUR EXPERT FOR INDUSTRIAL AUTOMATION & MACHINE SYSTEMS
          </div>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-neutral-950 dark:text-white leading-tight tracking-normal">
            Precision Machine Automation & Workflow Orchestration
          </h1>
          <p className="text-sm sm:text-base font-ledger text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-3xl">
            We deliver state-of-the-art industrial automation, robotics integration, and deterministic operations software. We empower manufacturers and enterprises to eliminate workflow friction and run continuous, error-free production lines.
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap gap-2 pt-6 mt-6 border-t border-dashed border-neutral-300 dark:border-neutral-700">
          {[
            { id: 'overview', label: 'Overview & Philosophy' },
            { id: 'history', label: 'Evolution Timeline' },
            { id: 'portfolio', label: 'Solutions Portfolio' },
            { id: 'partners', label: 'Alliances Network' },
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

      {/* 2. KEY INDUSTRIAL METRICS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { metric: '+4,500', label: 'Automated Operations Delivered', sub: 'Global enterprise contracts' },
          { metric: '15+', label: 'Years Engineering Experience', sub: 'Proven industrial leadership' },
          { metric: '99.8%', label: 'Operational Precision Index', sub: 'Rigorous DIN/ISO standards' },
          { metric: '24/7', label: 'Continuous Telemetry & Support', sub: 'Immediate response deployment' },
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

      {/* 3. WHO WE ARE & PHILOSOPHY */}
      {(activeSection === 'overview' || activeSection === 'portfolio') && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Who We Are */}
          <div className="industrial-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
              <div className="flex items-center gap-2">
                <LedgerIcon name="building" size={20} />
                <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                  WHO WE ARE
                </h2>
              </div>
              <RubberStamp label="CERTIFIED CORP" recordId="corp-tiger-01" />
            </div>

            <p className="font-ledger text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              <strong>Tiger</strong> was founded to be the definitive industrial automation and process orchestration partner. We fuse mechanical precision with deterministic cloud infrastructure to ensure that every machine cell, human operator, and business transaction operates at peak performance.
            </p>

            <div className="space-y-2 pt-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1.5">
                <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
                <span className="font-bold text-neutral-900 dark:text-white">Vision:</span>
                <span>To be the global benchmark for turn-key machine automation and digital operations.</span>
              </div>
              <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 dark:border-neutral-700 pb-1.5">
                <span className="w-2 h-2 bg-neutral-900 dark:bg-white" />
                <span className="font-bold text-neutral-900 dark:text-white">Mission:</span>
                <span>Deliver zero-downtime, fully audited machine cells and intelligent workflow pipelines.</span>
              </div>
            </div>
          </div>

          {/* Philosophy */}
          <div className="industrial-card p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
              <div className="flex items-center gap-2">
                <LedgerIcon name="target" size={20} />
                <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                  OUR PHILOSOPHY
                </h2>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 border border-current">
                Deterministic Precision
              </span>
            </div>

            <p className="font-ledger text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              At <strong>Tiger</strong>, our engineering culture rejects approximations and ambiguity. Every kinematic trajectory, PLC signal, and customer record is backed by an auditable chain of custody that guarantees operational consistency.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">1. Precision</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Absolute design compliance</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">2. Reliability</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">24/7 unhindered runtime</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">3. Auditability</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Cryptographic log trail</div>
              </div>
              <div className="border border-neutral-900 dark:border-white p-2.5 bg-neutral-50 dark:bg-neutral-900">
                <div className="font-bold text-neutral-950 dark:text-white">4. Partnership</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">Decades of client trust</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. SERVICE PORTFOLIO */}
      {(activeSection === 'overview' || activeSection === 'portfolio') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b-2 border-neutral-900 dark:border-white pb-3">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                CAPABILITIES & SOLUTIONS
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 dark:text-white">
                Engineering & Technology Portfolio
              </h2>
            </div>
            <span className="text-xs font-mono border border-neutral-900 dark:border-white px-2 py-1 font-bold">
              05 Core Pillars
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
                Machine Tool Automation & Gantry Systems
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Turn-key machine loading, linear portals, robot cells, and raw workpiece buffers engineered for high-throughput CNC machining.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #Robotics • #GantryPortals • #CNCLoading
              </div>
            </div>

            {/* Capability 2 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="cpu" size={24} />
                <span className="font-mono text-xs font-bold">[02]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                Tiger CRM & WhatsApp Workflow Automation
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Direct WhatsApp integration, dynamic sales pipelines, automated scripts, and customer ledger management built directly into your workflow.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #WhatsAppCRM • #SalesPipeline • #Automation
              </div>
            </div>

            {/* Capability 3 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="punch-card" size={24} />
                <span className="font-mono text-xs font-bold">[03]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                Biometric Face Authentication & Time Clock
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                AES-256-GCM encrypted biometric facial verification with liveness challenges, automated work shifts, and deterministic deductions.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #FaceBiometrics • #TimeClock • #Payroll
              </div>
            </div>

            {/* Capability 4 */}
            <div className="industrial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <LedgerIcon name="shield" size={24} />
                <span className="font-mono text-xs font-bold">[04]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                Cryptographic Payroll Slips & QR Verification
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Every payslip and accounting record is sealed using HMAC-SHA256 signatures, verifiable via public QR codes to ensure audit authenticity.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #HMACSignatures • #QRVerification • #ImmutableLedger
              </div>
            </div>

            {/* Capability 5 */}
            <div className="industrial-card p-5 space-y-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <LedgerIcon name="globe" size={24} />
                <span className="font-mono text-xs font-bold">[05]</span>
              </div>
              <h3 className="font-display font-bold text-base text-neutral-950 dark:text-white">
                Intralogistics & Supply Chain Orchestration
              </h3>
              <p className="font-ledger text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Seamless material flow connectivity from high-bay warehouses through processing centers with live dashboard telemetry and automated dispatch.
              </p>
              <div className="font-mono text-[10px] text-neutral-500 border-t border-dashed border-neutral-300 dark:border-neutral-700 pt-2">
                #Intralogistics • #MaterialFlow • #RealTimeTelemetry
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. COMPANY HISTORY TIMELINE */}
      {(activeSection === 'overview' || activeSection === 'history') && (
        <section className="industrial-card p-6 sm:p-8 space-y-6">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LedgerIcon name="clock" size={22} />
              <h2 className="font-display font-bold text-xl text-neutral-950 dark:text-white">
                EVOLUTION TIMELINE
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500">2011 — 2026</span>
          </div>

          <div className="space-y-6 border-l-2 border-neutral-900 dark:border-white pl-4 ml-2 font-ledger">
            {[
              {
                year: '2011',
                title: 'Foundation & Industrial Beginnings',
                desc: 'Inception of Tiger with focus on precision machining and industrial equipment contracting.',
              },
              {
                year: '2016',
                title: 'High-Precision Gantry & Robotics Expansion',
                desc: 'Launched turnkey automation division specializing in linear gantries and CNC load portals.',
              },
              {
                year: '2020',
                title: 'Biometrics & Real-Time Production Telemetry',
                desc: 'Pioneered face-biometric verification and digital time clock ledgers across production plants.',
              },
              {
                year: '2024',
                title: 'Tiger CRM & Real-Time Communication Hub',
                desc: 'Architected unified WhatsApp relationship system and encrypted multi-channel team chat.',
              },
              {
                year: '2026',
                title: 'Tiger Company Ledger & Cryptographic Verification',
                desc: 'Unified industrial aesthetic with HMAC-SHA256 authenticated digital vouchers and public QR verification.',
              },
            ].map((milestone, idx) => (
              <div key={idx} className="relative group">
                <span className="absolute -left-[23px] top-1.5 w-3 h-3 bg-neutral-900 dark:bg-white border-2 border-white dark:border-black rounded-none" />
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

      {/* 6. STRATEGIC PARTNERS */}
      {(activeSection === 'overview' || activeSection === 'partners') && (
        <section className="space-y-4">
          <div className="border-b-2 border-neutral-900 dark:border-white pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                ALLIANCES & ECOSYSTEM
              </span>
              <h2 className="text-2xl font-display font-bold text-neutral-950 dark:text-white">
                Global Partner Network
              </h2>
            </div>
            <span className="text-xs font-mono border border-neutral-900 dark:border-white px-2 py-0.5 font-bold">
              Complete Interoperability
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: 'TECHPLUS AUTOMATION',
                role: 'Robotics & Mechanical Integration Partner',
                desc: 'Technical collaboration in standardized automation cells and linear portals, with 600+ deployed systems.',
                region: 'Europe / Middle East',
              },
              {
                name: 'WES-TECH SOLUTIONS',
                role: 'Intralogistics & Material Flow Partner',
                desc: 'Collaboration on automated palletizing and distribution systems for high-cadence production sites.',
                region: 'North America / GCC',
              },
              {
                name: 'HEIDENHAIN COMPLIANCE',
                role: 'High-Precision Measurement Systems',
                desc: 'Direct digital interface integration for linear encoders, rotary probes, and CNC control systems.',
                region: 'Germany / Global',
              },
              {
                name: 'TIGER INDUSTRIAL SERVICE HUBS',
                role: 'Field Deployment & Spares Logistics',
                desc: 'Immediate on-site intervention, 24/7 technical hotline, and genuine certified components depot.',
                region: 'Regional Network',
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

      {/* 7. OFFICIAL HEADQUARTERS & HOURS */}
      <section className="industrial-card p-6 sm:p-8 bg-[#fafafa] dark:bg-[#111111]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          {/* Col 1: Contacts */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="building" size={16} />
              <span>Headquarters & Contact</span>
            </div>
            <div className="space-y-1.5 text-neutral-700 dark:text-neutral-300">
              <div className="font-bold">Tiger Machine Systems</div>
              <div>Industrial Automation Complex</div>
              <div className="pt-2">Direct Phone: <span className="font-bold">+1 (800) 555-TIGER</span></div>
              <div>Official Email: <span className="font-bold">contact@tiger.local</span></div>
            </div>
          </div>

          {/* Col 2: Office Hours */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="clock" size={16} />
              <span>Executive Office Hours</span>
            </div>
            <div className="space-y-1 text-neutral-700 dark:text-neutral-300">
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>Monday – Friday:</span>
                <span className="font-bold tabular-nums">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>Saturday – Sunday:</span>
                <span className="font-bold">Administrative Closure</span>
              </div>
              <div className="text-[11px] text-neutral-500 pt-1">
                * Consultations require prior booking
              </div>
            </div>
          </div>

          {/* Col 3: Logistics & Sites */}
          <div className="space-y-3">
            <div className="font-bold text-sm font-display text-neutral-950 dark:text-white border-b-2 border-neutral-900 dark:border-white pb-2 flex items-center gap-2">
              <LedgerIcon name="shield" size={16} />
              <span>Field Ops & Emergency Hotline</span>
            </div>
            <div className="space-y-1 text-neutral-700 dark:text-neutral-300">
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>Field Dispatch:</span>
                <span className="font-bold tabular-nums">07:00 – 19:00</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-neutral-300 dark:border-neutral-700 py-1">
                <span>Emergency Breakdown Teams:</span>
                <span className="font-bold">24 Hours / 7 Days</span>
              </div>
              <div className="text-[11px] text-neutral-500 pt-1">
                * Instant response dispatch units
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Legal Stamp */}
      <div className="text-center font-mono text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-neutral-300 dark:border-neutral-800 pt-4">
        Official Specification Document issued by Tiger Machine Systems — All rights reserved © 2026
      </div>
    </div>
  );
};
