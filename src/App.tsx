/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { dataStore } from './lib/dataStore';
import { Project, ProjectConflict, CitizenReport, AuditLog, UserRole, UserProfile } from './types';
import { LandingPage } from './components/LandingPage';
import { AboutView } from './components/AboutView';
import { HowItWorksView } from './components/HowItWorksView';
import { CitizenDashboard } from './components/dashboards/CitizenDashboard';
import { HighwaysEngineerDashboard } from './components/dashboards/HighwaysEngineerDashboard';
import { CityAdminDashboard } from './components/dashboards/CityAdminDashboard';
import { InfrastructureAnalyticsDashboard } from './components/dashboards/InfrastructureAnalyticsDashboard';
import { AuthenticatedDashboardLayout } from './components/dashboards/AuthenticatedDashboardLayout';
import { InfrastructureMap } from './components/InfrastructureMap';
import { ProjectManagementView } from './components/ProjectManagementView';
import { ConflictEngineView } from './components/ConflictEngineView';
import { DelayRiskAnalysisView } from './components/DelayRiskAnalysisView';
import { AskInfraNexusChatModal } from './components/AskInfraNexusChatModal';
import { AiCoordinationWorkbench } from './components/AiCoordinationWorkbench';
import { CitizenReportingView } from './components/CitizenReportingView';
import { DepartmentWorkspaceView } from './components/DepartmentWorkspaceView';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ConflictReviewModal } from './components/ConflictReviewModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AuthModal, AuthView } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { EmailVerificationCallback } from './components/auth/EmailVerificationCallback';
import { AccessDeniedView } from './components/auth/AccessDeniedView';
import { supabase, fetchSupabaseProfile } from './lib/supabaseClient';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  Send,
  LogIn,
  LogOut,
  Lock,
  Compass,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  User,
  Plus,
  MessageSquare,
  Bot
} from 'lucide-react';

export default function App() {
  // Reactive data from dataStore
  const [projects, setProjects] = useState<Project[]>(dataStore.getProjects());
  const [conflicts, setConflicts] = useState<ProjectConflict[]>(dataStore.getConflicts());
  const [reports, setReports] = useState<CitizenReport[]>(dataStore.getReports());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(dataStore.getAuditLogs());
  const [userRole, setUserRole] = useState<UserRole>(dataStore.getCurrentRole());
  const [currentUser, setCurrentUser] = useState<UserProfile>(dataStore.getCurrentUser());

  // Supabase Auth state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView>('sign_in');
  const [authenticatedSessionUser, setAuthenticatedSessionUser] = useState<any | null>(null);

  // Profile modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Ask InfraNexus AI Chat modal state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modals state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ProjectConflict | null>(null);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated Dashboard active sub-tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<string>('overview');

  // Guard to ensure email verification callback does not trigger loops
  const postVerificationRedirectDone = useRef(false);

  // Clean HTML5 Path-based Routing
  const normalizePath = (pathname: string): string => {
    const clean = pathname.replace(/\/+$/, '') || '/';
    return clean;
  };

  const getAuthorizedDashboardPath = (role: UserRole): string => {
    switch (role) {
      case 'citizen':
        return '/citizen/dashboard';
      case 'dept_officer':
        return '/engineer/dashboard';
      case 'city_admin':
        return '/admin/dashboard';
      default:
        return '/citizen/dashboard';
    }
  };

  // Start at normalized path, default to '/' (Public Landing Page)
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return normalizePath(window.location.pathname);
  });

  const navigate = useCallback((path: string) => {
    const normalized = normalizePath(path);
    if (window.location.pathname !== normalized) {
      window.history.pushState({}, '', normalized);
    }
    setCurrentPath(normalized);
    setActiveDashboardTab('overview');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
      setActiveDashboardTab('overview');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const applySessionRole = useCallback((role: UserRole) => {
    dataStore.setRole(role);
    setUserRole(role);
    setCurrentUser(dataStore.getCurrentUser());
  }, []);

  const handleRoleChange = useCallback((newRole: UserRole) => {
    if (authenticatedSessionUser) {
      // In authenticated sessions, role is governed by database profile
      return;
    }
    applySessionRole(newRole);
    navigate(getAuthorizedDashboardPath(newRole));
  }, [authenticatedSessionUser, applySessionRole, navigate]);

  const handleSessionEstablished = useCallback((user: any, role: UserRole) => {
    setAuthenticatedSessionUser(user);
    applySessionRole(role);

    // Only redirect if on an auth entry page or auth callback, avoiding duplicate loops
    if (!postVerificationRedirectDone.current) {
      const current = normalizePath(window.location.pathname);
      const authPages = ['/sign-in', '/register', '/signup', '/sign-up', '/forgot-password', '/auth/callback'];
      if (authPages.includes(current)) {
        postVerificationRedirectDone.current = true;
        navigate(getAuthorizedDashboardPath(role));
      }
    }
  }, [applySessionRole, navigate]);

  const handleOpenAuthModal = useCallback((view?: AuthView) => {
    if (view) setAuthModalView(view);
    setIsAuthModalOpen(true);
  }, []);

  // Hydrate Supabase session and user profile on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setAuthenticatedSessionUser(session.user);
        const profile = await fetchSupabaseProfile(session.user.id);
        const resolvedName =
          profile?.full_name ||
          session.user.user_metadata?.full_name ||
          localStorage.getItem(`civicsync_name_${session.user.id}`) ||
          (session.user.email ? localStorage.getItem(`civicsync_name_${session.user.email.toLowerCase()}`) : null) ||
          localStorage.getItem('civicsync_registered_name') ||
          session.user.email?.split('@')[0] ||
          'Verified Resident';

        const profileRole = (profile?.role || session.user.user_metadata?.requested_role || 'citizen') as UserRole;
        const profileDept =
          (profile?.department as any) ||
          (profileRole === 'dept_officer'
            ? 'Highways & Road Infrastructure'
            : profileRole === 'city_admin'
            ? 'City Municipal Corporation'
            : 'Public Citizen');

        const userObj: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: resolvedName,
          role: profileRole,
          department: profileDept,
          designation:
            profile?.designation ||
            (profileRole === 'citizen'
              ? 'Resident Civic Monitor'
              : profileRole === 'dept_officer'
              ? 'Divisional Engineer'
              : 'Municipal Administrator'),
        };

        dataStore.setAuthenticatedUser(userObj);
        setCurrentUser(userObj);
        applySessionRole(profileRole);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthenticatedSessionUser(session.user);
        const profile = await fetchSupabaseProfile(session.user.id);
        const resolvedName =
          profile?.full_name ||
          session.user.user_metadata?.full_name ||
          localStorage.getItem(`civicsync_name_${session.user.id}`) ||
          (session.user.email ? localStorage.getItem(`civicsync_name_${session.user.email.toLowerCase()}`) : null) ||
          localStorage.getItem('civicsync_registered_name') ||
          session.user.email?.split('@')[0] ||
          'Verified Resident';

        const profileRole = (profile?.role || session.user.user_metadata?.requested_role || 'citizen') as UserRole;
        const profileDept =
          (profile?.department as any) ||
          (profileRole === 'dept_officer'
            ? 'Highways & Road Infrastructure'
            : profileRole === 'city_admin'
            ? 'City Municipal Corporation'
            : 'Public Citizen');

        const userObj: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          fullName: resolvedName,
          role: profileRole,
          department: profileDept,
          designation:
            profile?.designation ||
            (profileRole === 'citizen'
              ? 'Resident Civic Monitor'
              : profileRole === 'dept_officer'
              ? 'Divisional Engineer'
              : 'Municipal Administrator'),
        };

        dataStore.setAuthenticatedUser(userObj);
        setCurrentUser(userObj);
        applySessionRole(profileRole);

        // Only redirect if user is currently on an auth route and not undergoing EmailVerificationCallback
        const current = normalizePath(window.location.pathname);
        const authPages = ['/sign-in', '/register', '/signup', '/sign-up', '/forgot-password'];
        const hasUrlTokens = window.location.hash.includes('access_token') || window.location.search.includes('code=');
        if (authPages.includes(current) && !hasUrlTokens) {
          navigate(getAuthorizedDashboardPath(profileRole));
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthenticatedSessionUser(null);
        dataStore.setAuthenticatedUser(null);
        setCurrentUser(dataStore.getCurrentUser());
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [applySessionRole, navigate]);

  // Subscribe to reactive data store changes
  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setProjects(dataStore.getProjects());
      setConflicts(dataStore.getConflicts());
      setReports(dataStore.getReports());
      setAuditLogs(dataStore.getAuditLogs());
      setUserRole(dataStore.getCurrentRole());
      setCurrentUser(dataStore.getCurrentUser());
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthenticatedSessionUser(null);
    dataStore.setAuthenticatedUser(null);
    setCurrentUser(dataStore.getCurrentUser());
    navigate('/');
  };

  const handleRefreshData = () => {
    setProjects(dataStore.getProjects());
    setConflicts(dataStore.getConflicts());
    setReports(dataStore.getReports());
    setAuditLogs(dataStore.getAuditLogs());
  };

  const pendingConflictCount = conflicts.filter((c) => c.status === 'pending_review').length;
  const highwaysProjectsCount = projects.filter((p) => p.department === 'Highways & Road Infrastructure').length;
  const assignedReportsCount = reports.filter(
    (r) =>
      r.departmentAssigned === 'Highways & Road Infrastructure' ||
      r.category === 'road_damage' ||
      r.category === 'repeated_excavation'
  ).length;
  const openReportsCount = reports.filter((r) => r.status === 'submitted' || r.status === 'verified').length;

  // Separate authenticated dashboard experience vs public website experience
  const isDashboardView =
    currentPath.startsWith('/citizen') ||
    currentPath.startsWith('/engineer') ||
    currentPath.startsWith('/admin') ||
    currentPath.startsWith('/analytics') ||
    currentPath === '/workspace' ||
    currentPath === '/conflicts' ||
    currentPath === '/ai_assistant';

  // Public navigation links
  const publicNavLinks = [
    { path: '/', label: 'Home' },
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/map', label: 'Infrastructure Map' },
    { path: '/projects', label: 'Public Projects' },
    { path: '/about', label: 'About' },
  ];

  // =========================================================================
  // AUTHENTICATED DASHBOARD CONTENT ROUTER
  // =========================================================================
  const renderDashboardContent = () => {
    // 1. Citizen Dashboard (/citizen/dashboard)
    if (currentPath === '/citizen/dashboard' || currentPath.startsWith('/citizen')) {
      if (activeDashboardTab === 'projects') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Public Project Registry</h2>
                <p className="text-xs text-slate-500">Live corridor work schedules and contractor accountability.</p>
              </div>
            </div>
            <ProjectManagementView
              projects={projects}
              userRole={userRole}
              onSelectProject={setSelectedProject}
              onOpenCreateModal={() => setIsCreateProjectOpen(true)}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'map') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Citizen GIS Infrastructure Map</h2>
                <p className="text-xs text-slate-500">Spatial visualization of active roadworks and reported disruptions.</p>
              </div>
            </div>
            <InfrastructureMap
              projects={projects}
              reports={reports}
              conflicts={conflicts}
              onSelectProject={setSelectedProject}
              onSelectConflict={setSelectedConflict}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'report') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Report Road & Infrastructure Issue</h2>
                <p className="text-xs text-slate-500">Directly alert municipal authorities regarding potholes, repeated digging, or unpaved trenches.</p>
              </div>
            </div>
            <CitizenReportingView
              reports={reports}
              onReportSubmitted={() => {
                setReports(dataStore.getReports());
                setActiveDashboardTab('my_reports');
              }}
            />
          </div>
        );
      }

      // Default: Citizen Overview or My Reports
      return (
        <CitizenDashboard
          projects={projects}
          reports={reports}
          currentUser={currentUser}
          initialTab={
            activeDashboardTab === 'my_reports'
              ? 'my_reports'
              : activeDashboardTab === 'report'
              ? 'file_report'
              : 'overview'
          }
          onNavigateTab={(tab) => {
            if (tab === 'projects') setActiveDashboardTab('projects');
            else if (tab === 'map') setActiveDashboardTab('map');
            else if (tab === 'reporting') setActiveDashboardTab('report');
            else if (tab === 'my_reports') setActiveDashboardTab('my_reports');
          }}
          onSelectProject={setSelectedProject}
          onReportSubmitted={() => setReports(dataStore.getReports())}
        />
      );
    }

    // 2. Highways Engineer Dashboard (/engineer/dashboard)
    if (currentPath === '/engineer/dashboard' || currentPath.startsWith('/engineer')) {
      if (userRole === 'citizen') {
        return (
          <AccessDeniedView
            requiredRole="dept_officer"
            currentRole={userRole}
            currentUser={currentUser}
            isAuthenticated={Boolean(authenticatedSessionUser)}
            onNavigateAuthorized={() => navigate('/citizen/dashboard')}
            onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          />
        );
      }

      if (activeDashboardTab === 'assigned_projects') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Highways Department Projects</h2>
                <p className="text-xs text-slate-500">Assigned corridor initiatives and timeline management.</p>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Project</span>
              </button>
            </div>
            <ProjectManagementView
              projects={projects.filter((p) => p.department === 'Highways & Road Infrastructure')}
              userRole={userRole}
              onSelectProject={setSelectedProject}
              onOpenCreateModal={() => setIsCreateProjectOpen(true)}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'map') {
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Highways GIS Corridor Map</h2>
              <p className="text-xs text-slate-500">Spatial corridor buffer overlay with inter-departmental clashes.</p>
            </div>
            <InfrastructureMap
              projects={projects}
              reports={reports}
              conflicts={conflicts}
              onSelectProject={setSelectedProject}
              onSelectConflict={setSelectedConflict}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'conflicts') {
        return (
          <ConflictEngineView
            conflicts={conflicts}
            projects={projects}
            userRole={userRole}
            onSelectConflict={setSelectedConflict}
            onRecalculate={() => dataStore.recalculateConflicts()}
          />
        );
      }

      if (activeDashboardTab === 'delay_risk') {
        return (
          <DelayRiskAnalysisView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            onSelectProject={setSelectedProject}
            onSelectConflict={setSelectedConflict}
          />
        );
      }

      if (activeDashboardTab === 'schedules') {
        const highwaysProjects = projects.filter((p) => p.department === 'Highways & Road Infrastructure');
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Highways Work Schedules & Phasing</h2>
                <p className="text-xs text-slate-500">Scheduled corridor excavation windows, milling phases, and resurfacing timelines.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="space-y-4">
                {highwaysProjects.map((p) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          {p.projectCode}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1">{p.title}</h4>
                        <div className="text-xs text-slate-500">{p.roadSegment}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-700">Progress: {p.progressPercentage}%</span>
                        <div className="w-32 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${p.progressPercentage}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                      <span className="font-mono">📅 Window: {p.plannedStartDate} → {p.plannedEndDate}</span>
                      <span>Contractor: <strong>{p.contractor}</strong></span>
                      <span className="font-mono font-bold text-slate-900">₹{p.estimatedBudget.toFixed(1)} L</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      if (activeDashboardTab === 'reports') {
        const assignedReports = reports.filter(
          (r) =>
            r.departmentAssigned === 'Highways & Road Infrastructure' ||
            r.category === 'road_damage' ||
            r.category === 'repeated_excavation'
        );
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Assigned Citizen Reports (Highways)</h2>
                <p className="text-xs text-slate-500">Citizen submissions routed to Highways & Road Infrastructure department.</p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold font-mono">
                {assignedReports.length} Active Reports
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs divide-y divide-slate-100">
              {assignedReports.map((r) => (
                <div key={r.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {r.referenceNo}
                      </span>
                      <span className="font-bold text-slate-900">{r.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-500">📍 {r.landmark} • Reporter: {r.reporterName}</div>
                    <p className="text-slate-600 text-[11px] max-w-xl">{r.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveDashboardTab('workspace')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors text-xs"
                  >
                    Open in Workspace
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (activeDashboardTab === 'workspace') {
        return (
          <DepartmentWorkspaceView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            auditLogs={auditLogs}
            currentUser={currentUser}
            onSelectConflict={setSelectedConflict}
            onRefresh={handleRefreshData}
            onSwitchPersona={handleRoleChange}
          />
        );
      }

      // Default: Engineer Overview
      return (
        <HighwaysEngineerDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          auditLogs={auditLogs}
          currentUser={currentUser}
          onNavigateTab={(tab) => {
            if (tab === 'projects') setActiveDashboardTab('assigned_projects');
            else if (tab === 'map') setActiveDashboardTab('map');
            else if (tab === 'conflicts') setActiveDashboardTab('conflicts');
            else if (tab === 'workspace') setActiveDashboardTab('workspace');
            else if (tab === 'analytics') navigate('/analytics/dashboard');
          }}
          onSelectProject={setSelectedProject}
          onSelectConflict={setSelectedConflict}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />
      );
    }

    // 3. City Administrator Dashboard (/admin/dashboard)
    if (currentPath === '/admin/dashboard' || currentPath.startsWith('/admin')) {
      if (userRole !== 'city_admin') {
        return (
          <AccessDeniedView
            requiredRole="city_admin"
            currentRole={userRole}
            currentUser={currentUser}
            isAuthenticated={Boolean(authenticatedSessionUser)}
            onNavigateAuthorized={() => navigate(getAuthorizedDashboardPath(userRole))}
            onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          />
        );
      }

      if (activeDashboardTab === 'all_projects') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Master Municipal Project Registry</h2>
                <p className="text-xs text-slate-500">Cross-departmental public infrastructure operations across all zones.</p>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Project</span>
              </button>
            </div>
            <ProjectManagementView
              projects={projects}
              userRole={userRole}
              onSelectProject={setSelectedProject}
              onOpenCreateModal={() => setIsCreateProjectOpen(true)}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'map') {
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Municipal Master GIS Map</h2>
              <p className="text-xs text-slate-500">Complete spatial view of all public agencies, active permits, and conflict buffers.</p>
            </div>
            <InfrastructureMap
              projects={projects}
              reports={reports}
              conflicts={conflicts}
              onSelectProject={setSelectedProject}
              onSelectConflict={setSelectedConflict}
            />
          </div>
        );
      }

      if (activeDashboardTab === 'conflicts') {
        return (
          <ConflictEngineView
            conflicts={conflicts}
            projects={projects}
            userRole={userRole}
            onSelectConflict={setSelectedConflict}
            onRecalculate={() => dataStore.recalculateConflicts()}
          />
        );
      }

      if (activeDashboardTab === 'delay_risk') {
        return (
          <DelayRiskAnalysisView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            onSelectProject={setSelectedProject}
            onSelectConflict={setSelectedConflict}
          />
        );
      }

      if (activeDashboardTab === 'coordination') {
        return (
          <DepartmentWorkspaceView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            auditLogs={auditLogs}
            currentUser={currentUser}
            initialSubTab="inter_agency"
            onSelectConflict={setSelectedConflict}
            onRefresh={handleRefreshData}
            onSwitchPersona={handleRoleChange}
          />
        );
      }

      if (activeDashboardTab === 'approvals') {
        return (
          <DepartmentWorkspaceView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            auditLogs={auditLogs}
            currentUser={currentUser}
            initialSubTab="work_orders"
            onSelectConflict={setSelectedConflict}
            onRefresh={handleRefreshData}
            onSwitchPersona={handleRoleChange}
          />
        );
      }

      if (activeDashboardTab === 'audit') {
        return (
          <DepartmentWorkspaceView
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            auditLogs={auditLogs}
            currentUser={currentUser}
            initialSubTab="audit"
            onSelectConflict={setSelectedConflict}
            onRefresh={handleRefreshData}
            onSwitchPersona={handleRoleChange}
          />
        );
      }

      if (activeDashboardTab === 'reports') {
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Citizen Reports Master Triage</h2>
                <p className="text-xs text-slate-500">Cross-departmental citizen problem tracking, status monitoring, and escalation.</p>
              </div>
              <span className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full text-xs font-bold font-mono">
                {reports.length} Total Registered
              </span>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs divide-y divide-slate-100">
              {reports.map((r) => (
                <div key={r.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {r.referenceNo}
                      </span>
                      <span className="font-bold text-slate-900">{r.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-slate-500">📍 {r.landmark} • Assigned: {r.departmentAssigned || 'Triage Pending'}</div>
                    <p className="text-slate-600 text-[11px] max-w-xl">{r.description}</p>
                  </div>
                  <button
                    onClick={() => setActiveDashboardTab('approvals')}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors text-xs"
                  >
                    View in Workspace
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (activeDashboardTab === 'analytics') {
        return (
          <InfrastructureAnalyticsDashboard
            projects={projects}
            conflicts={conflicts}
            reports={reports}
            onSelectProject={setSelectedProject}
            onSelectConflict={setSelectedConflict}
          />
        );
      }

      // Default: City Admin Overview
      return (
        <CityAdminDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          auditLogs={auditLogs}
          currentUser={currentUser}
          onNavigateTab={(tab) => {
            if (tab === 'projects') setActiveDashboardTab('all_projects');
            else if (tab === 'map') setActiveDashboardTab('map');
            else if (tab === 'conflicts') setActiveDashboardTab('conflicts');
            else if (tab === 'workspace') setActiveDashboardTab('coordination');
            else if (tab === 'analytics') setActiveDashboardTab('analytics');
          }}
          onSelectProject={setSelectedProject}
          onSelectConflict={setSelectedConflict}
          onRefresh={handleRefreshData}
        />
      );
    }

    // 4. Infrastructure Analytics Dashboard (/analytics/dashboard)
    if (currentPath.startsWith('/analytics')) {
      return (
        <InfrastructureAnalyticsDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          onSelectProject={setSelectedProject}
          onSelectConflict={setSelectedConflict}
        />
      );
    }

    // 5. Standalone Restricted Routes (wrapped in dashboard layout)
    if (currentPath === '/conflicts') {
      if (userRole === 'citizen') {
        return (
          <AccessDeniedView
            requiredRole="any_officer"
            currentRole={userRole}
            currentUser={currentUser}
            isAuthenticated={Boolean(authenticatedSessionUser)}
            onNavigateAuthorized={() => navigate('/citizen/dashboard')}
            onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          />
        );
      }
      return (
        <ConflictEngineView
          conflicts={conflicts}
          projects={projects}
          userRole={userRole}
          onSelectConflict={setSelectedConflict}
          onRecalculate={() => dataStore.recalculateConflicts()}
        />
      );
    }

    if (currentPath === '/workspace') {
      if (userRole === 'citizen') {
        return (
          <AccessDeniedView
            requiredRole="any_officer"
            currentRole={userRole}
            currentUser={currentUser}
            isAuthenticated={Boolean(authenticatedSessionUser)}
            onNavigateAuthorized={() => navigate('/citizen/dashboard')}
            onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          />
        );
      }
      return (
        <DepartmentWorkspaceView
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          auditLogs={auditLogs}
          currentUser={currentUser}
          onSelectConflict={setSelectedConflict}
          onRefresh={handleRefreshData}
          onSwitchPersona={handleRoleChange}
        />
      );
    }

    if (currentPath === '/ai_assistant') {
      if (userRole === 'citizen') {
        return (
          <AccessDeniedView
            requiredRole="any_officer"
            currentRole={userRole}
            currentUser={currentUser}
            isAuthenticated={Boolean(authenticatedSessionUser)}
            onNavigateAuthorized={() => navigate('/citizen/dashboard')}
            onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          />
        );
      }
      return (
        <AiCoordinationWorkbench
          conflicts={conflicts}
          onConflictResolved={() => dataStore.recalculateConflicts()}
        />
      );
    }

    return null;
  };

  // =========================================================================
  // PUBLIC WEBSITE CONTENT ROUTER
  // =========================================================================
  const renderPublicContent = () => {
    // 1. Landing Page
    if (currentPath === '/') {
      return (
        <LandingPage
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          onNavigate={navigate}
          onOpenSignIn={() => handleOpenAuthModal('sign_in')}
          onOpenSignUp={() => handleOpenAuthModal('sign_up')}
          onSelectRoleDemo={(role) => handleRoleChange(role)}
          onSelectProject={setSelectedProject}
        />
      );
    }

    // 2. How It Works
    if (currentPath === '/how-it-works') {
      return (
        <HowItWorksView
          onNavigate={navigate}
          onOpenSignUp={() => handleOpenAuthModal('sign_up')}
        />
      );
    }

    // 3. About
    if (currentPath === '/about') {
      return (
        <AboutView
          onNavigate={navigate}
          onOpenSignUp={() => navigate('/register')}
        />
      );
    }

    // 4. Public Infrastructure Map
    if (currentPath === '/map') {
      return (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Public Infrastructure Map Explorer</h2>
              <p className="text-xs text-slate-500">Interactive GIS exploration of planned roadworks and community reports.</p>
            </div>
            {authenticatedSessionUser ? (
              <button
                onClick={() => navigate(getAuthorizedDashboardPath(userRole))}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Return to Dashboard →
              </button>
            ) : (
              <button
                onClick={() => navigate('/register')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Sign In to File Report
              </button>
            )}
          </div>
          <InfrastructureMap
            projects={projects}
            reports={reports}
            conflicts={conflicts}
            onSelectProject={setSelectedProject}
            onSelectConflict={setSelectedConflict}
          />
        </div>
      );
    }

    // 5. Public Projects Registry
    if (currentPath === '/projects') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Public Projects Registry</h2>
              <p className="text-xs text-slate-500">Track planned and ongoing municipal road and utility projects.</p>
            </div>
          </div>
          <ProjectManagementView
            projects={projects}
            userRole={userRole}
            onSelectProject={setSelectedProject}
            onOpenCreateModal={() => {
              if (authenticatedSessionUser && userRole !== 'citizen') {
                setIsCreateProjectOpen(true);
              } else {
                handleOpenAuthModal('sign_in');
              }
            }}
          />
        </div>
      );
    }

    // 6. Citizen Reporting Form
    if (currentPath === '/reporting') {
      return (
        <CitizenReportingView
          reports={reports}
          onReportSubmitted={() => {
            setReports(dataStore.getReports());
          }}
        />
      );
    }

    // 7. Dedicated Sign In Page
    if (currentPath === '/sign-in' || currentPath === '/signin' || currentPath === '/login') {
      return (
        <AuthPage
          initialMode="sign_in"
          onNavigate={navigate}
          onAuthSuccess={(user, role) => {
            setAuthenticatedSessionUser(user);
            setUserRole(role);
            navigate(getAuthorizedDashboardPath(role));
          }}
        />
      );
    }

    // 8. Dedicated Registration Page
    if (currentPath === '/register' || currentPath === '/signup' || currentPath === '/sign-up') {
      return (
        <AuthPage
          initialMode="register"
          onNavigate={navigate}
          onAuthSuccess={(user, role) => {
            setAuthenticatedSessionUser(user);
            setUserRole(role);
            navigate(getAuthorizedDashboardPath(role));
          }}
        />
      );
    }

    // 9. Forgot Password
    if (currentPath === '/forgot-password') {
      return (
        <AuthPage
          initialMode="forgot_password"
          onNavigate={navigate}
          onAuthSuccess={(user, role) => {
            setAuthenticatedSessionUser(user);
            setUserRole(role);
            navigate(getAuthorizedDashboardPath(role));
          }}
        />
      );
    }

    // 10. Supabase Auth Callback Route
    if (currentPath === '/auth/callback') {
      return (
        <div className="py-16 max-w-md mx-auto text-center space-y-4">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-xs text-center space-y-3">
            <div className="w-12 h-12 bg-teal-50 border border-teal-200 rounded-full flex items-center justify-center mx-auto text-teal-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Verifying Email Authentication</h2>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Confirming your security token with Supabase and routing to your authorized municipal dashboard...
            </p>
          </div>
        </div>
      );
    }

    // Fallback: 404
    return (
      <div className="text-center py-20 space-y-4">
        <h3 className="text-xl font-bold text-slate-800">Page Not Found</h3>
        <p className="text-sm text-slate-500">The requested page "{currentPath}" does not exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-800"
        >
          Return to Home
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* ============================================================== */}
      {/* AUTHENTICATED DASHBOARD (DEEP-NAVY SIDEBAR ARCHITECTURE)        */}
      {/* ============================================================== */}
      {isDashboardView ? (
        <AuthenticatedDashboardLayout
          userRole={userRole}
          currentUser={currentUser}
          currentPath={currentPath}
          activeTab={activeDashboardTab}
          onNavigateTab={(tabId) => setActiveDashboardTab(tabId)}
          onNavigatePath={navigate}
          onSignOut={handleSignOut}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          pendingClashesCount={pendingConflictCount}
          assignedReportsCount={assignedReportsCount}
          openReportsCount={openReportsCount}
        >
          {/* Email Verification Callback banner for returning Gmail verification links */}
          <EmailVerificationCallback
            onSessionEstablished={handleSessionEstablished}
            onOpenAuthModal={handleOpenAuthModal}
          />

          {/* Role Dashboard Main View */}
          {renderDashboardContent()}
        </AuthenticatedDashboardLayout>
      ) : (
        /* ============================================================== */
        /* PUBLIC WEBSITE EXPERIENCE (LIGHT NAVBAR & FOOTER)              */
        /* ============================================================== */
        <div className="flex flex-col min-h-screen">
          {/* PUBLIC TOP NAVIGATION BAR */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
              {/* Brand Logo & Wordmark */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2.5 text-left cursor-pointer shrink-0 group"
                title="InfraNexus AI Home"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-slate-800 transition-colors">
                  IN
                </div>
                <div>
                  <span className="text-base font-extrabold tracking-tight text-slate-900 whitespace-nowrap block leading-tight">
                    InfraNexus AI
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium tracking-wide hidden sm:block">
                    One Network · Zero Coordination Blind Spots
                  </span>
                </div>
              </button>

              {/* Public Center Navigation Links */}
              <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600">
                {publicNavLinks.map((link) => {
                  const isActive = currentPath === link.path;
                  return (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className={`hover:text-slate-900 transition-colors whitespace-nowrap cursor-pointer py-1 ${
                        isActive ? 'text-slate-900 border-b-2 border-slate-900 font-bold' : ''
                      }`}
                    >
                      {link.label}
                    </button>
                  );
                })}
              </nav>

              {/* Right Header Controls */}
              <div className="flex items-center gap-2.5 shrink-0">
                {/* Cloud Sync Status Indicator (Non-leaking) */}
                <div
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
                  title="InfraNexus Municipal Engine: Cloud Sync Connected"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-800">Cloud Sync Active</span>
                </div>

                {/* Supabase Authenticated User or Sign In / Get Started */}
                {authenticatedSessionUser ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(getAuthorizedDashboardPath(userRole))}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 cursor-pointer"
                      title="Go to role dashboard"
                    >
                      <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[10px]">
                        {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                      </div>
                      <span className="truncate max-w-[120px] font-bold text-slate-900">
                        {currentUser.fullName || authenticatedSessionUser.email}
                      </span>
                      <span className="text-[10px] text-teal-700 font-bold">Dashboard →</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-red-700 font-semibold cursor-pointer transition-colors flex items-center gap-1"
                      title="Sign out of Supabase session"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/sign-in')}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => navigate('/register')}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Get Started
                    </button>
                  </div>
                )}

                {/* Mobile Menu Toggle Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {mobileMenuOpen && (
              <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
                <div className="flex flex-col space-y-1">
                  {publicNavLinks.map((link) => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                    >
                      <span>{link.label}</span>
                    </button>
                  ))}
                  {authenticatedSessionUser && (
                    <button
                      onClick={() => navigate(getAuthorizedDashboardPath(userRole))}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-teal-700 hover:bg-teal-50"
                    >
                      Go to Role Dashboard →
                    </button>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* MAIN PUBLIC CONTENT VIEW */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <EmailVerificationCallback
              onSessionEstablished={handleSessionEstablished}
              onOpenAuthModal={handleOpenAuthModal}
            />
            {renderPublicContent()}
          </main>

          {/* PUBLIC FOOTER */}
          <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">InfraNexus AI</span>
                  <span>·</span>
                  <span>One Network. Zero Coordination Blind Spots.</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <button onClick={() => navigate('/')} className="hover:text-slate-900 cursor-pointer">
                    Home
                  </button>
                  <button onClick={() => navigate('/how-it-works')} className="hover:text-slate-900 cursor-pointer">
                    How It Works
                  </button>
                  <button onClick={() => navigate('/map')} className="hover:text-slate-900 cursor-pointer">
                    Map
                  </button>
                  <button onClick={() => navigate('/projects')} className="hover:text-slate-900 cursor-pointer">
                    Projects
                  </button>
                  <button onClick={() => navigate('/about')} className="hover:text-slate-900 cursor-pointer">
                    About
                  </button>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
                <div>
                  Bits and Bytes 24-Hour Web Development Hackathon · IIITDM Kancheepuram
                </div>
                <div>
                  Municipal Public Works Coordination Registry · Protected by End-to-End Encryption & RBAC
                </div>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ============================================================== */}
      {/* GLOBAL MODALS (PROJECT DETAIL, CONFLICT REVIEW, USER PROFILE)   */}
      {/* ============================================================== */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          userRole={userRole}
          onClose={() => setSelectedProject(null)}
          onUpdate={() => {
            setProjects(dataStore.getProjects());
            setSelectedProject(null);
          }}
        />
      )}

      {selectedConflict && (
        <ConflictReviewModal
          conflict={selectedConflict}
          onClose={() => setSelectedConflict(null)}
          onSuccess={() => {
            dataStore.recalculateConflicts();
            setSelectedConflict(null);
          }}
        />
      )}

      {isCreateProjectOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateProjectOpen(false)}
          onSuccess={() => {
            setProjects(dataStore.getProjects());
            dataStore.recalculateConflicts();
          }}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        userRole={userRole}
        onClose={() => setIsProfileModalOpen(false)}
        onSignOut={handleSignOut}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
        }}
      />

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialView={authModalView}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user, role) => {
          setAuthenticatedSessionUser(user);
          applySessionRole(role);
          navigate(getAuthorizedDashboardPath(role));
        }}
      />

      {/* Floating Ask InfraNexus AI Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsChatOpen(true)}
          className="px-4 py-3 bg-gradient-to-r from-slate-900 to-cyan-950 hover:from-cyan-950 hover:to-slate-900 text-white rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center gap-2.5 font-bold text-xs transition-all hover:scale-105 cursor-pointer group"
          title="Ask InfraNexus AI Assistant"
        >
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="tracking-tight">Ask InfraNexus AI</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </button>
      </div>

      {/* Ask InfraNexus AI Multi-Turn Grounded Chat Modal */}
      <AskInfraNexusChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSelectProjectCode={(code) => {
          const match = projects.find((p) => p.projectCode === code);
          if (match) {
            setSelectedProject(match);
            setIsChatOpen(false);
          }
        }}
      />
    </div>
  );
}
