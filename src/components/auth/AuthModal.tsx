import React, { useState } from 'react';
import { supabase, isSupabaseConfigured, fetchSupabaseProfile, upsertSupabaseProfile } from '../../lib/supabaseClient';
import { dataStore } from '../../lib/dataStore';
import { UserRole } from '../../types';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Inbox,
  Building,
  KeyRound,
} from 'lucide-react';

export type AuthView =
  | 'sign_in'
  | 'sign_up'
  | 'verification_pending'
  | 'forgot_password'
  | 'reset_password_confirm';

interface AuthModalProps {
  isOpen: boolean;
  initialView?: AuthView;
  onClose: () => void;
  onAuthSuccess: (user: any, role: UserRole) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialView = 'sign_in',
  onClose,
  onAuthSuccess,
}) => {
  const [view, setView] = useState<AuthView>(initialView);

  // Sign In & Sign Up Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<'citizen' | 'dept_officer' | 'city_admin'>('citizen');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  if (!isOpen) return null;

  // Validation
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // --- 1. SIGN IN FLOW ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setRegisteredEmail(email.trim());
          setView('verification_pending');
          setErrorMsg('Your email is not verified yet. Please check your inbox or resend the link.');
          return;
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please verify and try again.');
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      if (data.user) {
        // Fetch user profile from public.profiles or user metadata
        const profile = await fetchSupabaseProfile(data.user.id);
        const resolvedName =
          profile?.full_name ||
          data.user.user_metadata?.full_name ||
          localStorage.getItem(`civicsync_name_${data.user.id}`) ||
          (data.user.email ? localStorage.getItem(`civicsync_name_${data.user.email.toLowerCase()}`) : null) ||
          localStorage.getItem('civicsync_registered_name') ||
          data.user.email?.split('@')[0] ||
          'Registered User';

        const assignedRole: UserRole = profile?.role || 'citizen';
        dataStore.setAuthenticatedUser({
          id: data.user.id,
          email: data.user.email || email.trim(),
          fullName: resolvedName,
          role: assignedRole,
          department:
            (profile?.department as any) ||
            (assignedRole === 'dept_officer'
              ? 'Highways & Road Infrastructure'
              : assignedRole === 'city_admin'
              ? 'City Municipal Corporation'
              : 'Public Citizen'),
          designation:
            profile?.designation ||
            (assignedRole === 'citizen'
              ? 'Resident Civic Monitor'
              : assignedRole === 'dept_officer'
              ? 'Divisional Engineer'
              : 'Municipal Administrator'),
        });
        onAuthSuccess(data.user, assignedRole);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. SIGN UP FLOW ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    // 4 required fields validation
    if (!trimmedName) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      setErrorMsg('A valid email address is required.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters in length.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);

    try {
      localStorage.setItem('civicsync_registered_name', trimmedName);
      localStorage.setItem(`civicsync_name_${trimmedEmail.toLowerCase()}`, trimmedName);
    } catch {}

    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedName,
            requested_role: requestedRole,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      if (data.user) {
        try {
          localStorage.setItem(`civicsync_name_${data.user.id}`, trimmedName);
          await upsertSupabaseProfile({
            id: data.user.id,
            email: trimmedEmail,
            full_name: trimmedName,
            role: requestedRole,
            requested_role: requestedRole,
            department:
              requestedRole === 'dept_officer'
                ? 'Highways & Road Infrastructure'
                : requestedRole === 'city_admin'
                ? 'City Municipal Corporation'
                : 'Public Citizen',
          });
        } catch {}
      }

      if (data.session && data.user) {
        dataStore.setAuthenticatedUser({
          id: data.user.id,
          email: trimmedEmail,
          fullName: trimmedName,
          role: requestedRole,
          department:
            requestedRole === 'dept_officer'
              ? 'Highways & Road Infrastructure'
              : requestedRole === 'city_admin'
              ? 'City Municipal Corporation'
              : 'Public Citizen',
          designation:
            requestedRole === 'citizen'
              ? 'Resident Civic Monitor'
              : requestedRole === 'dept_officer'
              ? 'Divisional Engineer'
              : 'Municipal Administrator',
        });
        onAuthSuccess(data.user, requestedRole);
        onClose();
        return;
      }

      setRegisteredEmail(trimmedEmail);
      setView('verification_pending');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 3. RESEND VERIFICATION EMAIL ---
  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(`Verification email resent to ${registeredEmail}! Please check your inbox.`);
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. FORGOT PASSWORD FLOW ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !validateEmail(email.trim())) {
      setErrorMsg('Please enter a valid email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(`Password reset instructions sent to ${email.trim()}. Check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-md w-full overflow-hidden my-8">
        {/* Top Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-extrabold text-xs">
              IN
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-teal-300 uppercase">
              InfraNexus AI Auth
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {view === 'sign_in' && 'Sign In to InfraNexus'}
            {view === 'sign_up' && 'Create Your Account'}
            {view === 'verification_pending' && 'Check Your Inbox'}
            {view === 'forgot_password' && 'Reset Password'}
          </h2>

          <p className="text-xs text-slate-300 mt-0.5">
            {view === 'sign_in' && 'Access municipal works tracking, reports, and coordination.'}
            {view === 'sign_up' && 'Join the coordinated municipal infrastructure registry.'}
            {view === 'verification_pending' && 'Confirm your email address to activate session.'}
            {view === 'forgot_password' && "We'll send a secure password recovery link to your email."}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMsg}</span>
            </div>
          )}

          {/* --- VIEW: SIGN IN --- */}
          {view === 'sign_in' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setView('forgot_password');
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              </button>

              <div className="text-center pt-2 text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setView('sign_up');
                  }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* --- VIEW: SIGN UP --- */}
          {view === 'sign_up' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              {/* Field 1: Full Name */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">1. Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. S. Karthik Ramanathan"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">2. Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Field 3: Password */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">3. Password (min 6 chars) *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Field 4: Confirm Password */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">4. Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Separate Role Selection (Account Type) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">Requested Account Type *</label>
                <select
                  value={requestedRole}
                  onChange={(e) => setRequestedRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
                >
                  <option value="citizen">Public Citizen (Residents, Commuters, Civic Monitors)</option>
                  <option value="dept_officer">Department Engineer (Highways, Water, Power, Telecom)</option>
                  <option value="city_admin">City Administrator (Zonal Authority & Municipal Commission)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                  🛡️ <strong>Security Enforcement:</strong> Public sign-up automatically assigns the <em>Public Citizen</em> role. Requested engineer or administrator privileges are saved for administrative verification.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50 mt-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isLoading ? 'Creating Account...' : 'Complete Sign Up'}</span>
              </button>

              <div className="text-center pt-1 text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setView('sign_in');
                  }}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Sign In instead
                </button>
              </div>
            </form>
          )}

          {/* --- VIEW: EMAIL VERIFICATION PENDING ("Check your inbox") --- */}
          {view === 'verification_pending' && (
            <div className="space-y-4 text-center py-2 animate-in fade-in">
              <div className="w-14 h-14 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto">
                <Inbox className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">Check your inbox</h3>
                <p className="text-slate-600 mt-1">
                  We sent a confirmation link to:
                </p>
                <div className="mt-1 font-mono font-bold text-slate-900 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 inline-block text-[11px]">
                  {registeredEmail || email}
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 text-left space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-teal-700" />
                  What to do next:
                </div>
                <p>1. Open your Gmail or email inbox.</p>
                <p>2. Click the <strong>Confirm your email</strong> link in the message sent by Supabase.</p>
                <p>3. You will be redirected back to InfraNexus AI with your verified session activated.</p>
                <p className="text-amber-800 font-medium pt-1">
                  💡 Don't see it? Please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setView('sign_in');
                  }}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer text-xs"
                >
                  ← Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* --- VIEW: FORGOT PASSWORD --- */}
          {view === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <p className="text-slate-600 leading-relaxed">
                  Enter your registered email address and we'll send you a password recovery link.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{isLoading ? 'Sending Link...' : 'Send Recovery Email'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setSuccessMsg(null);
                    setView('sign_in');
                  }}
                  className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
