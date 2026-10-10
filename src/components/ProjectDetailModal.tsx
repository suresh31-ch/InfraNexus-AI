import React, { useState } from 'react';
import { Project, UserRole, ProjectStatus } from '../types';
import { dataStore } from '../lib/dataStore';
import { Calendar, DollarSign, User, MapPin, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProjectDetailModalProps {
  project: Project;
  userRole: UserRole;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  userRole,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(project.progressPercentage);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [updateNote, setUpdateNote] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canEdit = userRole === 'dept_officer' || userRole === 'city_admin';

  const handleSaveProgress = () => {
    if (progress < 0 || progress > 100) {
      setErrorMsg('Progress percentage must be between 0 and 100%');
      return;
    }
    setSaving(true);
    setErrorMsg(null);

    dataStore.updateProject(project.id, {
      progressPercentage: progress,
      status: progress === 100 ? 'completed' : status,
    });

    if (updateNote.trim()) {
      dataStore.logAudit(
        'FIELD_PROGRESS_NOTE',
        'projects',
        project.id,
        { progressAfter: progress, note: updateNote, statusAfter: status }
      );
    }

    setSaving(false);
    setIsEditing(false);
    onUpdate();
  };

  const statusBadge = {
    planned: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    delayed: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    halted: 'bg-red-50 text-red-700 border-red-200',
  }[project.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-500">{project.projectCode}</span>
              <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border ${statusBadge}`}>
                {project.status.toUpperCase()}
              </span>
              {project.isDemoSeed && (
                <span className="text-[10px] text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                  Demo Seed
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-1">{project.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-slate-700">
          {/* Description */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Scope & Objectives</div>
            <p className="text-slate-700 leading-relaxed text-xs md:text-sm">{project.description}</p>
          </div>

          {/* Grid Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 block">Department</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{project.department}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Work Category</span>
              <span className="font-semibold text-slate-900 mt-0.5 block capitalize">
                {project.workCategory.replace('_', ' ')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Road Segment Corridor</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{project.roadSegment}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Zonal Jurisdiction</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{project.zone}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Contractor</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{project.contractor}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Estimated Budget</span>
              <span className="font-semibold text-slate-900 mt-0.5 block font-mono tabular-nums">
                ₹{project.estimatedBudget.toFixed(1)} Lakhs
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Planned Work Span</span>
              <span className="font-semibold text-slate-900 mt-0.5 block font-mono tabular-nums">
                {project.plannedStartDate} → {project.plannedEndDate}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Coordinates & Buffer</span>
              <span className="font-semibold text-slate-900 mt-0.5 block font-mono tabular-nums text-[11px]">
                {project.latitude.toFixed(4)}, {project.longitude.toFixed(4)} ({project.workZoneRadiusMeters}m radius)
              </span>
            </div>
          </div>

          {/* Progress Bar & Editing */}
          <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Project Completion</span>
              <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">{project.progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-slate-900 h-full rounded-full transition-all duration-300"
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>

            {canEdit && !isEditing && (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Update Milestone & Status
                </button>
              </div>
            )}

            {isEditing && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 mt-3">
                {errorMsg && <div className="text-xs text-red-600">{errorMsg}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={progress}
                      onChange={(e) => setProgress(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                      className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In Progress</option>
                      <option value="delayed">Delayed</option>
                      <option value="completed">Completed</option>
                      <option value="halted">Halted</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Field Update Note</label>
                  <input
                    type="text"
                    value={updateNote}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder="e.g. Asphalting completed on left carriageway."
                    className="w-full text-xs p-2 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProgress}
                    disabled={saving}
                    className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium hover:bg-slate-800 cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
