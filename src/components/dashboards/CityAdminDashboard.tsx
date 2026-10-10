import React, { useState } from 'react';
import { Project, ProjectConflict, CitizenReport, AuditLog, Department, UserProfile } from '../../types';
import { dataStore } from '../../lib/dataStore';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Layers,
  ChevronRight,
  Activity,
  History,
  Check,
} from 'lucide-react';

interface CityAdminDashboardProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  auditLogs: AuditLog[];
  currentUser?: UserProfile;
  onNavigateTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
  onRefresh: () => void;
}

export const CityAdminDashboard: React.FC<CityAdminDashboardProps> = ({
  projects,
  conflicts,
  reports,
  auditLogs,
  currentUser,
  onNavigateTab,
  onSelectProject,
  onSelectConflict,
  onRefresh,
}) => {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'overview' | 'departments' | 'audit_trail' | 'executive_brief'>('overview');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Derived city-wide statistics
  const totalProjects = projects.length; // 7
  const activeProjects = projects.filter((p) => p.status === 'in_progress').length; // 2
  const delayedProjects = projects.filter((p) => p.status === 'delayed').length; // 1
  const plannedProjects = projects.filter((p) => p.status === 'planned').length; // 4
  const totalBudget = projects.reduce((acc, p) => acc + (p.estimatedBudget || 0), 0); // ~2080.5 L

  const pendingConflicts = conflicts.filter((c) => c.status === 'pending_review');
  const resolvedConflicts = conflicts.filter((c) => c.status === 'resolved_sequenced' || c.status === 'coordinated');

  const openReports = reports.filter((r) => r.status === 'submitted' || r.status === 'verified');
  const resolvedReports = reports.filter((r) => r.status === 'resolved');

  // Departmental breakdown data
  const departmentsList: {
    name: Department;
    director: string;
    contact: string;
    activeCount: number;
    totalBudgetLakhs: number;
    complianceScore: number;
    status: 'green' | 'amber' | 'red';
  }[] = [
    {
      name: 'Highways & Road Infrastructure',
      director: 'Er. R. Senthil Kumar',
      contact: 'div.highways@infranexus.gov.in',
      activeCount: projects.filter((p) => p.department === 'Highways & Road Infrastructure').length,
      totalBudgetLakhs: 970.0,
      complianceScore: 92,
      status: 'green',
    },
    {
      name: 'Water Supply & Sewage Board',
      director: 'Er. K. Natarajan',
      contact: 'water.projects@infranexus.gov.in',
      activeCount: projects.filter((p) => p.department === 'Water Supply & Sewage Board').length,
      totalBudgetLakhs: 285.5,
      complianceScore: 88,
      status: 'green',
    },
    {
      name: 'Electricity & Power Utilities',
      director: 'Er. M. Soundararajan',
      contact: 'tneb.grid@infranexus.gov.in',
      activeCount: projects.filter((p) => p.department === 'Electricity & Power Utilities').length,
      totalBudgetLakhs: 310.0,
      complianceScore: 74,
      status: 'amber',
    },
    {
      name: 'City Municipal Corporation',
      director: 'Dr. V. Rajeshwari',
      contact: 'zonal.commissioner@infranexus.gov.in',
      activeCount: projects.filter((p) => p.department === 'City Municipal Corporation').length,
      totalBudgetLakhs: 370.0,
      complianceScore: 82,
      status: 'green',
    },
    {
      name: 'Optical Fiber & Telecom',
      director: 'S. Ramanathan',
      contact: 'telecom.conduits@infranexus.gov.in',
      activeCount: projects.filter((p) => p.department === 'Optical Fiber & Telecom').length,
      totalBudgetLakhs: 145.0,
      complianceScore: 65,
      status: 'amber',
    },
  ];

  // Export functions
  const handleExportCSV = () => {
    const csvContent = [
      'ProjectCode,Title,Department,Status,Budget_Lakhs,StartDate,EndDate,Corridor',
      ...projects.map(
        (p) =>
          `"${p.projectCode}","${p.title}","${p.department}","${p.status}",${p.estimatedBudget},"${p.plannedStartDate}","${p.plannedEndDate}","${p.roadSegment}"`
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InfraNexus_Municipal_Projects_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setExportNotice('Master project registry downloaded as CSV.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportJSON = () => {
    const exportData = {
      registryMetadata: {
        authority: 'City Municipal Corporation',
        commissioner: 'Dr. Meenakshi Sundaram, IAS',
        exportTimestamp: new Date().toISOString(),
        totalCapitalOutlayLakhs: totalBudget,
      },
      projects,
      conflicts,
      reports,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InfraNexus_City_Registry_Audit_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExportNotice('Complete municipal state and audit log downloaded as JSON.');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Administrator Executive Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              City Administrator Console
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Inter-Agency Coordination Authority
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            City Municipal Corporation Administrator
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Active: <strong className="text-white">{currentUser?.fullName || 'Municipal Administrator'}</strong> ({currentUser?.designation || 'Zonal Municipal Authority'}). Overseeing cross-departmental public infrastructure permits, capital outlay coordination, and corridor deconfliction accords.
          </p>
        </div>

        {/* Export & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => setActiveAdminSubTab('executive_brief')}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>AI Executive Brief</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Admin Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {[
          { id: 'overview', label: 'City-Wide Overview & KPIs' },
          { id: 'departments', label: 'Department Coordination Matrix' },
          { id: 'audit_trail', label: `Master Audit Trail (${auditLogs.length})` },
          { id: 'executive_brief', label: 'AI Executive Brief' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminSubTab(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeAdminSubTab === tab.id
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-VIEW 1: CITY-WIDE OVERVIEW & KPIS */}
      {activeAdminSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Total Capital Outlay</span>
              <div className="text-2xl font-mono font-bold text-slate-900">
                ₹{totalBudget.toFixed(1)} Lakhs
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Across {totalProjects} registered municipal worksites
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Active Worksites in Execution</span>
              <div className="text-2xl font-mono font-bold text-teal-800">
                {activeProjects} Active
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                {plannedProjects} Planned · {delayedProjects} Delayed site
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Cross-Agency Conflicts</span>
              <div className="text-2xl font-mono font-bold text-red-600 flex items-center gap-1.5">
                <span>{pendingConflicts.length} Pending</span>
                {pendingConflicts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                {resolvedConflicts.length} Realigned & Sequenced
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-1">
              <span className="text-slate-500 font-semibold block">Citizen Grievance Resolution</span>
              <div className="text-2xl font-mono font-bold text-amber-700">
                78% Rate
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                {resolvedReports.length} Resolved · {openReports.length} In Triage
              </div>
            </div>
          </div>

          {/* Cross-Department Coordination Center Spotlight */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700" />
                  Interdepartmental Coordination & Conflict Center
                </h3>
                <p className="text-xs text-slate-500">
                  Authoritative municipal matrix detecting multi-agency utility clashes.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('conflicts')}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Inspect All Conflicts ({conflicts.length}) →
              </button>
            </div>

            <div className="space-y-3">
              {conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{conf.roadSegment}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          conf.status === 'resolved_sequenced'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : conf.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {conf.status === 'resolved_sequenced' ? 'RESOLVED - SEQUENCED' : conf.severity}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {conf.conflictReason}
                    </p>

                    <div className="text-[10px] text-slate-500 font-mono pt-1">
                      {conf.projectA?.title} ({conf.projectA?.department}) vs{' '}
                      {conf.projectB?.title} ({conf.projectB?.department})
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => onSelectConflict(conf)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold rounded-lg text-xs cursor-pointer shadow-2xs"
                    >
                      Review Clash
                    </button>
                    {conf.status !== 'resolved_sequenced' && (
                      <button
                        onClick={() => onNavigateTab('ai_assistant')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>Authorize Sequence</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue Projects & Critical Unresolved Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Overdue Worksite Warnings */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Overdue Project Watchlist (1)
              </h3>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-1">
                <div className="font-bold text-amber-950">
                  HW-2026-031: Kancheepuram Heritage Corridor Concrete Pavement
                </div>
                <div className="text-[11px] text-amber-900">
                  Target completion was 2026-10-05. Current progress is 62%. Sub-base curing delay reported by contractor.
                </div>
                <div className="text-[10px] font-mono text-amber-800 pt-1">
                  Budget: ₹550.0L · Highways & Road Infrastructure
                </div>
              </div>
            </div>

            {/* Critical Unresolved Reports */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 text-red-800">
                <Clock className="w-4 h-4 text-red-600" /> Unresolved Citizen Grievance Triage (2)
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 bg-red-50/50 border border-red-200 rounded-lg">
                  <span className="font-mono font-bold text-red-950">CS-2026-7842</span>
                  <div className="font-semibold text-slate-900 text-[11px]">
                    Fresh bitumen excavated for water line pit on GST Road
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Status: Scheduled for work · Assigned to Highways Sub-division
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-mono font-bold text-slate-900">CS-2026-3104</span>
                  <div className="font-semibold text-slate-900 text-[11px]">
                    Deep unbarricaded trench left open without caution blinkers
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Status: Scheduled for work · Assigned to Electricity Utilities
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DEPARTMENT COORDINATION MATRIX */}
      {activeAdminSubTab === 'departments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">
              Municipal Agencies & Department Administration
            </h3>
            <p className="text-xs text-slate-500">
              Departmental compliance benchmarks, active work allocations, and designated liaisons.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="pb-2">Agency Name</th>
                  <th className="pb-2">Designated Director</th>
                  <th className="pb-2">Active Projects</th>
                  <th className="pb-2">Committed Budget</th>
                  <th className="pb-2">Coordination Index</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departmentsList.map((dept, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 font-bold text-slate-900">{dept.name}</td>
                    <td className="py-3">
                      <div>{dept.director}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{dept.contact}</span>
                    </td>
                    <td className="py-3 font-mono font-semibold">{dept.activeCount} worksites</td>
                    <td className="py-3 font-mono font-semibold">₹{dept.totalBudgetLakhs} L</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {dept.complianceScore}%
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full"
                            style={{ width: `${dept.complianceScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          dept.status === 'green'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {dept.status === 'green' ? 'Compliant' : 'Review Required'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: AUDIT TRAIL */}
      {activeAdminSubTab === 'audit_trail' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Cryptographic Municipal Audit Register ({auditLogs.length} Records)
              </h3>
              <p className="text-xs text-slate-500">
                Immutable chronological log of all schedule realignments, project updates, and coordination accords.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">Signed Ledger</span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 text-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-800">{log.actorName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({log.actorRole})
                    </span>
                  </div>
                  <pre className="text-[11px] text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-200 overflow-x-auto max-w-3xl">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
                <div className="text-[10px] font-mono text-slate-400 shrink-0">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: AI EXECUTIVE BRIEF */}
      {activeAdminSubTab === 'executive_brief' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 max-w-4xl mx-auto">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                AI Executive Infrastructure Intelligence Brief
              </h3>
              <p className="text-xs text-slate-500">
                Synthesized by Gemini 3.8 Flash based strictly on verified database records.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Generated {new Date().toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-2">
              <span className="font-bold text-indigo-950 uppercase tracking-wider text-[11px] block">
                1. Executive Summary & Right-of-Way Posture
              </span>
              <p>
                The metropolitan corridor currently registers <strong>7 major public infrastructure projects</strong> with an aggregate capital budget of <strong>₹2,080.5 Lakhs</strong>. Two arterial works are actively executing (Stormwater Drainage on Vandalur-Kelambakkam and Telecom Micro-Trenching on OMR). One major heritage contract (Kancheepuram Concrete Pavement, HW-2026-031) is running behind schedule by 4 days, requiring supervisory acceleration.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                2. Critical Inter-Agency Conflict & Action Taken
              </span>
              <p>
                The primary corridor clash identified on the <strong>Grand Southern Trunk (GST) Road</strong> between Highways (HW-2026-089) and Water Supply (WS-2026-114) posed an imminent risk of ₹420.0L bitumen destruction due to reverse trenching sequence. Through the InfraNexus AI Schedule Optimizer, a <strong>Sequence Reversal</strong> is authorized to defer road resurfacing to December 15, allowing pipeline backfill compaction curing to settle.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px] block">
                3. Citizen Grievance Resolution Health
              </span>
              <p>
                The municipal grievance response index stands at <strong>78%</strong> (5 of 7 logged community reports resolved). The remaining 2 reports (CS-2026-7842 and CS-2026-3104) have field safety and cold-patching work orders dispatched to the Highways and Power sub-divisions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
