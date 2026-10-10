import React, { useState } from 'react';
import { CitizenReport, CitizenReportCategory, Department } from '../types';
import { dataStore } from '../lib/dataStore';
import {
  AlertCircle,
  CheckCircle2,
  Search,
  Camera,
  Send,
  MapPin,
  Sparkles,
  Shield,
  Clock,
  Crosshair,
  UploadCloud,
  FileText,
  ChevronRight,
  RefreshCw,
  Edit3,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';

interface CitizenReportingViewProps {
  reports: CitizenReport[];
  onReportSubmitted: () => void;
}

interface AiAnalysisResult {
  category: CitizenReportCategory;
  suggestedTitle: string;
  suggestedDescription: string;
  suggestedDepartment: Department;
  severity: 'critical' | 'high' | 'medium' | 'low';
  severityReason: string;
  publicSafetyConcern: string;
  keywords: string[];
  missingDetailsSuggestion?: string;
  source?: string;
}

export const CitizenReportingView: React.FC<CitizenReportingViewProps> = ({
  reports,
  onReportSubmitted,
}) => {
  const currentUser = dataStore.getCurrentUser();

  // Citizen raw input state
  const [rawText, setRawText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Geo coordinates
  const [lat, setLat] = useState<number>(12.8428);
  const [lng, setLng] = useState<number>(80.1538);
  const [landmark, setLandmark] = useState('GST Road near Tambaram Sanatorium Bus Stop');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // AI Assistant Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [reviewMode, setReviewMode] = useState(false);

  // Review / Edited fields before submission
  const [reviewedTitle, setReviewedTitle] = useState('');
  const [reviewedCategory, setReviewedCategory] = useState<CitizenReportCategory>('repeated_excavation');
  const [reviewedDepartment, setReviewedDepartment] = useState<Department>('Highways & Road Infrastructure');
  const [reviewedDescription, setReviewedDescription] = useState('');
  const [reporterName, setReporterName] = useState(
    currentUser.fullName && currentUser.fullName !== 'Public Visitor' ? currentUser.fullName : ''
  );
  const [reporterContact, setReporterContact] = useState(currentUser.email || '');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRefId, setGeneratedRefId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Right Panel: Tracker
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');

  const selectedReport =
    reports.find((r) => r.id === selectedReportId) ||
    reports.find((r) => r.referenceNo.toUpperCase() === searchQuery.trim().toUpperCase()) ||
    reports[0];

  // Geolocation detector
  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLandmark(
            `GST Road Corridor (${position.coords.latitude.toFixed(4)}° N, ${position.coords.longitude.toFixed(4)}° E)`
          );
          setIsDetectingLocation(false);
        },
        () => {
          setLat(12.8428);
          setLng(80.1538);
          setLandmark('GST Road, Tambaram Sanatorium (12.8428° N, 80.1538° E)');
          setIsDetectingLocation(false);
        },
        { timeout: 5000 }
      );
    } else {
      setLandmark('GST Road, Tambaram Sanatorium (12.8428° N, 80.1538° E)');
      setIsDetectingLocation(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image exceeds 5MB size limit.');
      return;
    }
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Assistant Classification on Complaint Input & Image
  const handleAnalyzeWithAi = async () => {
    if (!rawText.trim() && !photoPreview) {
      setFormError('Please enter a description or upload a photo of the infrastructure issue.');
      return;
    }

    setIsAnalyzing(true);
    setFormError(null);

    try {
      const res = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput: rawText.trim(),
          imageData: photoPreview,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: AiAnalysisResult = await res.json();

      setAiResult(data);
      setReviewedTitle(data.suggestedTitle || rawText.slice(0, 50));
      setReviewedCategory(data.category || 'repeated_excavation');
      setReviewedDepartment(data.suggestedDepartment || 'Highways & Road Infrastructure');
      setReviewedDescription(data.suggestedDescription || rawText);
      setReviewMode(true);
    } catch (err: any) {
      console.warn('AI analysis fallback', err);
      // Fallback structured result
      const fallbackResult: AiAnalysisResult = {
        category: rawText.toLowerCase().includes('water') ? 'repeated_excavation' : 'road_damage',
        suggestedTitle: rawText.slice(0, 50) || 'Civic Infrastructure Complaint',
        suggestedDescription: rawText,
        suggestedDepartment: rawText.toLowerCase().includes('water')
          ? 'Water Supply & Sewage Board'
          : 'Highways & Road Infrastructure',
        severity: 'high',
        severityReason: 'Heuristic evaluation based on traffic safety and carriageway obstruction rules.',
        publicSafetyConcern: 'Potential skid or fall hazard for two-wheelers and pedestrians.',
        keywords: ['infrastructure', 'roadworks'],
        missingDetailsSuggestion: 'Confirm nearest landmark and traffic direction.',
      };
      setAiResult(fallbackResult);
      setReviewedTitle(fallbackResult.suggestedTitle);
      setReviewedCategory(fallbackResult.category);
      setReviewedDepartment(fallbackResult.suggestedDepartment);
      setReviewedDescription(fallbackResult.suggestedDescription);
      setReviewMode(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Confirmed Submission by Citizen
  const handleConfirmSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewedTitle.trim() || !reviewedDescription.trim() || !landmark.trim()) {
      setFormError('Please ensure Title, Description, and Landmark are provided.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const newReport = dataStore.addReport({
      title: reviewedTitle.trim(),
      description: reviewedDescription.trim(),
      category: reviewedCategory,
      latitude: lat,
      longitude: lng,
      landmark: landmark.trim(),
      reporterName: reporterName.trim() || 'Civic Resident',
      reporterContact: reporterContact.trim(),
      imageUrl: photoPreview || undefined,
      departmentAssigned: reviewedDepartment,
    });

    setGeneratedRefId(newReport.referenceNo);
    setSelectedReportId(newReport.id);
    setIsSubmitting(false);
    setReviewMode(false);
    setAiResult(null);
    setRawText('');
    setPhotoPreview(null);
    setPhotoName(null);

    onReportSubmitted();
  };

  const getTimelineSteps = (report?: CitizenReport) => {
    const current = report?.currentStep || 2;
    return [
      {
        step: 1,
        title: 'Step 1: Submitted',
        date: report ? new Date(report.createdAt).toLocaleDateString() : 'Oct 08',
        desc: 'Civic grievance registered on public ledger with photo evidence.',
        active: current >= 1,
        completed: current > 1,
      },
      {
        step: 2,
        title: 'Step 2: Geotag Verified',
        date: 'GPS Locked',
        desc: 'Cross-referenced against active zonal right-of-way coordinate buffer.',
        active: current >= 2,
        completed: current > 2,
      },
      {
        step: 3,
        title: 'Step 3: Assigned to Highways Sub-division',
        date: 'Dispatched',
        desc: `Work order dispatched to ${report?.departmentAssigned || 'Highways Department'}.`,
        active: current >= 3,
        completed: current > 3,
      },
      {
        step: 4,
        title: 'Step 4: Remediation in Progress',
        date: 'On-Site',
        desc: report?.internalNotes || 'Field inspection crew active on carriageway.',
        active: current >= 4,
        completed: current >= 4,
      },
    ];
  };

  const timelineSteps = getTimelineSteps(selectedReport);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/10 text-teal-700 border border-teal-500/20 font-mono">
              AI CITIZEN COMPLAINT ASSISTANT
            </span>
            <span className="text-xs text-slate-500">Gemini-Powered Triage & Human Review</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 mt-1">
            Citizen Grievance & Incident Tracking Portal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Describe a road hazard, upload photographic evidence, review AI classification, and file a verified public grievance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-semibold">
            {reports.length} Verified Incidents on Ledger
          </span>
        </div>
      </div>

      {/* Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Panel: Complaint Input & Review Form (6 Cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              {reviewMode ? 'Review & Confirm Complaint' : 'Describe Infrastructure Hazard'}
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              {reviewMode ? 'HUMAN CONFIRMATION' : 'STEP 1 OF 2'}
            </span>
          </div>

          {generatedRefId && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 text-xs text-emerald-950">
              <div className="font-bold flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Grievance Registered Successfully!
              </div>
              <p>
                Your public incident tracking ID is:{' '}
                <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 text-sm">
                  {generatedRefId}
                </strong>
              </p>
              <div className="text-[11px] text-emerald-700">
                Track status in real-time in the Citizen Incident Tracker on the right panel.
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {!reviewMode ? (
            /* STEP 1: Citizen Input Form */
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Describe the Issue in Plain Language *
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="e.g. A newly paved road near Tambaram Sanatorium was dug up today with deep open trenches by the water board, leaving sharp rubble and no warning lights..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-white text-xs leading-relaxed"
                />
              </div>

              {/* Photo Upload Zone */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  On-Site Photograph Evidence (Drag & Drop or Browse)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/50'
                      : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  {photoPreview ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={photoPreview}
                        alt="Thumbnail Preview"
                        className="w-20 h-14 object-cover rounded-lg border border-slate-300 shadow-2xs"
                      />
                      <div className="text-left text-xs">
                        <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                          {photoName || 'Captured_Evidence.jpg'}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoName(null);
                          }}
                          className="text-[11px] text-red-600 hover:underline cursor-pointer"
                        >
                          Remove Photograph
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-1">
                      <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                      <div className="text-xs text-slate-600">
                        Drag image here or{' '}
                        <label className="text-teal-700 font-bold hover:underline cursor-pointer">
                          browse files
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileInput}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <div className="text-[10px] text-slate-400">JPG, PNG, WebP up to 5MB</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">
                    Road Corridor / Landmark *
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-teal-600" />
                    {isDetectingLocation ? 'Acquiring GPS...' : 'Detect GPS Location'}
                  </button>
                </div>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-white"
                />
              </div>

              {/* Analyze Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleAnalyzeWithAi}
                  disabled={isAnalyzing || (!rawText.trim() && !photoPreview)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Classifying with Gemini Assistant...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Analyze & Structure with AI Assistant</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Human Review & Edit Screen */
            <form onSubmit={handleConfirmSubmission} className="space-y-4 text-xs">
              {/* AI Suggestion Banner */}
              <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                    AI Assistant Suggestion
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold">
                    Severity: {aiResult?.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-900">{aiResult?.severityReason}</p>
                {aiResult?.publicSafetyConcern && (
                  <div className="text-[11px] text-red-700 font-medium">
                    ⚠️ Safety Note: {aiResult.publicSafetyConcern}
                  </div>
                )}
              </div>

              {/* Editable Title */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Editable Grievance Title *
                </label>
                <input
                  type="text"
                  required
                  value={reviewedTitle}
                  onChange={(e) => setReviewedTitle(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>

              {/* Editable Category & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Grievance Category *
                  </label>
                  <select
                    value={reviewedCategory}
                    onChange={(e) => setReviewedCategory(e.target.value as CitizenReportCategory)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="road_damage">Road Damage / Pothole</option>
                    <option value="repeated_excavation">Repeated Excavation</option>
                    <option value="unsafe_excavation">Unsafe Excavation</option>
                    <option value="drainage_issues">Drainage Issues</option>
                    <option value="stalled_work">Stalled Work</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-800 block mb-1">
                    Assigned Department *
                  </label>
                  <select
                    value={reviewedDepartment}
                    onChange={(e) => setReviewedDepartment(e.target.value as Department)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-800"
                  >
                    <option value="Highways & Road Infrastructure">Highways & Road Infrastructure</option>
                    <option value="Water Supply & Sewage Board">Water Supply & Sewage Board</option>
                    <option value="City Municipal Corporation">City Municipal Corporation</option>
                    <option value="Electricity & Power Utilities">Electricity & Power Utilities</option>
                    <option value="Optical Fiber & Telecom">Optical Fiber & Telecom</option>
                  </select>
                </div>
              </div>

              {/* Editable Description */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Polished Description (Editable) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewedDescription}
                  onChange={(e) => setReviewedDescription(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 bg-white leading-relaxed text-xs"
                />
              </div>

              {/* Reporter Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Your Full Name</label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Resident Name"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-800 block mb-1">Contact Email/Phone</label>
                  <input
                    type="text"
                    value={reporterContact}
                    onChange={(e) => setReporterContact(e.target.value)}
                    placeholder="contact@citizen.gov"
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setReviewMode(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Back to Edit
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting Report...' : 'Confirm & Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Panel: Citizen Incident Tracker & Public Log (6 Cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <label className="font-bold text-xs text-slate-800 block">
              Citizen Incident Tracker
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Reference ID (e.g., CS-2026-3104)"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const found = reports.find(
                    (r) => r.referenceNo.toUpperCase() === searchQuery.trim().toUpperCase()
                  );
                  if (found) setSelectedReportId(found.id);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs"
              >
                Track
              </button>
            </div>
          </div>

          {/* Active Incident Vertical Timeline Tracker */}
          {selectedReport && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    {selectedReport.referenceNo}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">
                    {selectedReport.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    📍 {selectedReport.landmark}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-800 border border-slate-200">
                  {selectedReport.status.replace('_', ' ')}
                </span>
              </div>

              {/* Vertical Timeline */}
              <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {timelineSteps.map((step) => (
                  <div key={step.step} className="relative space-y-1">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        step.completed
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : step.active
                          ? 'border-amber-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {step.completed && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>{step.title}</span>
                      <span className="font-mono text-[10px] text-slate-400 font-normal">{step.date}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Grievances List */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="font-bold text-xs text-slate-800">
              Recent Grievances On Public Ledger ({reports.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReportId(r.id)}
                  className={`py-2 px-1 text-xs cursor-pointer rounded transition-colors flex items-center justify-between ${
                    selectedReport?.id === r.id ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate max-w-[240px]">
                    <span className="font-mono text-[10px] text-slate-500 mr-2">{r.referenceNo}</span>
                    <span>{r.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono capitalize shrink-0">
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
