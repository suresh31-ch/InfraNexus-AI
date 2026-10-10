import React, { useState } from 'react';
import { Project, CitizenReport, CitizenReportCategory, UserProfile } from '../../types';
import { dataStore } from '../../lib/dataStore';
import {
  MapPin,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Camera,
  Layers,
  Calendar,
  ExternalLink,
  Shield,
  HelpCircle,
  Phone,
  Building,
  Eye,
  FileText,
  X,
  AlertCircle,
} from 'lucide-react';

interface CitizenDashboardProps {
  projects: Project[];
  reports: CitizenReport[];
  currentUser?: UserProfile;
  initialTab?: 'overview' | 'my_reports' | 'file_report';
  onNavigateTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onReportSubmitted: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  projects,
  reports,
  currentUser,
  initialTab,
  onNavigateTab,
  onSelectProject,
  onReportSubmitted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'my_reports' | 'file_report'>(
    initialTab || 'overview'
  );

  // Sync activeSubTab if initialTab changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  // Report Submission Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CitizenReportCategory>('road_damage');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('12.8428');
  const [longitude, setLongitude] = useState('80.1538');
  const [reporterName, setReporterName] = useState(currentUser?.fullName || '');
  const [reporterContact, setReporterContact] = useState(currentUser?.email || '');
  const [mockPhotoName, setMockPhotoName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Search filter for public registry
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.roadSegment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDeptFilter === 'ALL' || p.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  // Citizen's own reports strictly isolated: only records submitted by or matching this user
  const myReports = reports.filter((r) => {
    if (!currentUser || currentUser.id === 'guest_citizen') {
      return r.referenceNo === 'CS-2026-7842';
    }
    // Match by Supabase User ID
    if (r.reporterUserId && r.reporterUserId === currentUser.id) return true;
    // Match by authenticated email / contact
    if (currentUser.email && r.reporterContact && r.reporterContact.toLowerCase() === currentUser.email.toLowerCase()) return true;
    // Match by full name
    if (currentUser.fullName && r.reporterName && r.reporterName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
    return false;
  });

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !landmark.trim()) {
      alert('Please fill in the report title, description, and street landmark.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const created = dataStore.addReport({
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: parseFloat(latitude) || 12.8420,
        longitude: parseFloat(longitude) || 80.1530,
        landmark: landmark.trim(),
        imageUrl: mockPhotoName ? `https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop` : undefined,
        reporterName: reporterName.trim() || currentUser?.fullName || 'Resident Citizen',
        reporterContact: reporterContact.trim() || currentUser?.email,
        reporterUserId: currentUser?.id,
      });

      setIsSubmitting(false);
      setSubmissionSuccess(created.referenceNo);
      setTitle('');
      setDescription('');
      setLandmark('');
      setMockPhotoName(null);
      onReportSubmitted();
    }, 600);
  };

  const activeClosures = [
    {
      corridor: 'Grand Southern Trunk (GST) Road - Tambaram Corridor',
      type: 'Trenching & Bitumen Milling',
      department: 'Highways & Water Board Joint Corridor',
      duration: 'Oct 18, 2026 → Dec 10, 2026',
      impact: '1 Lane Closed in Each Direction',
      detour: 'Heavy vehicles diverted via Tambaram Eastern Bypass Road',
      severity: 'high',
    },
    {
      corridor: 'Vandalur-Kelambakkam Arterial Road',
      type: 'Stormwater Culvert Construction',
      department: 'City Municipal Corporation',
      duration: 'Nov 01, 2026 → Dec 20, 2026',
      impact: 'Shoulder obstruction; speed restricted to 20 km/h',
      detour: 'Light transit maintained on dual carriageway',
      severity: 'moderate',
    },
    {
      corridor: 'Old Mahabalipuram Road (OMR) Expressway',
      type: 'Micro-Trenching Conduit Laying',
      department: 'Optical Fiber & Telecom',
      duration: 'Sep 10, 2026 → Oct 30, 2026',
      impact: 'Night work only (10 PM to 5 AM)',
      detour: 'Daytime service road open normally',
      severity: 'low',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Citizen Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Public Citizen Portal
            </span>
            <span className="text-xs text-slate-300">Ward 14 • South Chennai & Tambaram Corridor</span>
            {currentUser?.fullName && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-teal-200 border border-teal-400/20">
                Welcome, {currentUser.fullName}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Transparent Infrastructure for Every Resident
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Track active municipal roadworks, inspect upcoming pipeline or drainage projects in your neighborhood, and report repeat road-cutting problems directly to municipal engineers.
          </p>

          <div className="pt-2 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                activeSubTab === 'overview'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Public Works Overview
            </button>
            <button
              onClick={() => setActiveSubTab('my_reports')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'my_reports'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>My Reports & Tracking</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900/60 text-[10px] font-mono">
                {myReports.length}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('file_report')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'file_report'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-teal-600/80 text-white hover:bg-teal-600'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Report Road Issue</span>
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: PUBLIC WORKS & DISRUPTIONS OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Corridor Alert Bar */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-900 block font-bold">
                  Active Traffic Coordination Advisory: Grand Southern Trunk (GST) Road
                </strong>
                <span className="text-amber-800">
                  Potable water feeder trenching is scheduled before full road resurfacing. Expect single-lane diversions near Tambaram Sanatorium.
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              View on Map
            </button>
          </div>

          {/* Active Road Closures & Planned Disruptions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-teal-700" />
                Active Road Closures & Planned Disruptions
              </h2>
              <span className="text-xs text-slate-500 font-mono">Updated Real-Time</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeClosures.map((closure, idx) => (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        closure.severity === 'high'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : closure.severity === 'moderate'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                      }`}
                    >
                      {closure.type}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">#DIS-{101 + idx}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-xs line-clamp-1">
                    {closure.corridor}
                  </h3>

                  <div className="text-[11px] space-y-1 text-slate-600">
                    <div>
                      <strong className="text-slate-800">Agency:</strong> {closure.department}
                    </div>
                    <div>
                      <strong className="text-slate-800">Timeline:</strong> {closure.duration}
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-700 font-medium">
                      ⚠️ {closure.impact}
                    </div>
                    <div className="text-[10px] text-slate-500 italic pt-1">
                      Detour: {closure.detour}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Map Teaser Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-left">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                Geographic Work Registry
              </span>
              <h3 className="text-base font-extrabold text-slate-900">
                Explore All 7 Municipal Work Zones on Leaflet Map
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl">
                Inspect high-precision work zone radii, underground trenching corridors, road closure detour boundaries, and citizen problem clusters across Kancheepuram & Chennai.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('map')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shadow-xs flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-teal-400" />
              <span>Open Interactive Map</span>
            </button>
          </div>

          {/* Searchable Public Project Registry */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Searchable Public Project Registry ({filteredProjects.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Public municipal infrastructure contracts, timeline schedules, and executing departments.
                </p>
              </div>

              {/* Department Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto max-w-full text-xs">
                {['ALL', 'Highways & Road Infrastructure', 'Water Supply & Sewage Board', 'City Municipal Corporation'].map(
                  (dept) => (
                    <button
                      key={dept}
                      onClick={() => setSelectedDeptFilter(dept)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        selectedDeptFilter === dept
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {dept === 'ALL' ? 'All Agencies' : dept.split(' ')[0]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by road name, ward, project code (e.g. HW-2026-089), or title..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
              />
            </div>

            {/* Project List Cards */}
            <div className="divide-y divide-slate-100">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg p-2 transition-colors"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                        {project.projectCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          project.status === 'in_progress'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : project.status === 'delayed'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-teal-700 font-semibold">
                        {project.department}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{project.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-1">{project.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {project.roadSegment}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {project.plannedStartDate} → {project.plannedEndDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Progress
                      </span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {project.progressPercentage}%
                      </span>
                      <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-teal-600 h-full rounded-full"
                          style={{ width: `${project.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectProject(project)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      View Specs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Citizen Helpline & Public Support */}
          <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-teal-700" />
              <span>
                <strong>Municipal Toll-Free Grievance Helpline:</strong> 1800-425-1334 (Mon-Sat 8 AM - 8 PM)
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Emergency Road Hazard WhatsApp: +91 94451 90000
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MY REPORTS & TRACKING */}
      {activeSubTab === 'my_reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                My Filed Infrastructure Grievances ({myReports.length})
              </h2>
              <p className="text-xs text-slate-500">
                Track real-time progress updates, department work orders, and resolution confirmation for issues you reported.
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('file_report')}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
            >
              + File New Report
            </button>
          </div>

          {myReports.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-3">
              <FileText className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-700">No personal reports filed yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have not submitted any infrastructure grievances under this account. As an authorized citizen, you can only track reports submitted by you.
              </p>
              <button
                onClick={() => setActiveSubTab('file_report')}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Road Issue Report</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-900 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded">
                          {report.referenceNo}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                            report.status === 'scheduled_for_work'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : report.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{report.title}</h3>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 font-mono">
                      Filed on {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {report.description}
                  </p>

                  <div className="text-xs space-y-1 text-slate-600">
                    <div>
                      <strong className="text-slate-800">Location Landmark:</strong> {report.landmark}
                    </div>
                    {report.departmentAssigned && (
                      <div>
                        <strong className="text-slate-800">Assigned Department:</strong>{' '}
                        <span className="text-teal-700 font-semibold">{report.departmentAssigned}</span>
                      </div>
                    )}
                  </div>

                  {/* 5-Step Visual Progress Stepper */}
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Municipal Remediation Tracker
                    </div>
                    <div className="grid grid-cols-5 gap-1 text-center font-sans">
                      {[
                        { step: 1, label: 'Submitted' },
                        { step: 2, label: 'Geotag Verified' },
                        { step: 3, label: 'Sub-Division Assigned' },
                        { step: 4, label: 'Work Dispatched' },
                        { step: 5, label: 'Resolved & Restored' },
                      ].map((s) => {
                        const current = report.currentStep || 3;
                        const isDone = s.step <= current;
                        return (
                          <div key={s.step} className="space-y-1">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone ? 'bg-teal-600' : 'bg-slate-200'
                              }`}
                            />
                            <span
                              className={`text-[9px] block ${
                                isDone ? 'text-teal-800 font-bold' : 'text-slate-400'
                              }`}
                            >
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Authorized Progress Updates for Citizen */}
                  {report.internalNotes && (
                    <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-950 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-teal-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Official Department Action Update:
                      </div>
                      <p className="text-[11px] leading-relaxed text-teal-900">
                        {report.internalNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: REPORT SUBMISSION FORM */}
      {activeSubTab === 'file_report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-teal-700" />
              Report Infrastructure Problem or Road Cutting
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Submissions are geotagged and automatically evaluated by the coordination engine for duplicate or uncoordinated utility cuts.
            </p>
          </div>

          {submissionSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Grievance Successfully Registered!
              </div>
              <p>
                Your unique reference ID is{' '}
                <strong className="font-mono text-emerald-900 text-sm bg-emerald-100 px-2 py-0.5 rounded">
                  {submissionSuccess}
                </strong>
                . You can monitor the remediation workflow under "My Reports & Tracking".
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setActiveSubTab('my_reports');
                  }}
                  className="px-3 py-1 bg-emerald-700 text-white rounded text-[11px] font-semibold cursor-pointer"
                >
                  View in My Reports
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Issue Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CitizenReportCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="road_damage">Road Damage & Severe Pothole Cluster</option>
                <option value="repeated_excavation">Repeated Excavation / Fresh Asphalt Dug Up</option>
                <option value="unsafe_excavation">Unsafe Open Trench without Caution Blinkers</option>
                <option value="drainage_issues">Drainage Culvert Collapse / Waterlogging</option>
                <option value="stalled_work">Stalled Work / Abandoned Utility Excavation</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Issue Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fresh bitumen excavated for water line near bus stop"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Detailed Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what occurred, hazards for two-wheelers, whether warning barricades are present..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Street Landmark *</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. GST Road opposite Chromepet Bus Depot"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  GPS Coordinates (Lat / Lon)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="12.8428"
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="80.1538"
                    className="w-1/2 px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Optional Photo Attachment */}
            <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-300 space-y-2">
              <span className="font-bold text-slate-700 block">
                Attach Site Photograph (Optional for faster verification)
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMockPhotoName('site_photo_gst_trench.jpg')}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-600" />
                  <span>{mockPhotoName ? 'Photo Attached ✓' : 'Upload Geo-tagged Photo'}</span>
                </button>
                {mockPhotoName && (
                  <span className="text-[11px] font-mono text-emerald-700">
                    {mockPhotoName} (2.4 MB)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Reporter Name</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
              <div>
                <label className="font-bold text-slate-800 block mb-1">Mobile Contact</label>
                <input
                  type="text"
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab('overview')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Registering...' : 'Submit Grievance to Registry'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
