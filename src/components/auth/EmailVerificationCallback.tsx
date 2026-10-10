import React, { useEffect, useState, useRef } from 'react';
import { supabase, fetchSupabaseProfile } from '../../lib/supabaseClient';
import { UserRole } from '../../types';
import { CheckCircle2, AlertCircle, KeyRound, Loader2, X, ArrowRight } from 'lucide-react';

interface EmailVerificationCallbackProps {
  onSessionEstablished: (user: any, role: UserRole) => void;
  onOpenAuthModal: (view?: 'sign_in' | 'sign_up' | 'verification_pending') => void;
}

export const EmailVerificationCallback: React.FC<EmailVerificationCallbackProps> = ({
  onSessionEstablished,
  onOpenAuthModal,
}) => {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified' | 'recovery' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Guard against duplicate execution across re-renders
  const processedRef = useRef(false);
  const authListenerRef = useRef<any>(null);
  const onSessionEstablishedRef = useRef(onSessionEstablished);
  onSessionEstablishedRef.current = onSessionEstablished;

  // Auto-dismiss success notification after 5 seconds
  useEffect(() => {
    if (status === 'verified') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    // Only evaluate once per mount
    if (processedRef.current) return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Quick exit: If no auth tokens, errors, or recovery flags exist in the URL, stay completely idle
    const hasAuthTokens =
      hash.includes('error=') ||
      search.includes('error=') ||
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      hash.includes('type=signup') ||
      hash.includes('type=email_change') ||
      hash.includes('access_token=') ||
      search.includes('code=');

    if (!hasAuthTokens) {
      return;
    }

    processedRef.current = true;

    const handleAuthRedirect = async () => {
      // 1. Check for Supabase error in hash or search
      if (hash.includes('error=') || search.includes('error=')) {
        const params = new URLSearchParams(hash ? hash.substring(1) : search);
        const errorDesc = params.get('error_description') || 'Verification link expired or invalid.';
        setStatus('error');
        setStatusMessage(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        // Strip error tokens from URL so they don't persist on subsequent navigation
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 2. Check for Password Recovery flow
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setStatus('recovery');
        if (window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // 3. Check for Email confirmation signup or invite
      if (
        hash.includes('type=signup') ||
        hash.includes('type=email_change') ||
        hash.includes('access_token=') ||
        search.includes('code=')
      ) {
        setStatus('verifying');
        setStatusMessage('Verifying your email token with Supabase Auth...');

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            setStatus('error');
            setStatusMessage(error.message || 'Verification token expired.');
            if (window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            return;
          }

          if (session && session.user) {
            // Strip tokens from URL first so state navigation has a clean URL
            if (window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }

            setStatus('verified');
            setStatusMessage(`Email ${session.user.email} successfully confirmed!`);

            // Fetch profile role or default to citizen
            const profile = await fetchSupabaseProfile(session.user.id);
            const role: UserRole = profile?.role || 'citizen';
            onSessionEstablishedRef.current(session.user, role);
          } else {
            // Wait for asynchronous token exchange if session not yet hydrated
            const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
              if (event === 'SIGNED_IN' && currentSession?.user) {
                if (window.history.replaceState) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
                setStatus('verified');
                setStatusMessage(`Email ${currentSession.user.email} confirmed! Welcome to InfraNexus AI.`);
                const profile = await fetchSupabaseProfile(currentSession.user.id);
                const role: UserRole = profile?.role || 'citizen';
                onSessionEstablishedRef.current(currentSession.user, role);
                authListener.subscription.unsubscribe();
              }
            });
            authListenerRef.current = authListener;
          }
        } catch (err: any) {
          setStatus('error');
          setStatusMessage(err.message || 'Failed to complete email confirmation.');
        }
      }
    };

    handleAuthRedirect();

    return () => {
      if (authListenerRef.current) {
        authListenerRef.current.subscription?.unsubscribe?.();
      }
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setStatus('verified');
      setStatusMessage('Password updated successfully! Your session is now active.');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await fetchSupabaseProfile(user.id);
        onSessionEstablishedRef.current(user, profile?.role || 'citizen');
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (status === 'idle') return null;

  return (
    <div className="mb-4">
      {status === 'verifying' && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
            <span className="font-semibold">{statusMessage}</span>
          </div>
        </div>
      )}

      {status === 'verified' && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-extrabold block text-sm">Email Verified Successfully!</span>
              <span className="text-emerald-800 text-[11px]">{statusMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setStatus('idle')}
            className="p-1 text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-950 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold block text-sm">Verification Link Issue</span>
              <span className="text-red-800 text-[11px]">{statusMessage}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenAuthModal('sign_in')}
              className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              Sign In / Resend
            </button>
            <button
              onClick={() => setStatus('idle')}
              className="p-1 text-red-600 hover:text-red-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {status === 'recovery' && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-md text-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-teal-700" />
              <span className="font-bold text-slate-900 text-sm">Set New Password</span>
            </div>
            <button
              onClick={() => setStatus('idle')}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">New Password (min 6 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUpdatingPassword ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
