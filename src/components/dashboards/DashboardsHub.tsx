import React, { useState, useEffect } from 'react';
import { Project, ProjectConflict, CitizenReport, AuditLog, UserRole, UserProfile } from '../../types';
import { CitizenDashboard } from './CitizenDashboard';
import { HighwaysEngineerDashboard } from './HighwaysEngineerDashboard';
import { CityAdminDashboard } from './CityAdminDashboard';
import { InfrastructureAnalyticsDashboard } from './InfrastructureAnalyticsDashboard';
import {
  Users,
  Compass,
  Building,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface DashboardsHubProps {
  projects: Project[];
  conflicts: ProjectConflict[];
  reports: CitizenReport[];
  auditLogs: AuditLog[];
  userRole: UserRole;
  currentUser: UserProfile;
  onNavigateTab: (tab: string) => void;
  onSelectProject: (project: Project) => void;
  onSelectConflict: (conflict: ProjectConflict) => void;
  onOpenCreateProject: () => void;
  onRoleChange: (role: UserRole) => void;
  onRefresh: () => void;
}

export const DashboardsHub: React.FC<DashboardsHubProps> = ({
  projects,
  conflicts,
  reports,
  auditLogs,
  userRole,
  currentUser,
  onNavigateTab,
  onSelectProject,
  onSelectConflict,
  onOpenCreateProject,
  onRoleChange,
  onRefresh,
}) => {
  // Active dashboard view (defaults to match active userRole)
  const [activeDashboard, setActiveDashboard] = useState<'citizen' | 'engineer' | 'admin' | 'analytics'>(
    userRole === 'citizen' ? 'citizen' : userRole === 'dept_officer' ? 'engineer' : 'admin'
  );

  // Sync active dashboard when userRole changes in the global header
  useEffect(() => {
    if (userRole === 'citizen') setActiveDashboard('citizen');
    else if (userRole === 'dept_officer') setActiveDashboard('engineer');
    else if (userRole === 'city_admin') setActiveDashboard('admin');
  }, [userRole]);

  const handleSelectDashboard = (dash: 'citizen' | 'engineer' | 'admin' | 'analytics') => {
    setActiveDashboard(dash);
    if (dash === 'citizen') onRoleChange('citizen');
    else if (dash === 'engineer') onRoleChange('dept_officer');
    else if (dash === 'admin') onRoleChange('city_admin');
  };

  return (
    <div className="space-y-6">
      {/* Four Dashboards Selection Strip */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
            <Compass className="w-4 h-4 text-teal-700" />
          </span>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block leading-tight">
              Four Role-Based Dashboards
            </span>
            <span className="text-[11px] text-slate-500">
              One Unified Registry · Shared Spatial Data
            </span>
          </div>
        </div>

        {/* Dashboard Switcher Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100/80 rounded-xl text-xs font-semibold">
          <button
            onClick={() => handleSelectDashboard('citizen')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDashboard === 'citizen'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Public Citizen</span>
            <span className="text-[10px] text-slate-400 font-mono">(D1)</span>
          </button>

          <button
            onClick={() => handleSelectDashboard('engineer')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDashboard === 'engineer'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Highways Engineer</span>
            <span className="text-[10px] text-slate-400 font-mono">(D2)</span>
          </button>

          <button
            onClick={() => handleSelectDashboard('admin')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDashboard === 'admin'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>City Admin (IAS)</span>
            <span className="text-[10px] text-slate-400 font-mono">(D3)</span>
          </button>

          <button
            onClick={() => setActiveDashboard('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeDashboard === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
            <span>Analytics</span>
            <span className="text-[10px] text-slate-400 font-mono">(D4)</span>
          </button>
        </div>
      </div>

      {/* RENDER SELECTED DASHBOARD */}
      {activeDashboard === 'citizen' && (
        <CitizenDashboard
          projects={projects}
          reports={reports}
          onNavigateTab={onNavigateTab}
          onSelectProject={onSelectProject}
          onReportSubmitted={onRefresh}
        />
      )}

      {activeDashboard === 'engineer' && (
        <HighwaysEngineerDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          auditLogs={auditLogs}
          onNavigateTab={onNavigateTab}
          onSelectProject={onSelectProject}
          onSelectConflict={onSelectConflict}
          onOpenCreateProject={onOpenCreateProject}
        />
      )}

      {activeDashboard === 'admin' && (
        <CityAdminDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          auditLogs={auditLogs}
          onNavigateTab={onNavigateTab}
          onSelectProject={onSelectProject}
          onSelectConflict={onSelectConflict}
          onRefresh={onRefresh}
        />
      )}

      {activeDashboard === 'analytics' && (
        <InfrastructureAnalyticsDashboard
          projects={projects}
          conflicts={conflicts}
          reports={reports}
          onSelectProject={onSelectProject}
          onSelectConflict={onSelectConflict}
        />
      )}
    </div>
  );
};
