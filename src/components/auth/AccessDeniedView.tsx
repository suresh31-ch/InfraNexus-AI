import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, LogIn, CheckCircle2, User } from 'lucide-react';
import { UserRole, UserProfile } from '../../types';

interface AccessDeniedViewProps {
  requiredRole: 'citizen' | 'dept_officer' | 'city_admin' | 'any_officer';
  currentRole: UserRole;
  currentUser: UserProfile;
  isAuthenticated: boolean;
  onNavigateAuthorized: () => void;
  onOpenSignIn: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  requiredRole,
  currentRole,
  currentUser,
  isAuthenticated,
  onNavigateAuthorized,
  onOpenSignIn,
}) => {
  const getRequiredRoleTitle = () => {
    switch (requiredRole) {
      case 'city_admin':
        return 'City Administrator (IAS) Executive Clearance';
      case 'dept_officer':
        return 'Highways Department Engineer Clearance';
      case 'any_officer':
        return 'Department Officer or City Administrator Clearance';
      case 'citizen':
        return 'Public Citizen Account';
      default:
        return 'Elevated Clearance Required';
    }
  };

  const getDenialExplanation = () => {
    if (!isAuthenticated) {
      return 'This dashboard contains restricted municipal data and requires an authenticated session with verified credentials. Guest visitors cannot access internal administrative or engineering portals.';
    }

    if (requiredRole === 'city_admin') {
      return `Your current authenticated account is "${currentUser.fullName}" with role "${currentRole.toUpperCase()}" (${currentUser.department}). Access to the City Administrator portal requires Municipal Zonal Commissioner (IAS) authorization. Row-Level Security (RLS) restricts access to verified administrators.`;
    }

    if (requiredRole === 'dept_officer' || requiredRole === 'any_officer') {
      return `Your current account is authenticated as "${currentUser.fullName}" with role "${currentRole.toUpperCase()}". Access to this departmental engineering workspace is restricted to authorized municipal officers. Self-escalation is blocked by database constraints.`;
    }

    return 'You do not have the required permissions to view this resource.';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-red-200/80 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-red-600 to-rose-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-xs">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-widest font-mono text-red-200 font-bold block">
                HTTP 403 · Forbidden
              </span>
              <h2 className="text-lg font-extrabold text-white">Access Denied</h2>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white border border-white/30">
            RLS Protected
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <Lock className="w-4 h-4 text-red-600" />
              <span>Required Authorization:</span>
            </div>
            <p className="text-base font-bold text-slate-900 bg-red-50/70 border border-red-200/80 rounded-xl p-3 text-red-950">
              {getRequiredRoleTitle()}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
              <span className="font-semibold text-slate-600">Your Current Session Identity:</span>
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {currentRole}
              </span>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <div>
                <strong>Name:</strong> {currentUser.fullName}
              </div>
              <div>
                <strong>Department:</strong> {currentUser.department}
              </div>
              <div>
                <strong>Auth Status:</strong>{' '}
                {isAuthenticated ? (
                  <span className="text-emerald-700 font-semibold">Authenticated via Supabase</span>
                ) : (
                  <span className="text-amber-700 font-semibold">Unauthenticated Demo Session</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 border border-amber-200/60 rounded-xl p-3.5">
            <p className="font-medium text-amber-950">{getDenialExplanation()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={onNavigateAuthorized}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to My Authorized Dashboard</span>
            </button>

            {!isAuthenticated ? (
              <button
                onClick={onOpenSignIn}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Authorized Account</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
