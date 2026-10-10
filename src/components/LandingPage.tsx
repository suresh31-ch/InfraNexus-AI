import React from 'react';
import { Project, ProjectConflict, CitizenReport, UserRole } from '../types';
import {
  Building2,
  HardHat,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  ArrowRight,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Activity,
  Users,
  Compass,
  FileText,
  Search,
  LogIn,
  Zap,
  Droplets,
  Radio,
  Clock,
  ShieldAlert,
  ChevronRight,
  Eye
} from 'lucide-react';

interface LandingPageProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  onNavigate: (path: string) => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onSelectRoleDemo: (role: UserRole) => void;
  onSelectProject: (project: Project) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  projects,
  conflicts,
  reports,
  onNavigate,
  onOpenSignIn,
  onOpenSignUp,
  onSelectRoleDemo,
  onSelectProject,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const criticalConflicts = conflicts.filter((c) => c.status !== 'dismissed');
  const resolvedConflicts = conflicts.filter(
    (c) => c.status === 'resolved_sequenced' || c.status === 'coordinated'
  );

  return (
    <div className="space-y-16 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-6 pb-12 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white shadow-xl border border-slate-700/60">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 text-center space-y-8">
          {/* Hackathon Badge & Product Category */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-teal-400 text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span>CivicTech — Improving Transparency and Coordination in Public Works Projects</span>
            </div>
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/80 text-teal-300 text-xs font-medium">
              AI-Powered Municipal Infrastructure Coordination
            </div>
          </div>

          {/* Primary Headline */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="inline-block px-3.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono text-xs font-bold uppercase tracking-widest">
              InfraNexus AI
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white">
              One Network.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300">
                Zero Coordination Blind Spots.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
              An AI-powered municipal infrastructure coordination platform that helps public agencies detect overlapping roadworks, coordinate departments, reduce repeat excavation, and make public works more transparent for citizens.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('/map')}
              className="px-6 py-3.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95"
            >
              <span>Explore Public Works</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSignUp}
              className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm border border-white/20 transition-all duration-150 flex items-center gap-2 cursor-pointer backdrop-blur-xs active:scale-95"
            >
              <span>Create an Account</span>
            </button>

            <button
              onClick={() => onNavigate('/reporting')}
              className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-sm border border-slate-600/70 transition-all duration-150 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Report Road Issue</span>
            </button>
          </div>

          {/* Quick Hackathon Persona Launchers */}
          <div className="pt-4 border-t border-slate-800/80 max-w-3xl mx-auto">
            <p className="text-xs text-slate-400 mb-3 font-medium">
              ⚡ Hackathon Quick Evaluation · Test Drive Any Role Instantly:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                onClick={() => {
                  onSelectRoleDemo('citizen');
                  onNavigate('/citizen/dashboard');
                }}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-400 flex items-center justify-between">
                  <span>D1: Citizen</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400" />
                </div>
                <div className="text-[11px] text-slate-400 truncate">Public road issues</div>
              </button>

              <button
                onClick={() => {
                  onSelectRoleDemo('dept_officer');
                  onNavigate('/engineer/dashboard');
                }}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-400 flex items-center justify-between">
                  <span>D2: Engineer</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400" />
                </div>
                <div className="text-[11px] text-slate-400 truncate">Highways schedule</div>
              </button>

              <button
                onClick={() => {
                  onSelectRoleDemo('city_admin');
                  onNavigate('/admin/dashboard');
                }}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-400 flex items-center justify-between">
                  <span>D3: City Admin</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400" />
                </div>
                <div className="text-[11px] text-slate-400 truncate">Accords & oversight</div>
              </button>

              <button
                onClick={() => onNavigate('/analytics/dashboard')}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-left transition-colors cursor-pointer group"
              >
                <div className="font-bold text-white group-hover:text-teal-400 flex items-center justify-between">
                  <span>D4: Analytics</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-teal-400" />
                </div>
                <div className="text-[11px] text-slate-400 truncate">City clash KPIs</div>
              </button>
            </div>
          </div>

          {/* Interactive Map Preview Card */}
          <div className="pt-6">
            <div className="bg-slate-950/80 rounded-2xl border border-slate-700/80 p-4 sm:p-6 shadow-2xl text-left max-w-4xl mx-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-slate-300">
                    LIVE SPATIAL REGISTRY · CHENNAI METROPOLITAN CORRIDOR
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-800/80 font-mono font-bold text-[10px]">
                    {criticalConflicts.length} Active Clashes Detected
                  </span>
                  <button
                    onClick={() => onNavigate('/map')}
                    className="text-teal-400 hover:text-teal-300 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    Launch Full Map <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Simulated Map Preview with real corridors */}
              <div
                onClick={() => onNavigate('/map')}
                className="relative h-64 sm:h-72 w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden cursor-pointer group flex items-center justify-center"
              >
                {/* Background visual map texture */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#0284c7_1px,transparent_1px)] [background-size:24px_24px]" />

                {/* Simulated Corridor Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <path d="M 50 180 Q 250 80 500 140 T 900 120" stroke="#0ea5e9" strokeWidth="4" fill="none" strokeDasharray="6 6" />
                  <path d="M 120 40 Q 300 200 650 160 T 850 240" stroke="#f59e0b" strokeWidth="3" fill="none" />
                  <circle cx="480" cy="142" r="28" fill="#ef4444" fillOpacity="0.25" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 2" />
                </svg>

                {/* Realistic Clash Callout Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-red-500 rounded-xl p-3.5 max-w-sm shadow-2xl backdrop-blur-md group-hover:scale-105 transition-transform">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>GST Road Clash Vector #CR-2026-001</span>
                        <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.2 rounded font-mono">
                          CRITICAL
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        Highways Bitumen Resurfacing overlaps with CMWSSB Pipeline Trenching. ₹420L bitumen damage prevented.
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[10px] text-teal-400 font-semibold">
                        <span>Click to examine interactive GIS coordinate plane →</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Department Legend */}
                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 rounded-lg p-2 text-[10px] space-y-1 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Highways Roadwork</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>CMWSSB Water & Sewer</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>TNEB Underground Power</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRIC STATS TICKER */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Registered Projects</span>
            <div className="text-2xl font-bold font-mono text-slate-900">{projects.length}</div>
            <span className="text-[11px] text-teal-700 font-medium">Across 5 City Agencies</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Conflicts Detected</span>
            <div className="text-2xl font-bold font-mono text-red-600">{criticalConflicts.length}</div>
            <span className="text-[11px] text-slate-500">Spatial & Temporal overlaps</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Road Budget Protected</span>
            <div className="text-2xl font-bold font-mono text-emerald-600">₹420.0L</div>
            <span className="text-[11px] text-slate-500">Pre-excavation savings</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
            <span className="text-xs font-medium text-slate-500">Citizen Issues Tracked</span>
            <div className="text-2xl font-bold font-mono text-slate-900">{reports.length}</div>
            <span className="text-[11px] text-teal-700 font-medium">Public verified updates</span>
          </div>
        </div>
      </section>

      {/* 3 CORE PILLARS SECTION */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Built to Eliminate Repeated Road Excavation
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            A comprehensive, inter-departmental infrastructure intelligence platform that unites city departments, field engineers, and citizens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Coordinate */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Coordinate Infrastructure Projects
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Provides a unified geospatial registry where Highways, Water & Sewage, Electricity, and Telecom log excavation boundaries, schedules, and budgets in real time.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Standardized work zones & buffer radius</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Contractor accountability & status tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Departmental project creation & schedules</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Detect Conflicts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-200">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Detect Scheduling & Spatial Conflicts
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Deterministic mathematical clash engine computes Haversine spatial proximity and calendar overlaps to pinpoint collision hazards before trenching begins.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Flags premature bitumen resurfacing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Dual-excavation traffic bottleneck alerts</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>AI-assisted schedule realignment engine</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Keep Citizens Informed */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-200">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Keep Citizens Informed & Heard
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Residents gain complete transparency into neighborhood road closures and can report dangerous potholes or abandoned ditches with verifiable tracking IDs.
            </p>
            <ul className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Transparent public project map & timelines</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant report logging with photo evidence</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Unique tracking ID & official status updates</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 STEP WORKFLOW) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-800 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-teal-400 text-xs font-semibold border border-slate-700">
              <span>Operational Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              How InfraNexus AI Works
            </h2>
            <p className="text-sm text-slate-300">
              From initial project chartering to multi-agency coordination accords and citizen notification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h4 className="text-base font-bold text-white">
                Multi-Agency Project Registration
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Highways, Metro Water, TNEB, and Telecom teams submit their planned corridors, trench depth, work buffer radius, and target dates into the shared registry.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h4 className="text-base font-bold text-white">
                Deterministic Proximity & Clash Detection
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                The engine calculates exact distances and temporal intersections. When two teams plan to dig the same road concurrently, a high-severity clash is flagged.
              </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h4 className="text-base font-bold text-white">
                AI Schedule Optimization & Public Notification
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gemini AI formulates deconfliction accords (sequencing pipeline trenching before road resurfacing), city admins authorize the shift, and public maps update automatically.
              </p>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigate('/map')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              <span>See It In Action On The City Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOUR ROLE PORTALS SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Role-Based Experiences</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Four Dedicated Portals. One Coordinated City.
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Tailored interfaces designed specifically for residents, departmental engineers, municipal leadership, and data analysts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* D1: Citizen */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-500 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-bold text-xs">
                D1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Public Citizen</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Discover ongoing neighborhood infrastructure, report road damage with photos, and receive verifiable status updates.
              </p>
            </div>
            <button
              onClick={() => {
                onSelectRoleDemo('citizen');
                onNavigate('/citizen/dashboard');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Open Citizen Portal →
            </button>
          </div>

          {/* D2: Engineer */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-500 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-bold text-xs">
                D2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Highways Engineer</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Manage assigned corridor work, resolve spatial clashes, optimize schedules with Gemini AI, and inspect field complaints.
              </p>
            </div>
            <button
              onClick={() => {
                onSelectRoleDemo('dept_officer');
                onNavigate('/engineer/dashboard');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-900 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Open Engineer Portal →
            </button>
          </div>

          {/* D3: City Admin */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-500 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 flex items-center justify-center font-bold text-xs">
                D3
              </div>
              <h3 className="font-bold text-slate-900 text-base">City Administrator</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Municipal Commissioner (IAS) command center for inter-agency oversight, deconfliction accords, and immutable audit logs.
              </p>
            </div>
            <button
              onClick={() => {
                onSelectRoleDemo('city_admin');
                onNavigate('/admin/dashboard');
              }}
              className="w-full py-2 bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-900 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Open Admin Portal →
            </button>
          </div>

          {/* D4: Analytics */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-teal-500 transition-colors flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs">
                D4
              </div>
              <h3 className="font-bold text-slate-900 text-base">City Analytics</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mathematically calculated KPIs, conflict resolution velocity, expenditure protection, and departmental performance charts.
              </p>
            </div>
            <button
              onClick={() => onNavigate('/analytics/dashboard')}
              className="w-full py-2 bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-900 font-bold rounded-xl text-xs border border-slate-200 transition-colors cursor-pointer"
            >
              Open Analytics Portal →
            </button>
          </div>
        </div>
      </section>

      {/* RECENT PUBLIC WORKS SPOTLIGHT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Active Public Infrastructure Corridors
            </h3>
            <p className="text-xs text-slate-500">
              Sample capital projects currently undergoing cross-agency coordination
            </p>
          </div>
          <button
            onClick={() => onNavigate('/projects')}
            className="text-xs font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
          >
            <span>View All {projects.length} Registered Works</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {projects.slice(0, 3).map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] font-bold text-slate-500">
                    {project.projectCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      project.status === 'in_progress'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : project.status === 'delayed'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {project.status.toUpperCase()}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {project.description}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="truncate max-w-[150px]">{project.department}</span>
                  <span className="font-mono font-bold text-slate-900">₹{project.estimatedBudget}L</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full"
                    style={{ width: `${project.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HACKATHON SPONSOR / CREDITS CALLOUT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-teal-800 tracking-wide uppercase">
              CivicTech Hackathon Initiative
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              Bits and Bytes 24-Hour Web Development Hackathon
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              Indian Institute of Information Technology, Design and Manufacturing (IIITDM), Kancheepuram.
              Built to transform public works transparency with live spatial clash intelligence.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/infrastructure-map')}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Explore Public Map</span>
            </button>
            <button
              onClick={onOpenSignUp}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
            >
              Register Account
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
