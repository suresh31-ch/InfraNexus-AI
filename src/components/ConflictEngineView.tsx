import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Project, ProjectConflict, UserRole } from '../types';
import { dataStore } from '../lib/dataStore';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  Clock,
  RefreshCw,
  Building2,
  DollarSign,
  AlertCircle,
  HelpCircle,
  MapPin,
  Eye,
  EyeOff,
  Layers,
  Download,
  Play,
  Check,
  ChevronRight,
  Filter,
  BarChart3,
  Activity,
  ShieldAlert,
  FileText,
  Info,
  ExternalLink,
  ChevronDown,
  Loader2,
} from 'lucide-react';

interface ConflictEngineViewProps {
  conflicts: ProjectConflict[];
  projects?: Project[];
  userRole?: UserRole;
  onSelectConflict?: (conflict: ProjectConflict) => void;
  onRecalculate?: () => void;
  initialSection?: 'overview' | 'map' | 'timeline' | 'ai';
}

export const ConflictEngineView: React.FC<ConflictEngineViewProps> = ({
  conflicts,
  projects: propProjects,
  userRole = 'dept_officer',
  onSelectConflict,
  onRecalculate,
  initialSection = 'overview',
}) => {
  // Ensure we have real projects list
  const projects = propProjects && propProjects.length > 0 ? propProjects : dataStore.getProjects();

  // Active section among the 4 panels from reference image:
  // 1: Conflict Overview
  // 2: Interactive Conflict Map
  // 3: Timeline & Evidence
  // 4: AI Coordination Recommendation
  const [activeSection, setActiveSection] = useState<'overview' | 'map' | 'timeline' | 'ai'>(
    initialSection
  );

  // Sync if prop changes
  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Selected conflict for detailed inspection (Panels 3 & 4)
  const defaultConflict =
    conflicts.find(
      (c) =>
        (c.projectA?.projectCode === 'HW-2026-089' && c.projectB?.projectCode === 'WS-2026-114') ||
        (c.projectB?.projectCode === 'HW-2026-089' && c.projectA?.projectCode === 'WS-2026-114')
    ) ||
    conflicts[0] ||
    null;

  const [selectedConflict, setSelectedConflictState] = useState<ProjectConflict | null>(defaultConflict);

  // Keep selected conflict synced if conflicts update
  useEffect(() => {
    if (selectedConflict) {
      const refreshed = conflicts.find((c) => c.id === selectedConflict.id);
      if (refreshed) {
        setSelectedConflictState(refreshed);
      }
    } else if (conflicts.length > 0) {
      setSelectedConflictState(defaultConflict);
    }
  }, [conflicts]);

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('Apr 30, 2026, 02:15 PM');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // AI Coordination State (Server-side Gemini 3.8 Flash)
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPlan, setAiPlan] = useState<any | null>(null);
  const [aiSource, setAiSource] = useState<string>('gemini-3.8-flash');
  const [aiError, setAiError] = useState<string | null>(null);

  // Modals for schedule realignment & override
  const [showRealignModal, setShowRealignModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideRationale, setOverrideRationale] = useState('');
  const [overrideError, setOverrideError] = useState<string | null>(null);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mapLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Selected projects toggle for Panel 2
  const [selectedProjectIds, setSelectedProjectIds] = useState<{ [id: string]: boolean }>({
    'proj_gst_resurfacing': true,
    'proj_gst_water_pipe': true,
    'proj_vk_drainage': true,
    'proj_vk_power_grid': true,
  });

  // Map filters
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Breadcrumb / sub-tabs inside Section 3
  const [timelineSubTab, setTimelineSubTab] = useState<
    'overview' | 'timeline' | 'location' | 'impact' | 'ai' | 'history'
  >('overview');

  // Fetch real Gemini AI Coordination Recommendation from server
  const fetchAiCoordination = async (conflictToAnalyze: ProjectConflict | null) => {
    if (!conflictToAnalyze) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/conflict-coordination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conflict: conflictToAnalyze }),
      });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.data) {
        setAiPlan(json.data);
        setAiSource(json.source || 'gemini-3.8-flash');
      }
    } catch (err: any) {
      console.warn('AI coordination fetch note:', err);
      setAiError(err.message || 'AI service note');
    } finally {
      setAiLoading(false);
    }
  };

  // Automatically fetch AI coordination plan when navigating to Panel 4 or switching selected conflict
  useEffect(() => {
    if (activeSection === 'ai' && selectedConflict) {
      fetchAiCoordination(selectedConflict);
    }
  }, [activeSection, selectedConflict?.id]);

  // Initialize or re-render map when activeSection === 'map'
  useEffect(() => {
    if (activeSection !== 'map') return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [12.8428, 80.1538],
          zoom: 13,
          zoomControl: true,
        });

        // CartoDB Dark Matter tiles for modern dark GIS styling
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        const layers = L.layerGroup().addTo(map);
        mapLayerGroupRef.current = layers;
        mapInstanceRef.current = map;
      }

      renderMapElements();
    }, 100);

    return () => clearTimeout(timer);
  }, [activeSection, selectedProjectIds, conflicts, deptFilter, typeFilter, severityFilter]);

  const renderMapElements = () => {
    if (!mapInstanceRef.current || !mapLayerGroupRef.current) return;
    mapLayerGroupRef.current.clearLayers();

    // 1. Draw conflict zones and connections
    conflicts.forEach((c) => {
      if (severityFilter !== 'ALL' && c.severity !== severityFilter) return;

      const pA = c.projectA;
      const pB = c.projectB;
      if (!pA || !pB) return;

      // Dashed conflict connection line
      const line = L.polyline(
        [
          [pA.latitude, pA.longitude],
          [pB.latitude, pB.longitude],
        ],
        {
          color: c.severity === 'critical' ? '#ef4444' : '#f59e0b',
          dashArray: '6, 8',
          weight: 3,
          opacity: 0.85,
        }
      );
      mapLayerGroupRef.current?.addLayer(line);

      // Overlap corridor buffer polygon
      const midLat = (pA.latitude + pB.latitude) / 2;
      const midLng = (pA.longitude + pB.longitude) / 2;
      const buffer = L.circle([midLat, midLng], {
        radius: 350,
        color: c.severity === 'critical' ? '#ef4444' : '#f59e0b',
        fillColor: c.severity === 'critical' ? '#b91c1c' : '#d97706',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '4, 4',
      });
      buffer.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 220px;">
          <div style="font-size: 11px; font-weight: 800; color: #b91c1c; text-transform: uppercase;">⚠️ Conflict Detected</div>
          <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">${c.roadSegment}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">
            ${pA.projectCode} ↔ ${pB.projectCode}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #dc2626; margin-top: 2px;">
            Overlap: ${c.overlapDays} days • Severity: ${c.severity.toUpperCase()}
          </div>
        </div>
      `);
      mapLayerGroupRef.current?.addLayer(buffer);
    });

    // 2. Add Project markers
    projects.forEach((p) => {
      if (deptFilter !== 'ALL' && p.department !== deptFilter) return;
      if (typeFilter !== 'ALL' && p.workCategory !== typeFilter) return;

      const isChecked = selectedProjectIds[p.id] !== false;
      if (!isChecked) return;

      const isHighways = p.department === 'Highways & Road Infrastructure';
      const isWater = p.department === 'Water Supply & Sewage Board';
      const isPower = p.department === 'Electricity & Power Utilities';
      const markerColor = isHighways ? '#06b6d4' : isWater ? '#3b82f6' : isPower ? '#f59e0b' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: ${markerColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: 800;
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${markerColor}aa;
          ">
            ${isHighways ? 'R' : isWater ? 'W' : isPower ? 'E' : 'P'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #0f172a; min-width: 220px;">
          <div style="font-size: 11px; font-weight: 700; color: #0284c7;">${p.projectCode}</div>
          <div style="font-size: 13px; font-weight: 700; margin-top: 2px;">${p.title}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">${p.department}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">📅 ${p.plannedStartDate} → ${p.plannedEndDate}</div>
          <div style="font-size: 11px; font-weight: 600; color: #0f172a; margin-top: 2px;">Budget: ₹${p.estimatedBudget.toFixed(1)} L</div>
        </div>
      `);
      mapLayerGroupRef.current?.addLayer(marker);
    });
  };

  const handleFitToConflicts = () => {
    if (!mapInstanceRef.current) return;
    const points: [number, number][] = [];
    conflicts.forEach((c) => {
      if (c.projectA?.latitude && c.projectA?.longitude) {
        points.push([c.projectA.latitude, c.projectA.longitude]);
      }
      if (c.projectB?.latitude && c.projectB?.longitude) {
        points.push([c.projectB.latitude, c.projectB.longitude]);
      }
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      mapInstanceRef.current.setView([12.8428, 80.1538], 13, { animate: true });
    }
  };

  // Run Conflict Analysis action
  const handleRunConflictAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      if (onRecalculate) {
        onRecalculate();
      } else {
        dataStore.recalculateConflicts();
      }
      const now = new Date();
      setLastAnalysisTime(
        now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
          ', ' +
          now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
      setIsAnalyzing(false);
      setActionNotice('Corridor spatial analysis completed! All active municipal records re-evaluated.');
      setTimeout(() => setActionNotice(null), 4000);
    }, 700);
  };

  // Realignment execution
  const handleConfirmRealignment = () => {
    if (!selectedConflict) return;
    const pA = selectedConflict.projectA;
    const pB = selectedConflict.projectB;
    if (!pA || !pB) return;

    // Shift Project A to start after Project B concludes plus 2 days for curing
    const bEndDate = new Date(pB.plannedEndDate);
    const newStart = new Date(bEndDate.getTime() + 86400000 * 2).toISOString().split('T')[0];
    const oldStart = new Date(pA.plannedStartDate).getTime();
    const oldEnd = new Date(pA.plannedEndDate).getTime();
    const durationMs = Math.max(86400000 * 14, oldEnd - oldStart);
    const newEnd = new Date(new Date(newStart).getTime() + durationMs).toISOString().split('T')[0];

    dataStore.updateProject(pA.id, {
      plannedStartDate: newStart,
      plannedEndDate: newEnd,
    });

    dataStore.resolveConflictSequenced(
      selectedConflict.id,
      `Sequence Reversal: ${pA.projectCode} deferred to start ${newStart} after ${pB.projectCode} trenching finishes on ${pB.plannedEndDate}. Prevents pavement destruction.`,
      newStart,
      newEnd
    );

    setShowRealignModal(false);
    setActionNotice(
      `Schedule realignment committed for ${selectedConflict.roadSegment}! ${pA.projectCode} rescheduled to ${newStart} → ${newEnd}. Active conflict resolved.`
    );
    if (onRecalculate) onRecalculate();
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Justified override execution
  const handleConfirmOverride = () => {
    if (!overrideRationale.trim()) {
      setOverrideError('Please provide technical justification for concurrent excavation.');
      return;
    }
    if (!selectedConflict) return;
    dataStore.resolveConflictOverride(selectedConflict.id, overrideRationale.trim());
    setShowOverrideModal(false);
    setOverrideRationale('');
    setOverrideError(null);
    setActionNotice('Justified concurrent work logged in municipal audit ledger.');
    if (onRecalculate) onRecalculate();
    setTimeout(() => setActionNotice(null), 5000);
  };

  // Generate downloadable report
  const handleDownloadReport = () => {
    if (!selectedConflict) return;
    const pA = selectedConflict.projectA;
    const pB = selectedConflict.projectB;

    const reportText = `
================================================================================
INFRASTRUCTURE CONFLICT COORDINATION MEMORANDUM
INFRANEXUS AI — MUNICIPAL DECONFLICTION ENGINE
================================================================================
Generated: ${new Date().toLocaleString()}
Conflict ID: ${selectedConflict.id}
Corridor: ${selectedConflict.roadSegment}
Severity: ${selectedConflict.severity.toUpperCase()}
Status: ${selectedConflict.status.toUpperCase()}

PROJECT A (HIGHWAYS):
- Code: ${pA?.projectCode}
- Title: ${pA?.title}
- Department: ${pA?.department}
- Schedule: ${pA?.plannedStartDate} to ${pA?.plannedEndDate}
- Contractor: ${pA?.contractor}
- Budget: INR ${pA?.estimatedBudget} Lakhs

PROJECT B (WATER / UTILITY):
- Code: ${pB?.projectCode}
- Title: ${pB?.title}
- Department: ${pB?.department}
- Schedule: ${pB?.plannedStartDate} to ${pB?.plannedEndDate}
- Contractor: ${pB?.contractor}
- Budget: INR ${pB?.estimatedBudget} Lakhs

OVERLAP ANALYSIS:
- Duration: ${selectedConflict.overlapDays} Days Overlap
- Root Cause: Trench excavation in freshly resurfaced carriageway
- Risk: Repeat excavation, premature pavement destruction, public traffic gridlock

AI COORDINATION RECOMMENDATION (GEMINI 3.8 FLASH):
Strategy: ${aiPlan?.strategy || 'Sequential Staging: Subsurface Utility Precedence'}
Summary: ${aiPlan?.summary || 'Executing road resurfacing prior to or concurrently with deep pipeline excavation results in destructive trenching. Water feeder replacement must complete first.'}
Schedule Guidance: ${aiPlan?.scheduleRecommendation || 'Hold pipeline installation to baseline and postpone road resurfacing until trench compaction is verified.'}

SUGGESTED WORK SEQUENCE:
1. Complete pipeline installation (${pB?.plannedStartDate} to ${pB?.plannedEndDate})
2. Soil compaction inspection and settlement curing
3. Execute bitumen milling and surface asphalt laying (${aiPlan?.recommendedDates?.projectA?.suggestedStart || '2026-12-12'} to ${aiPlan?.recommendedDates?.projectA?.suggestedEnd || '2027-01-19'})

HUMAN REVIEW & MUNICIPAL SIGN-OFF CHECKLIST:
- Sign-off from Executive Engineer (Water Supply & Sewage Board)
- Compaction density verification (minimum 95% Proctor density)
- Joint right-of-way NOC endorsed by Municipal Corporation
================================================================================
`.trim();

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `InfraNexus-Conflict-Report-${selectedConflict.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Metrics calculations from real database records
  const totalConflicts = conflicts.length;
  const criticalCount = conflicts.filter((c) => c.severity === 'critical').length;
  const highCount = conflicts.filter((c) => c.severity === 'high').length;
  const moderateCount = conflicts.filter((c) => c.severity === 'moderate' || c.severity === 'low').length;
  const awaitingActionCount = conflicts.filter((c) => c.status === 'pending_review').length;
  const resolvedCount = conflicts.filter(
    (c) => c.status === 'resolved_sequenced' || c.status === 'coordinated' || c.status === 'override_concurrent'
  ).length;
  const projectsAnalyzedCount = projects.length;

  // Active conflict data
  const targetConflict = selectedConflict || defaultConflict;
  const projectA = targetConflict?.projectA;
  const projectB = targetConflict?.projectB;
  const overlapDays = targetConflict?.overlapDays || 18;

  return (
    <div className="bg-[#0a0f1d] text-slate-100 rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 lg:p-7 space-y-6">
      {/* Toast Notification Alert */}
      {actionNotice && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold px-2 py-0.5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* TOP MASTER FOUR-PANEL SWITCHER (REFERENCE IMAGE DIRECT MAPPING) */}
      {/* ============================================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                <span>Conflict Detection Center</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                  InfraNexus Engine
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Identify and resolve infrastructure conflicts before they become costly problems.
              </p>
            </div>
          </div>
        </div>

        {/* The 4 Connected Section Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">1</span>
            <span>Conflict Overview</span>
          </button>

          <button
            onClick={() => setActiveSection('map')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSection === 'map'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">2</span>
            <span>Interactive Conflict Map</span>
          </button>

          <button
            onClick={() => setActiveSection('timeline')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSection === 'timeline'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">3</span>
            <span>Timeline & Evidence</span>
          </button>

          <button
            onClick={() => setActiveSection('ai')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeSection === 'ai'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 flex items-center justify-center text-[10px]">4</span>
            <span>AI Coordination</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: CONFLICT OVERVIEW (PANEL 1 IN REFERENCE IMAGE)       */}
      {/* ============================================================== */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Subheader with Last Analysis and Run Conflict Analysis Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
            <div>
              <div className="text-xs font-semibold text-slate-400">
                Last analysis: <strong className="text-slate-200 font-mono">{lastAnalysisTime}</strong>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Real-time spatial buffering across 7 active municipal infrastructure zones
              </div>
            </div>

            <button
              onClick={handleRunConflictAnalysis}
              disabled={isAnalyzing}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                isAnalyzing
                  ? 'bg-cyan-800 text-cyan-200 cursor-wait'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30 active:scale-95'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Scanning Corridor Matrix...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Conflict Analysis</span>
                </>
              )}
            </button>
          </div>

          {/* 6 KPI Cards as in Panel 1 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Conflicts */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                </div>
                <span>Total Conflicts</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white font-mono">{totalConflicts}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">↑ 2 new</span>
              </div>
            </div>

            {/* 2. Critical */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-red-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-red-950/80 border border-red-500/40 flex items-center justify-center">
                  <span className="text-red-400 font-bold text-[10px]">▲</span>
                </div>
                <span>Critical</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{criticalCount}</div>
            </div>

            {/* 3. High Priority */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-[10px]">▲</span>
                </div>
                <span>High Priority</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{highCount}</div>
            </div>

            {/* 4. Awaiting Action */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-cyan-400" />
                </div>
                <span>Awaiting Action</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{awaitingActionCount}</div>
            </div>

            {/* 5. Resolved */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <span>Resolved</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{resolvedCount}</div>
            </div>

            {/* 6. Projects Analyzed */}
            <div className="bg-[#10192e] p-4 rounded-xl border border-slate-800/90 space-y-1.5 shadow-sm">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center">
                  <Layers className="w-3 h-3 text-indigo-400" />
                </div>
                <span>Projects Analyzed</span>
              </div>
              <div className="text-2xl font-black text-white font-mono">{projectsAnalyzedCount}</div>
            </div>
          </div>

          {/* Charts Row: Conflict Trends (Left) & Conflicts by Severity (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Chart 1: Conflict Trends */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Conflict Trends</h3>
                  <div className="flex items-center gap-4 text-xs mt-1">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Detected
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Resolved
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500">7-Day Window</span>
              </div>

              {/* Line/Area SVG Chart */}
              <div className="h-44 w-full relative pt-2">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 450 140" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="30" y1="20" x2="440" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="30" y1="60" x2="440" y2="60" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="30" y1="100" x2="440" y2="100" stroke="#1e293b" strokeDasharray="3 3" />
                  <line x1="30" y1="130" x2="440" y2="130" stroke="#334155" />

                  {/* Y-axis labels */}
                  <text x="15" y="24" fill="#64748b" fontSize="10" fontFamily="monospace">6</text>
                  <text x="15" y="64" fill="#64748b" fontSize="10" fontFamily="monospace">4</text>
                  <text x="15" y="104" fill="#64748b" fontSize="10" fontFamily="monospace">2</text>
                  <text x="15" y="133" fill="#64748b" fontSize="10" fontFamily="monospace">0</text>

                  {/* Detected trend curve (Cyan) */}
                  <path
                    d="M 40,110 Q 100,105 160,85 T 280,60 T 360,40 T 430,35"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                  />
                  {/* Detected area fill */}
                  <path
                    d="M 40,110 Q 100,105 160,85 T 280,60 T 360,40 T 430,35 L 430,130 L 40,130 Z"
                    fill="url(#detectedGradient)"
                    opacity="0.25"
                  />

                  {/* Resolved trend curve (Emerald) */}
                  <path
                    d="M 40,125 Q 100,120 160,115 T 280,105 T 360,95 T 430,80"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />

                  {/* Data points */}
                  <circle cx="40" cy="110" r="3.5" fill="#06b6d4" />
                  <circle cx="160" cy="85" r="3.5" fill="#06b6d4" />
                  <circle cx="280" cy="60" r="3.5" fill="#06b6d4" />
                  <circle cx="360" cy="40" r="3.5" fill="#06b6d4" />
                  <circle cx="430" cy="35" r="4.5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="430" cy="80" r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1" />

                  <defs>
                    <linearGradient id="detectedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X Axis dates */}
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-2 pl-7 pr-2">
                  <span>Apr 24</span>
                  <span>Apr 25</span>
                  <span>Apr 26</span>
                  <span>Apr 27</span>
                  <span>Apr 28</span>
                  <span>Apr 29</span>
                  <span className="text-cyan-400 font-bold">Apr 30</span>
                </div>
              </div>
            </div>

            {/* Chart 2: Conflicts by Severity */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Conflicts by Severity</h3>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
                {/* Donut Chart */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#1e293b" strokeWidth="12" />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="12"
                      strokeDasharray="80 240"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="12"
                      strokeDasharray="60 240"
                      strokeDashoffset="-80"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="12"
                      strokeDasharray="40 240"
                      strokeDashoffset="-140"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-2xl font-black text-white font-mono leading-none">{totalConflicts}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">Total</span>
                  </div>
                </div>

                {/* Legend list with counts */}
                <div className="space-y-2 text-xs w-full sm:w-44">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                      <span className="text-slate-300 font-medium">Critical</span>
                    </div>
                    <span className="font-mono font-bold text-white">{criticalCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-slate-300 font-medium">High</span>
                    </div>
                    <span className="font-mono font-bold text-white">{highCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                      <span className="text-slate-300 font-medium">Medium</span>
                    </div>
                    <span className="font-mono font-bold text-white">{moderateCount}</span>
                  </div>

                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                      <span className="text-slate-400 font-medium">Low</span>
                    </div>
                    <span className="font-mono font-bold text-slate-400">0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Conflict Registry Table */}
          <div className="bg-[#10192e] rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Detected Conflicts Register</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any conflict to inspect its interactive GIS map, timeline evidence, or AI recommendations.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/40">
                {conflicts.length} Active Records
              </span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {conflicts.map((c) => {
                const isSelected = selectedConflict?.id === c.id;
                return (
                  <div
                    key={c.id}
                    className={`py-3.5 px-3 rounded-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs ${
                      isSelected
                        ? 'bg-slate-800/70 border border-cyan-500/30'
                        : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.severity === 'critical'
                              ? 'bg-red-950 text-red-400 border border-red-800/60'
                              : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          }`}
                        >
                          {c.severity}
                        </span>
                        <strong className="text-white text-sm">{c.roadSegment}</strong>
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({c.projectA?.projectCode} ↔ {c.projectB?.projectCode})
                        </span>
                      </div>
                      <div className="text-slate-400 text-xs">
                        {c.conflictReason}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Overlap: <strong className="text-cyan-300">{c.overlapDays} days</strong> • Status:{' '}
                        <span className="uppercase text-slate-300">{c.status.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedConflictState(c);
                          setActiveSection('timeline');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Inspect Timeline →
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConflictState(c);
                          setActiveSection('ai');
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-cyan-600/30"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Plan</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: INTERACTIVE CONFLICT MAP (PANEL 2 IN REFERENCE)     */}
      {/* ============================================================== */}
      {activeSection === 'map' && (
        <div className="space-y-4">
          {/* Header & Filter Controls Bar */}
          <div className="bg-[#10192e] p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Conflict Map</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Visualize project locations and detected conflicts
                </p>
              </div>

              {/* Fit to conflicts button */}
              <button
                onClick={handleFitToConflicts}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Fit to Conflicts</span>
              </button>
            </div>

            {/* Filter Dropdowns as in Panel 2 */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="Highways & Road Infrastructure">Roads & Highways</option>
                <option value="Water Supply & Sewage Board">Water Supply</option>
                <option value="Electricity & Power Utilities">Electricity</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Infrastructure Types</option>
                <option value="road_resurfacing">Road Resurfacing</option>
                <option value="water_pipeline">Water Pipeline</option>
                <option value="power_grid">Power Grid</option>
              </select>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="ALL">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
              </select>

              <div className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 font-mono text-[11px] ml-auto">
                📅 Oct 18, 2026 – Dec 10, 2026
              </div>
            </div>
          </div>

          {/* Map Layout: Left Selected Projects Overlay + Center Map + Right Legend */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Column: Selected Projects */}
            <div className="bg-[#10192e] p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Selected Projects
              </h3>
              <p className="text-[11px] text-slate-400">
                Toggle visibility to inspect corridor alignment:
              </p>

              <div className="space-y-2 pt-1 max-h-[380px] overflow-y-auto">
                {projects.map((p) => {
                  const isChecked = selectedProjectIds[p.id] !== false;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2 text-xs hover:border-slate-700 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            setSelectedProjectIds((prev) => ({
                              ...prev,
                              [p.id]: e.target.checked,
                            }));
                          }}
                          className="rounded text-cyan-600 focus:ring-0 focus:ring-offset-0 bg-slate-800 border-slate-700 cursor-pointer"
                        />
                        <span className="truncate text-slate-200 font-medium text-[11px]">
                          {p.title}
                        </span>
                      </label>
                      <button
                        onClick={() => {
                          setSelectedProjectIds((prev) => ({
                            ...prev,
                            [p.id]: !isChecked,
                          }));
                        }}
                        className="text-slate-400 hover:text-cyan-400 cursor-pointer"
                      >
                        {isChecked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center: The Interactive Leaflet Map Container */}
            <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-slate-800 relative h-[480px] bg-slate-950">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Floating Conflict Detected Badge over GST Road */}
              <div className="absolute top-4 left-4 z-[500] bg-slate-900/90 backdrop-blur-md border border-red-500/60 p-3 rounded-xl shadow-xl max-w-xs pointer-events-none">
                <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span>Conflict Detected</span>
                </div>
                <div className="text-white font-bold text-xs mt-1">
                  GST Road Resurfacing ↔ Water Pipeline
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Overlap: <strong className="text-cyan-400">18 days</strong> • Severity:{' '}
                  <strong className="text-red-400 uppercase">Critical</strong>
                </div>
              </div>
            </div>

            {/* Right Column: Map Legend */}
            <div className="bg-[#10192e] p-4 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Map Legend
              </h3>

              {/* Projects Colors */}
              <div className="space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-400">Projects</span>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    <span className="text-slate-300">Road Work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    <span className="text-slate-300">Water Supply</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="text-slate-300">Electricity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="text-slate-300">Telecom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span className="text-slate-300">Drainage</span>
                  </div>
                </div>
              </div>

              {/* Conflict Area */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">Conflict Area</span>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-2 bg-red-500/30 border border-red-500 rounded-xs"></span>
                    <span className="text-slate-300">Overlap Zone</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-0 border-t-2 border-dashed border-red-500"></span>
                    <span className="text-slate-300">Conflict Link</span>
                  </div>
                </div>
              </div>

              {/* Severity */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400">Severity</span>
                <div className="space-y-1.5 pl-1">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 font-bold">▲</span>
                    <span className="text-slate-300">Critical</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-bold">▲</span>
                    <span className="text-slate-300">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold">▲</span>
                    <span className="text-slate-300">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">▲</span>
                    <span className="text-slate-400">Low</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 3: TIMELINE & EVIDENCE (PANEL 3 IN REFERENCE)          */}
      {/* ============================================================== */}
      {activeSection === 'timeline' && (
        <div className="space-y-5">
          {/* Top navigation & conflict selector header */}
          <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveSection('overview')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                >
                  ← Back to Conflicts
                </button>

                {/* Conflict selector dropdown */}
                <select
                  value={selectedConflict?.id || ''}
                  onChange={(e) => {
                    const found = conflicts.find((c) => c.id === e.target.value);
                    if (found) setSelectedConflictState(found);
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold cursor-pointer focus:outline-none focus:border-cyan-500 max-w-sm truncate"
                >
                  {conflicts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.projectA?.title} ↔ {c.projectB?.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                    targetConflict?.severity === 'critical'
                      ? 'bg-red-950 text-red-400 border border-red-800/80'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/80'
                  }`}
                >
                  ▲ {targetConflict?.severity || 'Critical'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {targetConflict?.status === 'resolved_sequenced' ? 'Sequenced' : targetConflict?.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
              <span>Conflict ID: <strong className="text-slate-200 font-mono">{targetConflict?.id || 'CNF-001'}</strong></span>
              <span>•</span>
              <span>Detected: <strong className="text-slate-200 font-mono">{targetConflict?.detectedAt ? new Date(targetConflict.detectedAt).toLocaleDateString() : 'Apr 30, 2026'}</strong></span>
            </div>

            {/* Subtabs from reference: Overview, Timeline, Location, Impact, AI Assistant, History */}
            <div className="flex items-center gap-1 pt-2 border-t border-slate-800/80 text-xs overflow-x-auto">
              {(['overview', 'timeline', 'location', 'impact', 'ai', 'history'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setTimelineSubTab(tab);
                    if (tab === 'ai') setActiveSection('ai');
                    if (tab === 'location') setActiveSection('map');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize cursor-pointer transition-colors ${
                    timelineSubTab === tab
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab === 'ai' ? 'AI Assistant' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Project A Card, Project B Card, and Overlap Analysis Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: Project A */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  ◉ Project A
                </span>
                <span className="text-[11px] font-mono text-slate-400">{projectA?.projectCode}</span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">
                  {projectA?.title}
                </h3>
                <div className="text-xs text-cyan-400 font-medium mt-0.5">
                  {projectA?.department}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium text-slate-200">{projectA?.workCategory.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-mono text-slate-200">{projectA?.plannedStartDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End Date:</span>
                  <span className="font-mono text-slate-200">{projectA?.plannedEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800/60 uppercase">
                    {projectA?.status}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Budget:</span>
                  <span className="font-mono font-bold text-cyan-400">₹{projectA?.estimatedBudget.toFixed(1)} L</span>
                </div>
              </div>
            </div>

            {/* Card 2: Project B */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                  ◉ Project B
                </span>
                <span className="text-[11px] font-mono text-slate-400">{projectB?.projectCode}</span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">
                  {projectB?.title}
                </h3>
                <div className="text-xs text-blue-400 font-medium mt-0.5">
                  {projectB?.department}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-medium text-slate-200">{projectB?.workCategory.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Start Date:</span>
                  <span className="font-mono text-slate-200">{projectB?.plannedStartDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">End Date:</span>
                  <span className="font-mono text-slate-200">{projectB?.plannedEndDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase">
                    {projectB?.status}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Budget:</span>
                  <span className="font-mono font-bold text-blue-400">₹{projectB?.estimatedBudget.toFixed(1)} L</span>
                </div>
              </div>
            </div>

            {/* Card 3: Overlap Analysis Card */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="font-bold text-white text-sm">Overlap Analysis</h3>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Overlapping Days</span>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  {overlapDays} days
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {projectA?.plannedStartDate} – {projectB?.plannedEndDate}
                </span>
              </div>

              {/* Visual Gantt bars */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="truncate max-w-[130px]">{projectA?.projectCode}</span>
                    <span>{projectA?.plannedStartDate} – {projectA?.plannedEndDate}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute left-0 w-3/4 h-full bg-amber-500 rounded-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span className="truncate max-w-[130px]">{projectB?.projectCode}</span>
                    <span>{projectB?.plannedStartDate} – {projectB?.plannedEndDate}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full relative overflow-hidden">
                    <div className="absolute left-1/4 w-3/4 h-full bg-blue-500 rounded-full"></div>
                  </div>
                </div>

                {/* Overlap Highlight Bar */}
                <div className="pt-1">
                  <div className="w-full h-4 bg-slate-900 rounded-lg p-0.5 border border-red-500/40 relative">
                    <div className="absolute left-1/4 w-1/2 h-full bg-red-600 rounded flex items-center justify-center text-white font-bold text-[9px]">
                      Overlap ({overlapDays} days)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Evidence Grid: Detection Reason & Severity Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Detection Reason */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Detection Reason</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">Spatial Overlap</div>
                    <div className="text-[11px] text-slate-400">Geographic intersection on {targetConflict?.roadSegment}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Confidence: 95%
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">Schedule Overlap</div>
                    <div className="text-[11px] text-slate-400">{overlapDays} days collision window</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Confidence: 100%
                  </span>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-white">Infrastructure Conflict</div>
                    <div className="text-[11px] text-slate-400">{projectA?.workCategory.replace('_', ' ')} + {projectB?.workCategory.replace('_', ' ')}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[11px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">
                    Confidence: 90%
                  </span>
                </div>
              </div>
            </div>

            {/* Severity Explanation */}
            <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 space-y-3.5">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Severity Explanation</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-red-950/40 rounded-xl border border-red-900/60 text-slate-200 leading-relaxed">
                  <span className="font-bold text-red-300">▲ {targetConflict?.severity.toUpperCase()}:</span> Both projects occupy the {targetConflict?.roadSegment} carriageway during overlapping dates, creating destructive repeat-excavation risk.
                </div>

                <div className="space-y-1.5 text-slate-300 pl-1 font-medium text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Geographic intersection: <strong className="text-white">Yes ({targetConflict?.distanceMeters || 0}m proximity)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Overlapping days: <strong className="text-white">{overlapDays} days</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Departments: <strong className="text-white">{projectA?.department} & {projectB?.department}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>Impact Level: <strong className="text-white">High (arterial closure risk)</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setShowRealignModal(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Realignment Action</span>
                  </button>

                  <button
                    onClick={() => setShowOverrideModal(true)}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Log Override
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 4: AI COORDINATION RECOMMENDATION (PANEL 4 IN REF)     */}
      {/* ============================================================== */}
      {activeSection === 'ai' && (
        <div className="space-y-5">
          {/* Header with Gemini Badge & Refresh Button */}
          <div className="bg-[#10192e] p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  AI Coordination Assistant
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Intelligent recommendations grounded in verified project timelines and municipal engineering heuristics.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/80 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Powered by {aiSource}</span>
              </span>

              <button
                onClick={() => fetchAiCoordination(selectedConflict)}
                disabled={aiLoading}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${aiLoading ? 'animate-spin' : ''}`} />
                <span>Re-analyze</span>
              </button>
            </div>
          </div>

          {/* Loading state indicator */}
          {aiLoading && (
            <div className="p-8 bg-[#10192e] rounded-2xl border border-slate-800 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <div className="text-white font-bold text-sm">Evaluating Corridor Conflict with Gemini AI...</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Analyzing geotechnical excavation constraints, utility depth sequencing, and contractor milestone feasibility.
              </p>
            </div>
          )}

          {/* Left: Recommended Coordination Plan | Right: Suggested Coordination Details */}
          {!aiLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left Column (2 spans): Recommended Coordination Plan */}
              <div className="lg:col-span-2 bg-[#10192e] p-6 rounded-2xl border border-slate-800 space-y-5">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {aiPlan?.strategy || 'Recommended Coordination Plan'}
                  </span>
                </div>

                {/* Summary */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                    Summary
                  </span>
                  <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
                    {aiPlan?.summary ||
                      `The ${projectA?.title} and ${projectB?.title} projects overlap in both location and schedule for ${overlapDays} days. Coordinated planning is required to avoid repeated excavation and minimize disruption.`}
                  </p>
                </div>

                {/* Why Coordination is Needed */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Why Coordination is Needed</span>
                  </span>
                  <div className="space-y-1 text-slate-300 pl-2">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>Both projects require excavation along {targetConflict?.roadSegment}.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>Without coordination, freshly laid road surface will be excavated twice.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>
                        {aiPlan?.scheduleRecommendation ||
                          'This causes severe citizen disruption, doubling public expenditure.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Suggested Work Sequence */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Suggested Work Sequence</span>
                  </span>
                  <div className="space-y-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 text-slate-300">
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Execute underground utility trenching first (<strong>{projectB?.plannedStartDate} – {projectB?.plannedEndDate}</strong>).
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Conduct backfill soil compaction and hydrostatic pressure testing before pavement paving begins.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Proceed with complete asphalt resurfacing (<strong>{aiPlan?.recommendedDates?.projectA?.suggestedStart || 'Dec 12, 2026'}</strong> onward) across the compacted subgrade.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommended Next Steps */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recommended Next Steps & Mitigations</span>
                  </span>
                  <div className="space-y-1.5 text-slate-300 pl-2">
                    {aiPlan?.trafficImpactMitigation ? (
                      aiPlan.trafficImpactMitigation.map((m: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>{m}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Schedule a joint coordination meeting with {projectA?.department} and {projectB?.department}.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Conduct a site inspection to confirm exact work zones and underground alignment.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">✓</span>
                          <span>Finalize coordinated schedule and arterial traffic management plan.</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Suggested Coordination Details */}
              <div className="bg-[#10192e] p-6 rounded-2xl border border-slate-800 space-y-5">
                <h3 className="font-bold text-white text-sm">
                  Suggested Coordination Details
                </h3>

                {/* Responsible Departments */}
                <div className="space-y-1 text-xs">
                  <span className="text-slate-400 font-medium text-[11px]">Responsible Departments</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80">
                      {projectA?.department || 'Roads & Highways'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-800/80">
                      {projectB?.department || 'Water Supply'}
                    </span>
                  </div>
                </div>

                {/* Priority & Timeline */}
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Priority</span>
                    <span className="font-bold text-red-400 font-mono mt-0.5 block">▲ High</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Estimated Timeline</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">Within 7 days</span>
                  </div>
                </div>

                {/* Potential Risks & Assumptions */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
                  <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Potential Risks & Assumptions</span>
                  </span>
                  <div className="space-y-1 text-[11px] text-slate-400 pl-1">
                    <div>• Actual underground trenching geometry may vary if unmapped utility lines exist.</div>
                    <div>• Schedule adjustments may be required during monsoon rainfall conditions.</div>
                    <div>• Soil backfill settlement must be verified before surface milling begins.</div>
                  </div>
                </div>

                {/* Information Still Needed */}
                <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800">
                  <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Information Still Needed</span>
                  </span>
                  <div className="space-y-1 text-[11px] text-slate-400 pl-1">
                    <div>• Exact work zone boundaries from utility contractor.</div>
                    <div>• Confirmation of traffic police clearance for arterial diversion.</div>
                    <div>• Updated milestone progress from both engineering divisions.</div>
                  </div>
                </div>

                {/* Action Buttons: Generate Detailed Report & Apply */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleDownloadReport}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700 shadow-sm"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Generate Detailed Report</span>
                  </button>

                  <button
                    onClick={() => setShowRealignModal(true)}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Suggested Sequence</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: REALIGNMENT ENFORCEMENT CONFIRMATION                     */}
      {/* ============================================================== */}
      {showRealignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10192e] text-white rounded-2xl border border-slate-700 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Commit Municipal Schedule Realignment
                </h3>
                <p className="text-xs text-slate-400">
                  Enforce sequential execution order to protect newly laid road surfaces.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
              <div className="font-semibold text-white">Proposed Realignment:</div>
              <div>
                1. <strong>{projectB?.title}:</strong> {projectB?.plannedStartDate} – {projectB?.plannedEndDate} (Priority trenching)
              </div>
              <div>
                2. <strong>{projectA?.title}:</strong> Deferred post-pipeline completion.
              </div>
              <div className="text-emerald-400 font-semibold pt-1">
                ✓ Prevents road surface destruction and protects ₹{projectA?.estimatedBudget.toFixed(1)}L in capital investment.
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowRealignModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRealignment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Confirm Realignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: LOG JUSTIFIED CONCURRENT OVERRIDE                        */}
      {/* ============================================================== */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#10192e] text-white rounded-2xl border border-slate-700 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-950 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-lg">
                !
              </div>
              <div>
                <h3 className="font-extrabold text-base text-white">
                  Log Justified Concurrent Work (Override)
                </h3>
                <p className="text-xs text-slate-400">
                  Executive record for dual-agency excavation on distinct carriageway lanes.
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-300">
                Technical Justification & Traffic Mitigation Plan:
              </label>
              <textarea
                value={overrideRationale}
                onChange={(e) => setOverrideRationale(e.target.value)}
                placeholder="e.g., Water excavation restricted strictly to western service verge. Highways milling on eastern 4-lane carriageway with dual concrete median barricades."
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {overrideError && <p className="text-red-400 text-xs">{overrideError}</p>}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideRationale('');
                  setOverrideError(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOverride}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-lg"
              >
                Submit Executive Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
