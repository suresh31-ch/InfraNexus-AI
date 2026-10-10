import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { dataStore } from '../lib/dataStore';
import { supabase, upsertSupabaseProfile } from '../lib/supabaseClient';
import {
  User,
  Mail,
  Shield,
  Building,
  CheckCircle2,
  Lock,
  Key,
  LogOut,
  X,
  Edit2,
  Save,
  Loader2,
  FileText
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  userRole: UserRole;
  onClose: () => void;
  onSignOut: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  currentUser,
  userRole,
  onClose,
  onSignOut,
  onProfileUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(currentUser.fullName);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedName.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const trimmed = editedName.trim();
      dataStore.updateAuthenticatedUserName(trimmed);

      // Save to Supabase if authenticated
      if (currentUser.id && !currentUser.id.startsWith('guest_')) {
        await upsertSupabaseProfile({
          id: currentUser.id,
          full_name: trimmed,
          email: currentUser.email,
          role: userRole,
          department: currentUser.department,
        });

        // Also update auth user metadata
        try {
          await supabase.auth.updateUser({
            data: { full_name: trimmed },
          });
        } catch {}
      }

      const updated: UserProfile = {
        ...currentUser,
        fullName: trimmed,
      };

      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile name.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'citizen':
        return {
          label: 'Public Citizen (D1)',
          color: 'bg-teal-50 text-teal-800 border-teal-200',
        };
      case 'dept_officer':
        return {
          label: 'Highways Engineer (D2)',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
        };
      case 'city_admin':
        return {
          label: 'City Administrator (D3)',
          color: 'bg-purple-50 text-purple-800 border-purple-200',
        };
      default:
        return {
          label: 'Public Visitor',
          color: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const badge = getRoleBadge(userRole);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-inner border border-teal-400/30">
              {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {currentUser.fullName || 'Registered User'}
                </h3>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                {currentUser.email || 'Anonymous Session'}
              </p>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.color}`}>
                  <Shield className="w-3 h-3" />
                  <span>{badge.label}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full name successfully updated and synchronized with Supabase!</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
              {saveError}
            </div>
          )}

          {/* Edit Name Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-700" />
                <span>Display Name</span>
              </label>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditedName(currentUser.fullName);
                    setIsEditing(true);
                  }}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveName} className="space-y-3">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 font-medium"
                  placeholder="Enter your full name"
                  autoFocus
                />
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !editedName.trim()}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Name</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-sm font-semibold text-slate-900">
                {currentUser.fullName || 'Not specified'}
              </div>
            )}
          </div>

          {/* Profile Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 block text-[11px] font-medium">Department</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {currentUser.department || 'Public Citizen'}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-slate-400 block text-[11px] font-medium">Designation</span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {currentUser.designation || 'Registered User'}
              </span>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl sm:col-span-2">
              <span className="text-slate-400 block text-[11px] font-medium">Account ID</span>
              <span className="font-mono text-[11px] text-slate-600 break-all select-all block mt-0.5">
                {currentUser.id}
              </span>
            </div>
          </div>

          {/* Authorization & Security Notice */}
          <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs space-y-1">
            <div className="font-bold text-teal-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <p className="text-teal-800 text-[11px] leading-relaxed">
              Your session role is authenticated via Supabase. Privileged actions (e.g. clash recalculations, inter-departmental accords, schedule overrides) require official municipal agency verification.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
