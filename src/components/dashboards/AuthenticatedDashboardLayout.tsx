import React, { useState } from 'react';
import { UserRole, UserProfile } from '../../types';
import {
  Compass,
  LayoutDashboard,
  MapPin,
  FolderGit2,
  AlertTriangle,
  Calendar,
  FileText,
  Building2,
  ShieldCheck,
  BarChart3,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  TrendingDown,
  MessageSquare
} from 'lucide-react';

export interface NavItemConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  badge?: number | string;
  badgeColor?: string;
}

interface AuthenticatedDashboardLayoutProps {
  userRole: UserRole;
  currentUser: UserProfile;
  currentPath: string;
  activeTab: string;
  onNavigateTab: (tabId: string) => void;
  onNavigatePath: (path: string) => void;
  onSignOut: () => void;
  onOpenProfile: () => void;
  children: React.ReactNode;
  pendingClashesCount?: number;
  assignedReportsCount?: number;
  openReportsCount?: number;
}

export const AuthenticatedDashboardLayout: React.FC<AuthenticatedDashboardLayoutProps> = ({
  userRole,
  currentUser,
  currentPath,
  activeTab,
  onNavigateTab,
  onNavigatePath,
  onSignOut,
  onOpenProfile,
  children,
  pendingClashesCount = 0,
  assignedReportsCount = 0,
  openReportsCount = 0,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 1. Citizen Role Navigation Items:
  // Overview, Public Projects, Infrastructure Map, Report an Issue, My Reports, My Profile, Sign Out
  const citizenNavItems: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Public Projects', icon: FolderGit2 },
    { id: 'map', label: 'Infrastructure Map', icon: MapPin },
    { id: 'report', label: 'Report an Issue', icon: Plus },
    { id: 'my_reports', label: 'My Reports', icon: FileText, badge: openReportsCount > 0 ? openReportsCount : undefined },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // 2. Engineer Role Navigation Items:
  // Overview, Assigned Projects, Infrastructure Map, Conflict Detection, Delay Risk, Work Schedules, Assigned Reports, Department Workspace, My Profile, Sign Out
  const engineerNavItems: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'assigned_projects', label: 'Assigned Projects', icon: FolderGit2 },
    { id: 'map', label: 'Infrastructure Map', icon: MapPin },
    { id: 'conflicts', label: 'Conflict Detection', icon: AlertTriangle, badge: pendingClashesCount > 0 ? pendingClashesCount : undefined, badgeColor: 'bg-amber-500' },
    { id: 'delay_risk', label: 'Delay-Risk Analysis', icon: TrendingDown },
    { id: 'schedules', label: 'Work Schedules', icon: Calendar },
    { id: 'reports', label: 'Assigned Reports', icon: FileText, badge: assignedReportsCount > 0 ? assignedReportsCount : undefined },
    { id: 'workspace', label: 'Department Workspace', icon: Building2 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // 3. City Administrator Role Navigation Items:
  // Overview, All Projects, Infrastructure Map, Conflict Engine, Delay Risk, Department Coordination, Citizen Reports, Approvals, Audit History, Analytics, My Profile, Sign Out
  const adminNavItems: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'all_projects', label: 'All Projects', icon: FolderGit2 },
    { id: 'map', label: 'Infrastructure Map', icon: MapPin },
    { id: 'conflicts', label: 'Conflict Engine', icon: AlertTriangle, badge: pendingClashesCount > 0 ? pendingClashesCount : undefined, badgeColor: 'bg-red-500' },
    { id: 'delay_risk', label: 'Delay-Risk Analysis', icon: TrendingDown },
    { id: 'coordination', label: 'Department Coordination', icon: Building2 },
    { id: 'reports', label: 'Citizen Reports', icon: FileText },
    { id: 'approvals', label: 'Approvals & Accords', icon: ShieldCheck },
    { id: 'audit', label: 'Audit History', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // 4. Analytics Role Navigation Items:
  // Overview, Project Performance, Conflict Trends, Department Metrics, Reporting Periods, My Profile, Sign Out
  const analyticsNavItems: NavItemConfig[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'performance', label: 'Project Performance', icon: BarChart3 },
    { id: 'conflicts', label: 'Conflict Trends', icon: AlertTriangle },
    { id: 'departments', label: 'Department Metrics', icon: Building2 },
    { id: 'periods', label: 'Reporting Periods', icon: Calendar },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Determine current nav list based on active path & role
  const isAnalyticsDashboard = currentPath.startsWith('/analytics');
  const currentNavItems = isAnalyticsDashboard
    ? analyticsNavItems
    : userRole === 'citizen'
    ? citizenNavItems
    : userRole === 'dept_officer'
    ? engineerNavItems
    : adminNavItems;

  const getPortalTitle = () => {
    if (isAnalyticsDashboard) return 'Infrastructure Analytics';
    if (userRole === 'citizen') return 'Citizen Portal';
    if (userRole === 'dept_officer') return 'Highways Engineer Portal';
    if (userRole === 'city_admin') return 'City Administrator Portal';
    return 'Municipal Portal';
  };

  const getRoleBadge = () => {
    if (isAnalyticsDashboard) return { text: 'Analytics Engine', color: 'bg-teal-900/60 text-teal-300 border-teal-700/50' };
    if (userRole === 'citizen') return { text: 'Public Citizen (D1)', color: 'bg-teal-950 text-teal-300 border-teal-800/60' };
    if (userRole === 'dept_officer') return { text: 'Highways Engineer (D2)', color: 'bg-indigo-950 text-indigo-300 border-indigo-800/60' };
    if (userRole === 'city_admin') return { text: 'City Admin (D3)', color: 'bg-purple-950 text-purple-300 border-purple-800/60' };
    return { text: 'Civic Member', color: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  const roleBadge = getRoleBadge();

  const handleItemClick = (item: NavItemConfig) => {
    if (item.id === 'profile') {
      onOpenProfile();
      setMobileDrawerOpen(false);
      return;
    }
    onNavigateTab(item.id);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* ============================================================== */}
      {/* DEEP-NAVY FIXED DESKTOP SIDEBAR                                */}
      {/* ============================================================== */}
      <aside
        className={`hidden md:flex flex-col bg-[#0B1528] text-white border-r border-slate-800/80 transition-all duration-300 z-30 shrink-0 select-none ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                IN
              </div>
              <div className="truncate">
                <span className="font-extrabold text-white text-sm tracking-tight block leading-tight">
                  InfraNexus AI
                </span>
                <span className="text-[10px] text-teal-400 font-medium block leading-tight truncate">
                  One Network · Zero Blind Spots
                </span>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 mx-auto rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
              IN
            </div>
          )}

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar width"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Role Identity Tag (Expanded mode) */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Active Environment
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!sidebarCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {getPortalTitle()}
            </div>
          )}

          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 font-bold shadow-2xs border-l-3 border-teal-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!sidebarCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                      item.badgeColor || 'bg-teal-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Real Authenticated User Profile Card */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-85 transition-opacity cursor-pointer group"
                title="View user profile"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate group-hover:text-teal-300">
                    {currentUser.fullName || 'Registered User'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-mono">
                    {currentUser.email || 'Verified Account'}
                  </span>
                </div>
              </button>

              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer shrink-0"
                title="Sign out of municipal session"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onOpenProfile}
                className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-teal-400 cursor-pointer"
                title={currentUser.fullName || 'User Profile'}
              >
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </button>
              <button
                onClick={onSignOut}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* RESPONSIVE MOBILE DRAWER (DEEP-NAVY)                           */}
      {/* ============================================================== */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-[#0B1528] text-white flex flex-col h-full shadow-2xl z-10">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  IN
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm block">InfraNexus AI</span>
                  <span className="text-[10px] text-teal-400 font-medium block">One Network · Zero Blind Spots</span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-800/60 bg-slate-950/40">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {currentNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-teal-500/15 text-teal-300 font-bold border-l-3 border-teal-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white bg-teal-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800/80 bg-slate-950/50">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <span className="text-xs font-bold text-white block truncate">
                    {currentUser.fullName || 'Registered User'}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate font-mono">
                    {currentUser.email}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-red-400 hover:text-red-300"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MAIN VIEWPORT WRAPPER                                          */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* COMPACT TOP HEADER */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-14 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
          {/* Left: Mobile Drawer Trigger + Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-800 hidden sm:inline">
                {getPortalTitle()}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-teal-800 capitalize bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Right: Cloud Sync Status + Public Site Link + Real User Badge */}
          <div className="flex items-center gap-3">
            {/* Non-leaking Cloud Sync Status */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
              title="Database connected via Supabase live sync"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-semibold text-slate-800">Cloud Sync Active</span>
            </div>

            {/* Quick Public Site Button */}
            <button
              onClick={() => onNavigatePath('/')}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="View Public Visitor Website"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </button>

            {/* User Profile Pill showing REAL USER NAME */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs transition-colors cursor-pointer shadow-2xs group"
              title="Open profile details"
            >
              <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-[11px]">
                {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
              </div>
              <span className="font-bold text-slate-800 truncate max-w-[120px] sm:max-w-[160px] group-hover:text-teal-700">
                {currentUser.fullName || 'Registered User'}
              </span>
            </button>

            {/* Sign Out */}
            <button
              onClick={onSignOut}
              className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              title="Sign out of session"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* SPACIOUS MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
