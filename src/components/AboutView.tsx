import React from 'react';
import { Building2, ShieldCheck, Target, Award, Users, AlertTriangle, ArrowRight, GitBranch, Cpu } from 'lucide-react';

interface AboutViewProps {
  onNavigate: (path: string) => void;
  onOpenSignUp: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate, onOpenSignUp }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 py-4">
      {/* Hero Problem Statement */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-xs space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
          <Building2 className="w-3.5 h-3.5 text-teal-700" />
          <span>Bits and Bytes 24-Hour Web Development Hackathon</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          About InfraNexus AI
        </h1>
        <p className="text-sm font-bold text-teal-700 uppercase tracking-wide">
          One Network. Zero Coordination Blind Spots.
        </p>
        <p className="text-base text-slate-600 leading-relaxed max-w-3xl font-medium">
          <strong>Hackathon Track:</strong> CivicTech — Improving Transparency and Coordination in Public Works Projects.
        </p>
        <p className="text-xs text-slate-500 font-medium">
          <strong>Category:</strong> AI-Powered Municipal Infrastructure Coordination
        </p>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Across rapidly urbanizing Indian cities like Chennai, Bengaluru, and Hyderabad, citizens endure an endless cycle of municipal frustration: a major arterial road is freshly resurfaced with smooth bitumen, only for water pipeline contractors or electricity boards to dig it up three weeks later.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-xs font-bold text-slate-500">Capital Loss</span>
            <div className="text-xl font-bold font-mono text-red-600">₹Crores Wasted</div>
            <p className="text-[11px] text-slate-500">Bitumen destroyed by premature secondary excavation</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-xs font-bold text-slate-500">Commute Congestion</span>
            <div className="text-xl font-bold font-mono text-amber-600">30-45% Delays</div>
            <p className="text-[11px] text-slate-500">Dual trenching collapses vehicular throughput</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl space-y-1">
            <span className="text-xs font-bold text-slate-500">Citizen Trust</span>
            <div className="text-xl font-bold font-mono text-teal-700">Severely Eroded</div>
            <p className="text-[11px] text-slate-500">Lack of public visibility into responsible agencies</p>
          </div>
        </div>
      </div>

      {/* The Solution */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Our Architectural Approach</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Spatial-Temporal Master Registry</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Eliminates inter-agency silos by unifying Highways, CMWSSB (Water), TNEB (Power), and Telecom onto a shared coordinate plane with work-zone buffers.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-800 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Deterministic Clash Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mathematical Haversine proximity calculations combined with calendar overlap heuristics detect collision hazards automatically before tender finalization.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Civic Transparency & Verification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Empowers residents with trackable issue reporting, photo evidence, and an interactive GIS corridor map of ongoing works.
            </p>
          </div>
        </div>
      </div>

      {/* IIITDM Kancheepuram Hackathon Context */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 space-y-4">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-mono font-bold">
          <Award className="w-4 h-4" /> IIITDM KANCHEEPURAM · BITS AND BYTES HACKATHON
        </div>
        <h3 className="text-xl font-bold">Engineered for Rapid Multi-Agency Adoption</h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          InfraNexus AI is built on standard PostgreSQL with Supabase Row Level Security (RLS) and real Gmail verification. It guarantees that citizen accounts cannot tamper with engineering data, while municipal administrators hold authorized oversight over cross-departmental coordination accords.
        </p>
        <div className="pt-4 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('/map')}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span>Explore City Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenSignUp}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 cursor-pointer transition-colors"
          >
            Register Test Account
          </button>
        </div>
      </div>
    </div>
  );
};
