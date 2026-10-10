import React from 'react';
import {
  Compass,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Building2,
  Layers,
  ArrowRight,
  HardHat,
  ShieldCheck,
  Calendar,
  MapPin,
  Clock
} from 'lucide-react';

interface HowItWorksViewProps {
  onNavigate: (path: string) => void;
  onOpenSignUp: () => void;
}

export const HowItWorksView: React.FC<HowItWorksViewProps> = ({ onNavigate, onOpenSignUp }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-4">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
          <Compass className="w-3.5 h-3.5 text-teal-700" />
          <span>Technical Architecture & Flow</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How InfraNexus AI Works
        </h1>
        <p className="text-sm font-semibold text-teal-700 uppercase tracking-wide">
          One Network. Zero Coordination Blind Spots.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          A step-by-step look into how our platform detects municipal scheduling collisions and harmonizes civil engineering works before road disruption happens.
        </p>
      </div>

      {/* 3 Detailed Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs flex flex-col md:flex-row items-start gap-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-800 border border-blue-200 flex items-center justify-center font-mono font-bold text-xl shrink-0">
            01
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Phase 1: Ingestion</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Spatial & Temporal Registration</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Departmental Project Chartering & GIS Logging
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every municipal department (Highways, Metro Water, Electricity Board, Telecom) logs capital work items with exact GPS coordinates (Latitude/Longitude), corridor boundaries, work zone buffer radius (e.g., 200m–500m), trench depth specifications, and planned execution dates.
            </p>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1 font-mono">
              <div>// Example Registration Payload</div>
              <div className="text-blue-700 font-bold">&#123; code: "WS-2026-114", road: "GST Road Corridor", lat: 12.9815, lng: 80.218, buffer: 250m, dates: "2026-10-25 → 2026-12-10" &#125;</div>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs flex flex-col md:flex-row items-start gap-8">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-800 border border-red-200 flex items-center justify-center font-mono font-bold text-xl shrink-0">
            02
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Phase 2: Conflict Engine</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">Deterministic Haversine & Calendar Math</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Automated Clash Detection & Severity Scoring
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              The InfraNexus clash engine runs mathematical proximity calculations across all registered worksites. When two projects fall within combined buffer zones and have overlapping or reverse-sequence calendar windows, a conflict vector is automatically synthesized with a calculated severity score.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1">
                <span className="font-bold text-red-800">Critical Clash: Reverse Sequence</span>
                <p className="text-[11px] text-red-700 leading-snug">
                  Highways plans to lay bitumen before Metro Water finishes deep trenching on the same corridor.
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                <span className="font-bold text-amber-800">High Clash: Concurrent Bottleneck</span>
                <p className="text-[11px] text-amber-700 leading-snug">
                  TNEB and Telecom both schedule trenching across parallel lanes during the same festival month.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xs flex flex-col md:flex-row items-start gap-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-mono font-bold text-xl shrink-0">
            03
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">Phase 3: Resolution & Transparency</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">AI Alignment & Public Notices</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              AI-Assisted Scheduling & Civic Transparency
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Powered by server-side Gemini intelligence, the coordination assistant generates structured deconfliction briefs, proposing optimal phase sequencing (e.g. deferring road surfacing until pipeline trench curing completes). Once authorized by the Municipal Commissioner, the revised dates propagate to public maps and traffic advisories.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => onNavigate('/map')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Inspect Live Map Coordinates →
              </button>
              <button
                onClick={() => onNavigate('/analytics/dashboard')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                View Clash Analytics →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
