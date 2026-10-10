import React from 'react';
import { Project, ProjectConflict, CitizenReport } from '../types';
import { AlertTriangle, Clock, ArrowRight, ShieldCheck, MapPin, Sparkles, Building2 } from 'lucide-react';

interface PublicOverviewViewProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  onNavigateTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
}

export const PublicOverviewView: React.FC<PublicOverviewViewProps> = ({
  projects,
  conflicts,
  reports,
  onNavigateTab,
  onSelectProject,
  onSelectConflict,
}) => {
  const activeProjects = projects.filter((p) => p.status === 'in_progress');
  const delayedProjects = projects.filter((p) => p.status === 'delayed');
  const criticalConflicts = conflicts.filter((c) => c.status !== 'dismissed');
  const openReports = reports.filter((r) => r.status === 'submitted' || r.status === 'verified');

  return (
    <div className="space-y-8">
      {/* Hero Mission Statement */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-8 shadow-xs hover:shadow-md transition-all duration-200 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 tracking-wide uppercase">
          <Building2 className="w-4 h-4" /> Bits and Bytes 24h Hackathon — IIITDM Kancheepuram
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          One City. Coordinated Infrastructure. Transparent Progress.
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          InfraNexus AI connects municipal road works, water pipelines, power grids, and telecom agencies into a single spatial coordination registry. Using deterministic proximity analytics and server-side Gemini intelligence, we prevent repeated road tearing before the first excavator touches the blacktop.
        </p>

        {/* Action quick links */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          <button
            onClick={() => onNavigateTab('map')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            Explore Infrastructure Map <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('conflicts')}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            Review {criticalConflicts.length} Conflict Vectors
          </button>
          <button
            onClick={() => onNavigateTab('reporting')}
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all cursor-pointer shadow-2xs"
          >
            File Citizen Road Report
          </button>
        </div>
      </div>

      {/* 4 Core Metric Indicators (Elevated Cards with Pill Badges) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('projects')}
          className="p-5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">Active Worksites</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              Corridor Active
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{activeProjects.length}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Total registered projects: {projects.length}</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('projects')}
          className="p-5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">Delayed Work Sites</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Attention
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">{delayedProjects.length}</div>
          <div className="text-[11px] text-slate-500">
            <span>Pending monsoon or contractor bottlenecks</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('conflicts')}
          className="p-5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">Scheduling Clashes</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
              Alert
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-red-600 tabular-nums">{criticalConflicts.length}</div>
          <div className="text-[11px] text-slate-500">
            <span>Corridor spatial & temporal overlaps</span>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('reporting')}
          className="p-5 bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer space-y-1 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-700">Open Citizen Reports</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Verified
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{openReports.length}</div>
          <div className="text-[11px] text-slate-500">
            <span>Community road issues submitted</span>
          </div>
        </div>
      </div>

      {/* Featured Conflict Alert Banner */}
      {criticalConflicts.length > 0 && (
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <h2 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                Urgent Municipal Coordination Alert
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('conflicts')}
              className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 cursor-pointer"
            >
              Open Conflict Engine <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Deterministic spatial engine detected an uncoordinated clash on{' '}
            <strong>{criticalConflicts[0].roadSegment}</strong> between{' '}
            <strong>{criticalConflicts[0].projectA.title}</strong> and{' '}
            <strong>{criticalConflicts[0].projectB.title}</strong> ({criticalConflicts[0].overlapDays} days overlapping window, {criticalConflicts[0].distanceMeters}m separation).
          </p>
          <div className="pt-1 flex gap-2">
            <button
              onClick={() => onSelectConflict(criticalConflicts[0])}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
            >
              Resolve via AI Staging Assistant
            </button>
          </div>
        </div>
      )}

      {/* Recent Projects and Updates Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects Showcase (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Key Municipal Infrastructure Works</h2>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
            >
              View all ({projects.length}) →
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 4).map((proj) => (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer text-xs space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 group-hover:text-indigo-900 text-sm">{proj.title}</span>
                  <span className="font-mono text-[11px] text-slate-500 uppercase">{proj.status}</span>
                </div>
                <div className="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                  <span>{proj.department}</span>
                  <span>·</span>
                  <span>{proj.roadSegment}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">₹{proj.estimatedBudget.toFixed(1)}L</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-900 h-full rounded-full" style={{ width: `${proj.progressPercentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Citizen Reports Showcase (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm">Recent Citizen Reports</h2>
            <button
              onClick={() => onNavigateTab('reporting')}
              className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer font-medium"
            >
              Track / File →
            </button>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 3).map((rep) => (
              <div key={rep.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/40 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">{rep.referenceNo}</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1 rounded">
                    {rep.status.toUpperCase()}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 leading-snug">{rep.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-2">{rep.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
