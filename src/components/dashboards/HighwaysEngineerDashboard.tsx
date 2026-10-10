import React, { useState } from 'react';
import { Project, ProjectConflict, CitizenReport, AuditLog, UserProfile } from '../../types';
import { dataStore } from '../../lib/dataStore';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  Building2,
  RefreshCw,
  Edit3,
  Sliders,
  Layers,
  FileCheck,
  Check,
} from 'lucide-react';

interface HighwaysEngineerDashboardProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  auditLogs: AuditLog[];
  currentUser?: UserProfile;
  onNavigateTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
  onOpenCreateProject: () => void;
}

export const HighwaysEngineerDashboard: React.FC<HighwaysEngineerDashboardProps> = ({
  projects,
  conflicts,
  reports,
  auditLogs,
  currentUser,
  onNavigateTab,
  onSelectProject,
  onSelectConflict,
  onOpenCreateProject,
}) => {
  // Highways assigned projects (Highways & Road Infrastructure department)
  const highwaysProjects = projects.filter(
    (p) => p.department === 'Highways & Road Infrastructure'
  );

  // Cross-corridor adjacent works (projects on same roads or within nearby corridors)
  const adjacentProjects = projects.filter(
    (p) => p.department !== 'Highways & Road Infrastructure'
  );

  // Highway clashes
  const highwayClashes = conflicts.filter(
    (c) =>
      c.projectA?.department === 'Highways & Road Infrastructure' ||
      c.projectB?.department === 'Highways & Road Infrastructure'
  );

  // Road complaints assigned to Highways
  const assignedReports = reports.filter(
    (r) =>
      r.departmentAssigned === 'Highways & Road Infrastructure' ||
      r.category === 'road_damage' ||
      r.category === 'repeated_excavation'
  );

  // Schedule change proposal state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [progressVal, setProgressVal] = useState<number>(0);
  const [updateNote, setUpdateNote] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const startEditProject = (p: Project) => {
    setEditingProject(p);
    setNewStartDate(p.plannedStartDate);
    setNewEndDate(p.plannedEndDate);
    setProgressVal(p.progressPercentage);
    setUpdateNote('');
    setSaveSuccessMsg(null);
  };

  const handleSaveProjectUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;

    dataStore.updateProject(editingProject.id, {
      plannedStartDate: newStartDate,
      plannedEndDate: newEndDate,
      progressPercentage: progressVal,
    });

    dataStore.logAudit('PROJECT_SCHEDULE_ADJUSTED', 'projects', editingProject.id, {
      actor: currentUser?.fullName ? `${currentUser.fullName} (${currentUser.department || 'Highways'})` : 'Highways Divisional Engineer',
      note: updateNote || 'Highways engineering timeline realignment submitted.',
      dates: `${newStartDate} to ${newEndDate}`,
      progress: progressVal,
    });

    setSaveSuccessMsg(`Project ${editingProject.projectCode} successfully updated!`);
    setTimeout(() => {
      setEditingProject(null);
      setSaveSuccessMsg(null);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Engineer Persona Strip */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Highways Engineer Console
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Divisional Office: Chengalpattu / Tambaram South
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {currentUser?.fullName || 'Divisional Executive Engineer'}
            {currentUser?.designation ? ` • ${currentUser.designation}` : ' • Executive Engineer'}
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Managing state arterial highways right-of-way, road resurfacing permits, joint-utility corridor alignments, and inter-agency trenching deconfliction.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            + Create Highway Permit
          </button>
          <button
            onClick={() => onNavigateTab('conflicts')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-700"
          >
            Conflict Arbiter ({highwayClashes.length})
          </button>
        </div>
      </div>

      {/* Engineer KPI Quick Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-500 font-semibold">Assigned Road Projects</div>
          <div className="text-2xl font-mono font-bold text-slate-900">{highwaysProjects.length}</div>
          <div className="text-[11px] text-slate-400">Total ₹970.0L Capital Works</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-500 font-semibold">Corridor Clashes Detected</div>
          <div className="text-2xl font-mono font-bold text-red-600 flex items-center gap-1.5">
            <span>{highwayClashes.length}</span>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          </div>
          <div className="text-[11px] text-red-700 font-medium">1 Critical Clash on GST Road</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-500 font-semibold">Delayed Project Warnings</div>
          <div className="text-2xl font-mono font-bold text-amber-600">1</div>
          <div className="text-[11px] text-amber-800 font-medium">HW-2026-031 Heritage Corridor</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-500 font-semibold">Assigned Citizen Work Orders</div>
          <div className="text-2xl font-mono font-bold text-slate-900">{assignedReports.length}</div>
          <div className="text-[11px] text-slate-500">1 Triage, 2 Resolved</div>
        </div>
      </div>

      {/* Primary Clash Spotlight: HW-2026-089 vs WS-2026-114 */}
      <div className="bg-white rounded-xl border border-red-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-red-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-red-100 text-red-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Active Corridor Trenching Clash: GST Road Tambaram
              </h3>
              <p className="text-xs text-red-700 font-medium">
                Highways Bitumen Resurfacing (HW-089) vs Water Feeder Trenching (WS-114)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('ai_assistant')}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>Launch AI Schedule Optimizer</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-semibold text-[11px]">Spatial Separation:</span>
            <div className="font-bold text-slate-900 text-sm font-mono">186 Metres</div>
            <p className="text-[11px] text-slate-600">
              Identical 4-lane carriage alignment on GST Road (Tambaram Sanatorium to Irumbuliyur).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-semibold text-[11px]">Temporal Collision Window:</span>
            <div className="font-bold text-red-700 text-sm font-mono">32 Days Overlap</div>
            <p className="text-[11px] text-slate-600">
              From Oct 25, 2026 to Nov 25, 2026.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-semibold text-[11px]">Deterministic Collision Rule:</span>
            <div className="font-bold text-slate-900 text-sm">Destructive Sequence Risk</div>
            <p className="text-[11px] text-slate-600">
              Water pipe trenchers require 2.4m depth mechanical digging through freshly laid bitumen.
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Highways Projects Table & Schedule Update Trigger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Assigned Road & Infrastructure Contracts ({highwaysProjects.length})
            </h3>
            <p className="text-xs text-slate-500">
              Authorized highway worksites under Executive Engineer supervision.
            </p>
          </div>

          <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Divisional Right-of-Way
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px]">
                <th className="pb-2">Code</th>
                <th className="pb-2">Project Title</th>
                <th className="pb-2">Corridor</th>
                <th className="pb-2">Schedule Window</th>
                <th className="pb-2">Contractor</th>
                <th className="pb-2">Progress</th>
                <th className="pb-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {highwaysProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50/70">
                  <td className="py-3 font-mono font-bold text-slate-900">{proj.projectCode}</td>
                  <td className="py-3 font-semibold text-slate-900">
                    <div>{proj.title}</div>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        proj.status === 'delayed'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600">{proj.roadSegment}</td>
                  <td className="py-3 font-mono text-[11px]">
                    {proj.plannedStartDate} → {proj.plannedEndDate}
                  </td>
                  <td className="py-3 text-slate-600">{proj.contractor}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{proj.progressPercentage}%</span>
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-600 h-full rounded-full"
                          style={{ width: `${proj.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right space-x-1 whitespace-nowrap">
                    <button
                      onClick={() => startEditProject(proj)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold transition-colors cursor-pointer"
                    >
                      Update Schedule
                    </button>
                    <button
                      onClick={() => onSelectProject(proj)}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Change Workflow Modal/Panel */}
      {editingProject && (
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Propose Schedule Change: {editingProject.projectCode} - {editingProject.title}
              </h4>
              <p className="text-xs text-slate-500">
                Adjust planned execution dates or record field progress milestones in master registry.
              </p>
            </div>
            <button
              onClick={() => setEditingProject(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProjectUpdate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Planned Start Date</label>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Planned End Date</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Progress ({progressVal}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={progressVal}
                onChange={(e) => setProgressVal(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">
                Engineering Justification / Mitigation Note *
              </label>
              <input
                type="text"
                value={updateNote}
                onChange={(e) => setUpdateNote(e.target.value)}
                placeholder="e.g. Deferring bitumen milling to December 15 after Water Board feeder pipeline tests..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                Commit Schedule Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Citizen Grievance Triage for Highways Sub-Division */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              Citizen Grievances Assigned to Highways Sub-Division ({assignedReports.length})
            </h3>
            <p className="text-xs text-slate-500">
              Field reports requiring cold-patching, utility cut backfilling, or contractor penalties.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('reporting')}
            className="text-xs text-teal-700 font-semibold hover:underline cursor-pointer"
          >
            Open All Reports →
          </button>
        </div>

        <div className="space-y-3">
          {assignedReports.map((report) => (
            <div
              key={report.id}
              className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {report.referenceNo}
                  </span>
                  <span className="font-bold text-slate-800">{report.title}</span>
                </div>
                <p className="text-slate-600 text-[11px] max-w-2xl">{report.description}</p>
                <div className="text-[10px] text-slate-400 font-mono">
                  📍 {report.landmark} · Filed by {report.reporterName}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
                  {report.status.replace(/_/g, ' ')}
                </span>
                <button
                  onClick={() => {
                    dataStore.updateReportStatus(
                      report.id,
                      'scheduled_for_work',
                      'Executive Engineer verified: Work order issued to cold-mix road patch crew.'
                    );
                    alert(`Updated work order for ${report.referenceNo}`);
                  }}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-semibold text-[11px] cursor-pointer"
                >
                  Dispatch Crew
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
