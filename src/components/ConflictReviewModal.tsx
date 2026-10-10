import React, { useState } from 'react';
import { ProjectConflict } from '../types';
import { dataStore } from '../lib/dataStore';
import { AlertTriangle, Sparkles, CheckCircle2, XCircle, ArrowRight, Calendar, ShieldAlert, FileText, Loader2 } from 'lucide-react';

interface ConflictReviewModalProps {
  conflict: ProjectConflict;
  onClose: () => void;
  onSuccess: () => void;
}

export const ConflictReviewModal: React.FC<ConflictReviewModalProps> = ({ conflict, onClose, onSuccess }) => {
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [dismissReason, setDismissReason] = useState<string>('');
  const [showDismissInput, setShowDismissInput] = useState<boolean>(false);

  const [applying, setApplying] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Call Server-side Gemini AI Coordination Endpoint
  const handleRequestAiCoordination = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/conflict-coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const result = await res.json();
      setAiResult(result.data);
    } catch (err: any) {
      console.error('Error fetching AI coordination plan:', err);
      setAiError(err.message || 'Failed to reach AI assistant');
    } finally {
      setLoadingAi(false);
    }
  };

  // Human approval of AI schedule adjustment
  const handleApplyAiSchedule = () => {
    if (!aiResult) return;
    setApplying(true);

    const shiftB = aiResult.recommendedDates?.projectB;
    const shiftA = aiResult.recommendedDates?.projectA;

    dataStore.applyCoordinationDecision(conflict.id, {
      decisionType: 'reschedule_project_b',
      justification: `AI-Recommended Deconfliction Plan: ${aiResult.strategy}. ${aiResult.summary}`,
      agreedStartDate: shiftB?.suggestedStart,
      agreedEndDate: shiftB?.suggestedEnd,
      aiRecommendationAccepted: true,
      shiftProjectB: shiftB
        ? {
            id: conflict.projectB.id,
            newStart: shiftB.suggestedStart,
            newEnd: shiftB.suggestedEnd,
          }
        : undefined,
      shiftProjectA: shiftA
        ? {
            id: conflict.projectA.id,
            newStart: shiftA.suggestedStart,
            newEnd: shiftA.suggestedEnd,
          }
        : undefined,
    });

    setApplying(false);
    setActionSuccess('Coordination decision signed off. Project timeline updated in master registry.');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1500);
  };

  const handleDismiss = () => {
    if (!dismissReason.trim()) return;
    dataStore.dismissConflict(conflict.id, dismissReason);
    setActionSuccess('Conflict dismissed with official reasoning recorded in audit log.');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 1200);
  };

  const severityColor = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    moderate: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-slate-50 text-slate-700 border-slate-200',
  }[conflict.severity];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${severityColor}`}>
              {conflict.severity.toUpperCase()} SEVERITY
            </span>
            <h2 className="text-base font-bold text-slate-900">{conflict.conflictCategory}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto text-sm text-slate-700">
          {actionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Road Corridor and Key Deterministic Metrics */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-500 font-medium">Road Segment Corridor</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{conflict.roadSegment}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Temporal Date Overlap</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                {conflict.overlapDays} Overlapping Days
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Geographic Proximity</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 font-mono tabular-nums">
                {conflict.distanceMeters}m separation
              </div>
            </div>
          </div>

          {/* Conflict Reason Explanation */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-600" /> Deterministic Collision Reason
            </div>
            <p className="p-3 bg-red-50/60 border border-red-200/70 rounded-lg text-slate-800 leading-relaxed text-xs md:text-sm">
              {conflict.conflictReason}
            </p>
          </div>

          {/* Project Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project A */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs">
              <div className="text-xs text-slate-500 font-medium mb-1">Project A (First Scheduled)</div>
              <div className="font-bold text-slate-900">{conflict.projectA.title}</div>
              <div className="text-xs text-slate-600 mt-1">{conflict.projectA.department}</div>
              <div className="mt-3 text-xs space-y-1 text-slate-600">
                <div>Category: <span className="font-medium text-slate-800">{conflict.projectA.workCategory.replace('_', ' ')}</span></div>
                <div>Contractor: <span className="font-medium text-slate-800">{conflict.projectA.contractor}</span></div>
                <div className="font-mono tabular-nums">Dates: {conflict.projectA.plannedStartDate} → {conflict.projectA.plannedEndDate}</div>
              </div>
            </div>

            {/* Project B */}
            <div className="p-4 rounded-lg border border-slate-200 bg-white shadow-2xs">
              <div className="text-xs text-slate-500 font-medium mb-1">Project B (Conflicting Party)</div>
              <div className="font-bold text-slate-900">{conflict.projectB.title}</div>
              <div className="text-xs text-slate-600 mt-1">{conflict.projectB.department}</div>
              <div className="mt-3 text-xs space-y-1 text-slate-600">
                <div>Category: <span className="font-medium text-slate-800">{conflict.projectB.workCategory.replace('_', ' ')}</span></div>
                <div>Contractor: <span className="font-medium text-slate-800">{conflict.projectB.contractor}</span></div>
                <div className="font-mono tabular-nums">Dates: {conflict.projectB.plannedStartDate} → {conflict.projectB.plannedEndDate}</div>
              </div>
            </div>
          </div>

          {/* AI Coordination Section */}
          <div className="border border-indigo-200/80 bg-indigo-50/40 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-indigo-950">AI Coordination Assistant (Gemini API)</h3>
              </div>
              <button
                onClick={handleRequestAiCoordination}
                disabled={loadingAi}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing Schedule...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Generate Deconfliction Plan
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {aiError}
              </div>
            )}

            {aiResult && (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                    Strategy: {aiResult.strategy}
                  </div>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">{aiResult.summary}</p>
                </div>

                {/* Proposed Dates Comparison */}
                <div className="p-3.5 bg-white rounded-lg border border-indigo-100 shadow-2xs">
                  <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Proposed Schedule Staging
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <div className="font-semibold text-slate-900">{conflict.projectA.title}</div>
                      <div className="text-slate-500 font-mono text-[11px] mt-1">
                        Dates: {aiResult.recommendedDates?.projectA?.suggestedStart} → {aiResult.recommendedDates?.projectA?.suggestedEnd}
                      </div>
                    </div>
                    <div className="p-2.5 bg-indigo-50/70 rounded border border-indigo-200">
                      <div className="font-semibold text-indigo-950">{conflict.projectB.title}</div>
                      <div className="text-indigo-700 font-mono font-medium text-[11px] mt-1">
                        Revised: {aiResult.recommendedDates?.projectB?.suggestedStart} → {aiResult.recommendedDates?.projectB?.suggestedEnd}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Traffic and Human Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1.5">Traffic Mitigation Protocol</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                      {aiResult.trafficImpactMitigation?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-800 mb-1.5">Human Verification Checklist</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                      {aiResult.humanReviewChecklist?.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Human Approval Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleApplyAiSchedule}
                    disabled={applying}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve & Enforce Deconfliction Schedule
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dismiss Conflict Option */}
          {showDismissInput ? (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="text-xs font-semibold text-slate-800">
                Official Dismissal Justification (Required for Audit Trail):
              </label>
              <textarea
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                rows={2}
                placeholder="e.g. Work is separated across physical service road curb with dedicated right-of-way; traffic flows are independent."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowDismissInput(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDismiss}
                  disabled={!dismissReason.trim()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
                >
                  Confirm Dismissal
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={() => setShowDismissInput(true)}
                className="text-xs text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                Dismiss Conflict as False Positive / Separate Lanes
              </button>
            </div>
          )}
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
