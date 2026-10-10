import React, { useState } from 'react';
import { Project, ProjectConflict, CitizenReport } from '../types';
import { calculateProjectDelayRisk, ProjectRiskAssessment } from '../services/delayRiskEngine';
import {
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Layers,
  Search,
  Filter,
  BarChart3,
  Building2,
  AlertCircle
} from 'lucide-react';

interface DelayRiskAnalysisViewProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
}

export const DelayRiskAnalysisView: React.FC<DelayRiskAnalysisViewProps> = ({
  projects,
  conflicts,
  reports,
  onSelectProject,
  onSelectConflict,
}) => {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [activeProjectId, setActiveProjectId] = useState<string>(projects[0]?.id || '');

  // Compute deterministic assessments for all projects
  const assessments: ProjectRiskAssessment[] = projects.map((p) =>
    calculateProjectDelayRisk(p, conflicts, reports)
  );

  const filteredAssessments = assessments.filter((a) => {
    if (selectedRiskFilter !== 'all' && a.riskLevel !== selectedRiskFilter) return false;
    if (selectedDeptFilter !== 'all' && a.department !== selectedDeptFilter) return false;
    return true;
  });

  const activeAssessment =
    assessments.find((a) => a.projectId === activeProjectId) || assessments[0];
  const activeProject = projects.find((p) => p.id === activeAssessment?.projectId);

  // High-level summary metrics
  const criticalCount = assessments.filter((a) => a.riskLevel === 'critical').length;
  const highCount = assessments.filter((a) => a.riskLevel === 'high').length;
  const mediumCount = assessments.filter((a) => a.riskLevel === 'medium').length;
  const lowCount = assessments.filter((a) => a.riskLevel === 'low').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                DETERMINISTIC HEURISTIC RUBRIC
              </span>
              <span className="text-xs text-slate-400">Anchor Date: 2026-10-10</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Infrastructure Delay-Risk Analysis System
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Transparent, formula-driven delay risk scoring evaluating progress burn-rate lag, deadline expiry proximity, active utility corridor collisions, and verified citizen grievance density.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Scoring Engine:</span>
            <span className="px-3 py-1 bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg text-xs font-mono font-bold">
              v2.4 Multi-Factor
            </span>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800">
          <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl">
            <div className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Critical Risk (70-100)</div>
            <div className="text-2xl font-extrabold text-red-200 mt-1">{criticalCount}</div>
            <div className="text-[10px] text-red-400/80">Immediate intervention needed</div>
          </div>
          <div className="p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl">
            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">High Risk (50-69)</div>
            <div className="text-2xl font-extrabold text-amber-200 mt-1">{highCount}</div>
            <div className="text-[10px] text-amber-400/80">Slipping progress or clash</div>
          </div>
          <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl">
            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Medium Risk (30-49)</div>
            <div className="text-2xl font-extrabold text-cyan-200 mt-1">{mediumCount}</div>
            <div className="text-[10px] text-cyan-400/80">Tight delivery tolerance</div>
          </div>
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Low Risk (0-29)</div>
            <div className="text-2xl font-extrabold text-emerald-200 mt-1">{lowCount}</div>
            <div className="text-[10px] text-emerald-400/80">On schedule & unencumbered</div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter by Severity:
          </span>
          {['all', 'critical', 'high', 'medium', 'low'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedRiskFilter(lvl)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                selectedRiskFilter === lvl
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Department:</span>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium outline-none"
          >
            <option value="all">All Departments</option>
            <option value="Highways & Road Infrastructure">Highways & Roads</option>
            <option value="Water Supply & Sewage Board">Water Supply & Sewage</option>
            <option value="City Municipal Corporation">City Municipal Corp</option>
            <option value="Electricity & Power Utilities">Electricity Utilities</option>
            <option value="Optical Fiber & Telecom">Optical Fiber Telecom</option>
          </select>
        </div>
      </div>

      {/* Two Column Layout: Project Cards List + Deep-Dive Evidence Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Project Risk Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Projects Requiring Attention ({filteredAssessments.length})
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredAssessments.map((ass) => {
              const isSelected = activeAssessment?.projectId === ass.projectId;
              const badgeColors = {
                critical: 'bg-red-50 text-red-700 border-red-300',
                high: 'bg-amber-50 text-amber-700 border-amber-300',
                medium: 'bg-cyan-50 text-cyan-700 border-cyan-300',
                low: 'bg-emerald-50 text-emerald-700 border-emerald-300',
              }[ass.riskLevel];

              return (
                <div
                  key={ass.projectId}
                  onClick={() => setActiveProjectId(ass.projectId)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 text-xs ${
                    isSelected
                      ? 'bg-white border-slate-900 shadow-md ring-1 ring-slate-900'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {ass.projectCode}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${badgeColors}`}>
                      {ass.riskLevel} Risk • {ass.riskScore}/100
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">
                    {ass.projectTitle}
                  </h3>

                  <div className="text-[11px] text-slate-500">
                    {ass.department}
                  </div>

                  {/* Progress burn-rate bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-600 font-semibold">
                      <span>Progress: {ass.actualProgressPercentage}%</span>
                      <span>Expected: {ass.expectedProgressPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-cyan-600 h-full rounded-full transition-all"
                        style={{ width: `${ass.actualProgressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">
                      {ass.remainingDays >= 0 ? `${ass.remainingDays} days left` : `Overdue by ${Math.abs(ass.remainingDays)} days`}
                    </span>
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      Inspect Breakdown <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep-Dive Evidence & Mitigation Dossier (7 cols) */}
        <div className="lg:col-span-7">
          {activeAssessment && activeProject ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200 text-slate-800">
                      {activeAssessment.projectCode}
                    </span>
                    <span className="text-xs text-slate-500">Corridor: {activeProject.roadSegment}</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 mt-1">
                    {activeAssessment.projectTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Composite Score</div>
                    <div className="text-xl font-black text-slate-900">{activeAssessment.riskScore} / 100</div>
                  </div>
                  <button
                    onClick={() => onSelectProject(activeProject)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer"
                    title="Open Full Project Detail Dossier"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 4-Factor Scoring Breakdown Table */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                  Four-Factor Deterministic Scoring Rubric
                </h3>

                <div className="space-y-2">
                  {activeAssessment.factors.map((f, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{f.name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-400">Weight: {f.weight}%</span>
                          <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {f.score} / 100
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {f.evidence}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Supporting Evidence */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Database Evidence
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  {activeAssessment.supportingEvidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Engineering Mitigation Steps */}
              <div className="p-4 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2 text-xs">
                <h3 className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-600" />
                  Recommended Engineering Mitigation Plan
                </h3>
                <ul className="space-y-1.5 text-cyan-900">
                  {activeAssessment.recommendedMitigations.map((mit, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <span className="font-bold text-cyan-700">•</span>
                      <span>{mit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Data Limitations Notice */}
              <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Assessment Notice:</strong> Labeled as a deterministic heuristic evaluation using recorded project start/end dates, milestone completion burn-rate, and verified coordinate overlaps.
                </span>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              Select a project from the left to inspect its risk dossier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
