import React, { useState, useEffect, useRef } from 'react';
import { Project, CitizenReport, ProjectConflict } from '../types';
import { loadGoogleMapsScript, getGoogleMapsApiKey } from '../lib/googleMapsLoader';
import {
  Layers,
  AlertTriangle,
  Info,
  MapPin,
  Eye,
  ExternalLink,
  Sparkles,
  Navigation,
  Compass,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ShieldAlert,
  Search,
  CheckCircle2,
  Calendar,
  X
} from 'lucide-react';

interface InfrastructureMapProps {
  projects: Project[];
  reports: CitizenReport[];
  conflicts: ProjectConflict[];
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
  onOpenInConflictCenter?: (conflict: ProjectConflict) => void;
}

export const InfrastructureMap: React.FC<InfrastructureMapProps> = ({
  projects,
  reports,
  conflicts,
  onSelectProject,
  onSelectConflict,
  onOpenInConflictCenter,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter states
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [highlightOverlapsOnly, setHighlightOverlapsOnly] = useState<boolean>(false);
  const [showReports, setShowReports] = useState<boolean>(true);
  const [activeCorridor, setActiveCorridor] = useState<string>('all');
  const [selectedMapProject, setSelectedMapProject] = useState<Project | null>(projects[0] || null);

  // Search query in sidebar
  const [searchFilter, setSearchFilter] = useState('');

  const apiKey = getGoogleMapsApiKey();

  // Load Google Maps API
  useEffect(() => {
    let isMounted = true;
    if (!apiKey) {
      setMapError('Google Maps API Key not configured. Please supply VITE_GOOGLE_MAPS_API_KEY.');
      return;
    }

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted) return;
        if (!mapContainerRef.current) return;

        // Initialize Google Map with mandatory attribution ID
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 12.8400, lng: 80.1550 }, // Chennai South Corridor / Tambaram anchor
          zoom: 13,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          zoomControl: true,
          // Mandatory setting from Google Maps Platform agent guidelines
          // @ts-ignore
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
          styles: [
            {
              featureType: 'administrative',
              elementType: 'geometry',
              stylers: [{ visibility: 'simplified' }],
            },
            {
              featureType: 'poi',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      })
      .catch((err) => {
        if (isMounted) {
          setMapError(`Unable to initialize Google Maps: ${err.message}`);
        }
      });

    return () => {
      isMounted = false;
      // Clean up markers
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, [apiKey]);

  // Corridor jump handler
  const handleCorridorJump = (corridorKey: string, center: { lat: number; lng: number }, zoom: number) => {
    setActiveCorridor(corridorKey);
    if (!mapInstanceRef.current) return;

    if (corridorKey === 'all') {
      const bounds = new google.maps.LatLngBounds();
      projects.forEach((p) => {
        if (p.latitude && p.longitude) {
          bounds.extend(new google.maps.LatLng(p.latitude, p.longitude));
        }
      });
      mapInstanceRef.current.fitBounds(bounds);
    } else {
      mapInstanceRef.current.panTo(center);
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((proj) => {
    if (selectedDept !== 'all' && proj.department !== selectedDept) return false;
    if (selectedCategory !== 'all' && proj.workCategory !== selectedCategory) return false;
    if (selectedStatus !== 'all' && proj.status !== selectedStatus) return false;

    const isConflicted = conflicts.some(
      (c) => c.status !== 'dismissed' && (c.projectAId === proj.id || c.projectBId === proj.id)
    );
    if (highlightOverlapsOnly && !isConflicted) return false;

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchText = `${proj.projectCode} ${proj.title} ${proj.roadSegment} ${proj.contractor}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  // Render Markers and Overlays onto Google Maps
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoaded) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    circlesRef.current.forEach((c) => c.setMap(null));
    markersRef.current = [];
    circlesRef.current = [];

    // Add project markers
    filteredProjects.forEach((proj) => {
      if (!proj.latitude || !proj.longitude) return;

      const activeConflict = conflicts.find(
        (c) => c.status !== 'dismissed' && (c.projectAId === proj.id || c.projectBId === proj.id)
      );
      const isConflicted = Boolean(activeConflict);

      // Category color determination
      let pinColor = '#0F172A';
      if (proj.workCategory === 'road_resurfacing') pinColor = '#D97706'; // Amber
      else if (proj.workCategory === 'water_pipeline') pinColor = '#0D9488'; // Cyan/Teal
      else if (proj.workCategory === 'drainage') pinColor = '#059669'; // Emerald
      else if (proj.workCategory === 'power_grid') pinColor = '#7C3AED'; // Violet
      else if (proj.workCategory === 'telecom_duct') pinColor = '#0284C7'; // Sky Blue

      // Work zone buffer circle
      const circle = new google.maps.Circle({
        strokeColor: isConflicted ? '#DC2626' : pinColor,
        strokeOpacity: 0.8,
        strokeWeight: isConflicted ? 2.5 : 1.5,
        fillColor: isConflicted ? '#EF4444' : pinColor,
        fillOpacity: isConflicted ? 0.22 : 0.1,
        map,
        center: { lat: proj.latitude, lng: proj.longitude },
        radius: proj.workZoneRadiusMeters || 220,
      });
      circlesRef.current.push(circle);

      // SVG Pin icon with dynamic color and alert badge
      const markerIcon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        fillColor: isConflicted ? '#DC2626' : pinColor,
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: isConflicted ? 7.5 : 6.5,
      };

      const marker = new google.maps.Marker({
        position: { lat: proj.latitude, lng: proj.longitude },
        map,
        title: `${proj.projectCode} - ${proj.title}`,
        icon: markerIcon,
        zIndex: isConflicted ? 100 : 10,
        // @ts-ignore
        internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
      });

      // InfoWindow with rich project details
      const infoContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; max-width: 280px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-family: monospace; font-weight: 700; color: #0F172A; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; border: 1px solid #CBD5E1;">
              ${proj.projectCode}
            </span>
            <span style="font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 9999px; background: #EEF2FF; color: #4338CA;">
              ${proj.status.toUpperCase()} (${proj.progressPercentage}%)
            </span>
          </div>
          <div style="font-weight: 700; font-size: 13px; color: #0F172A; line-height: 1.3; margin-bottom: 6px;">
            ${proj.title}
          </div>
          <div style="color: #475569; font-size: 11px; margin-bottom: 6px;">
            <div><strong>Department:</strong> ${proj.department}</div>
            <div><strong>Corridor:</strong> ${proj.roadSegment}</div>
            <div><strong>Window:</strong> ${proj.plannedStartDate} → ${proj.plannedEndDate}</div>
            <div><strong>Budget:</strong> ₹${proj.estimatedBudget.toFixed(1)} Lakhs</div>
          </div>
          ${
            isConflicted
              ? `<div style="background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; margin-bottom: 6px;">
                  ⚠️ Active Right-of-Way Clash (${activeConflict?.severity.toUpperCase()})
                </div>`
              : ''
          }
          <div style="display: flex; gap: 4px; margin-top: 6px;">
            <button id="infowindow-btn-${proj.id}" style="flex: 1; background: #0F172A; color: #FFFFFF; border: none; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">
              Open Project Details
            </button>
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({
        content: infoContent,
      });

      marker.addListener('click', () => {
        setSelectedMapProject(proj);
        infoWindow.open(map, marker);

        setTimeout(() => {
          const btn = document.getElementById(`infowindow-btn-${proj.id}`);
          if (btn) {
            btn.onclick = () => onSelectProject(proj);
          }
        }, 150);
      });

      markersRef.current.push(marker);
    });

    // Add citizen grievance markers if enabled
    if (showReports) {
      reports.forEach((rep) => {
        if (!rep.latitude || !rep.longitude) return;
        if (rep.status === 'resolved' || rep.status === 'dismissed') return;

        const reportMarker = new google.maps.Marker({
          position: { lat: rep.latitude, lng: rep.longitude },
          map,
          title: `Grievance: ${rep.referenceNo}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#EF4444',
            fillOpacity: 0.9,
            strokeWeight: 1.5,
            strokeColor: '#FFFFFF',
            scale: 5,
          },
          zIndex: 50,
          // @ts-ignore
          internalUsageAttributionIds: ['gmp_git_agentskills_v1'],
        });

        const repInfo = new google.maps.InfoWindow({
          content: `
            <div style="font-family: -apple-system, sans-serif; font-size: 11px; max-width: 220px; padding: 2px;">
              <strong style="color: #DC2626;">Citizen Grievance #${rep.referenceNo}</strong>
              <div style="font-weight: 600; margin: 3px 0;">${rep.title}</div>
              <div style="color: #64748B;">${rep.landmark}</div>
              <div style="color: #0F172A; margin-top: 3px; font-weight: 500;">Status: ${rep.status.toUpperCase()}</div>
            </div>
          `,
        });

        reportMarker.addListener('click', () => {
          repInfo.open(map, reportMarker);
        });

        markersRef.current.push(reportMarker);
      });
    }
  }, [filteredProjects, conflicts, reports, showReports, mapLoaded]);

  return (
    <div className="space-y-4">
      {/* Top Banner & Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                GOOGLE MAPS PLATFORM
              </span>
              <span className="text-xs text-slate-400">Live Spatial Coordination Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
              Municipal Infrastructure GIS Map
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Interactive 2D spatial right-of-way telemetry displaying 7 major metropolitan public infrastructure works, verified work zone buffer zones, and active inter-agency clashes.
            </p>
          </div>

          {/* Quick corridor jump presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Corridors:
            </span>
            <button
              onClick={() => handleCorridorJump('all', { lat: 12.8400, lng: 80.1550 }, 13)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeCorridor === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              All Zones
            </button>
            <button
              onClick={() => handleCorridorJump('gst', { lat: 12.8425, lng: 80.1535 }, 15)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeCorridor === 'gst'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              GST Road (Clash Zone)
            </button>
            <button
              onClick={() => handleCorridorJump('vk', { lat: 12.8375, lng: 80.1575 }, 15)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeCorridor === 'vk'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Vandalur-Kelambakkam
            </button>
            <button
              onClick={() => handleCorridorJump('kanchi', { lat: 12.8342, lng: 79.7036 }, 15)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeCorridor === 'kanchi'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Kancheepuram Core
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Department dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="all">All Departments</option>
                <option value="Highways & Road Infrastructure">Highways & Roads</option>
                <option value="Water Supply & Sewage Board">Water & Sewage</option>
                <option value="City Municipal Corporation">Municipal Corporation</option>
                <option value="Electricity & Power Utilities">Electricity Utilities</option>
                <option value="Optical Fiber & Telecom">Optical Fiber Telecom</option>
              </select>
            </div>

            {/* Category dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="all">All Categories</option>
                <option value="road_resurfacing">Road Resurfacing</option>
                <option value="water_pipeline">Water Pipeline</option>
                <option value="drainage">Stormwater Drainage</option>
                <option value="power_grid">Power Grid</option>
                <option value="telecom_duct">Telecom Duct</option>
              </select>
            </div>

            {/* Status dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="delayed">Delayed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle conflicts only */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={highlightOverlapsOnly}
                onChange={(e) => setHighlightOverlapsOnly(e.target.checked)}
                className="rounded border-slate-700 text-red-500 focus:ring-red-400"
              />
              <span className="font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Show Clashes Only
              </span>
            </label>

            {/* Toggle citizen reports */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={showReports}
                onChange={(e) => setShowReports(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
              />
              <span>Show Citizen Grievance Pins</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Map + Synchronized Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Map Container (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col relative min-h-[560px]">
          {mapError ? (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Google Maps Configuration Required</h3>
              <p className="text-xs text-slate-400 max-w-md">{mapError}</p>
              <div className="p-3 bg-slate-800/80 rounded-xl text-left font-mono text-[11px] text-slate-300 max-w-lg border border-slate-700">
                1. Ensure <code>VITE_GOOGLE_MAPS_API_KEY</code> is added.<br />
                2. In Google Cloud Console, enable "Maps JavaScript API".<br />
                3. Allow HTTP referrer origins for this application domain.
              </div>
            </div>
          ) : (
            <div ref={mapContainerRef} className="w-full h-full min-h-[560px] flex-1" />
          )}

          {/* Map Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 shadow-2xl pointer-events-auto max-w-xs space-y-1.5 z-10">
            <div className="font-bold text-white text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Map Legend
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Road Resurfacing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                <span>Water Pipeline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Storm Drainage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                <span>Power Grid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <span>Telecom Duct</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-400/40"></span>
                <span className="text-red-300 font-semibold">Active Clash Ring</span>
              </div>
            </div>
          </div>
        </div>

        {/* Synchronized Project Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Synchronized Projects</h3>
              <p className="text-[11px] text-slate-500">{filteredProjects.length} of {projects.length} displayed on map</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              Interactive
            </span>
          </div>

          {/* Quick search input */}
          <div className="pt-2 pb-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search by code, corridor, title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-900"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Projects scroll list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 space-y-1 pr-1">
            {filteredProjects.map((proj) => {
              const activeConflict = conflicts.find(
                (c) => c.status !== 'dismissed' && (c.projectAId === proj.id || c.projectBId === proj.id)
              );
              const isSelected = selectedMapProject?.id === proj.id;

              return (
                <div
                  key={proj.id}
                  onClick={() => {
                    setSelectedMapProject(proj);
                    if (mapInstanceRef.current && proj.latitude && proj.longitude) {
                      mapInstanceRef.current.panTo({ lat: proj.latitude, lng: proj.longitude });
                      mapInstanceRef.current.setZoom(15);
                    }
                  }}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-50/80 border border-cyan-300 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[11px] text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {proj.projectCode}
                    </span>
                    {activeConflict ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> CLASH
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">
                        {proj.status.toUpperCase()} ({proj.progressPercentage}%)
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 leading-tight text-xs line-clamp-1">
                    {proj.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    📍 {proj.roadSegment}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                    <span>{proj.department.split('&')[0]}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj);
                      }}
                      className="font-bold text-slate-900 hover:text-cyan-700 flex items-center gap-0.5"
                    >
                      Inspect <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom active inspection card */}
          {selectedMapProject && (
            <div className="pt-2 border-t border-slate-200 mt-2">
              <button
                onClick={() => onSelectProject(selectedMapProject)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Full Project Dossier ({selectedMapProject.projectCode})</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
