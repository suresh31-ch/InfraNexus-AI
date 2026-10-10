import React, { useState } from 'react';
import { supabase, fetchSupabaseProfile, upsertSupabaseProfile } from '../../lib/supabaseClient';
import { dataStore } from '../../lib/dataStore';
import { UserRole } from '../../types';
import {
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
  Compass,
  ArrowLeft
} from 'lucide-react';

interface AuthPageProps {
  initialMode: 'sign_in' | 'register' | 'forgot_password';
  onNavigate: (path: string) => void;
  onAuthSuccess: (user: any, role: UserRole) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  onNavigate,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'sign_in' | 'register' | 'verification_pending' | 'forgot_password'>(
    initialMode === 'register' ? 'register' : initialMode === 'forgot_password' ? 'forgot_password' : 'sign_in'
  );

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requestedRole, setRequestedRole] = useState<'citizen' | 'dept_officer' | 'city_admin'>('citizen');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  // 1. Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your email address and password.');
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
          setMode('verification_pending');
          setErrorMsg('Your email has not been verified yet. Check your inbox or resend the verification email below.');
          return;
        }
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
          return;
        }
        setErrorMsg(error.message);
        return;
      }

      if (data.user) {
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
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Sign Up (Registration)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

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

    // Cache name immediately before network request
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

      // If session returned immediately
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
        return;
      }

      setRegisteredEmail(trimmedEmail);
      setMode('verification_pending');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Resend Verification
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

      setSuccessMsg(`Verification link resent to ${registeredEmail}! Please check your Gmail or email inbox.`);
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
      setErrorMsg(err.message || 'Failed to resend verification link.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Forgot Password
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

      setSuccessMsg(`Password reset instructions sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 max-w-xl mx-auto px-4">
      {/* Return link */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => onNavigate('/')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Overview</span>
        </button>

        <span className="text-[11px] font-mono text-slate-400">
          Supabase PostgreSQL Auth
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-slate-900 text-white relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-extrabold text-xs">
              IN
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-teal-300 uppercase">
              InfraNexus AI Authentication
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {mode === 'sign_in' && 'Sign In to Your Workspace'}
            {mode === 'register' && 'Register InfraNexus Account'}
            {mode === 'verification_pending' && 'Check Your Email Inbox'}
            {mode === 'forgot_password' && 'Reset Account Password'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md">
            {mode === 'sign_in' &&
              'Access municipal works coordination, clash resolution, or citizen reporting.'}
            {mode === 'register' &&
              'Create your account with role selection for Public Citizen, Highways Engineer, or City Admin.'}
            {mode === 'verification_pending' &&
              'Please verify your email address to authenticate your session with Supabase.'}
            {mode === 'forgot_password' &&
              'Enter your registered email to receive secure password recovery instructions.'}
          </p>

          {/* Mode Switcher Tabs */}
          {(mode === 'sign_in' || mode === 'register') && (
            <div className="flex gap-2 mt-6 p-1 bg-slate-800/90 rounded-xl max-w-xs border border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('sign_in');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'sign_in'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setSuccessMsg(null);
                  setMode('register');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-teal-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5 text-xs">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-900 rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Authentication Error: </span>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Success: </span>
                {successMsg}
              </div>
            </div>
          )}

          {/* --- VIEW: SIGN IN --- */}
          {mode === 'sign_in' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sureshsmart669@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-800">Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setSuccessMsg(null);
                      setMode('forgot_password');
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50 text-sm mt-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isLoading ? 'Signing In...' : 'Sign In to Workspace'}</span>
              </button>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                💡 <strong>Need an evaluation account?</strong> Click{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Register
                </button>{' '}
                to create an account with email verification, or use the quick role dropdown in the header.
              </div>
            </form>
          )}

          {/* --- VIEW: REGISTER (SIGN UP) --- */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Field 1: Full Name */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">1. Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suresh Kumar"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Email Address */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">2. Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sureshsmart669@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  A verification email will be dispatched to this address via Supabase Auth.
                </p>
              </div>

              {/* Field 3: Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">3. Password (min 6) *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">4. Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Field 5: Requested Role Selection */}
              <div className="pt-1">
                <label className="font-bold text-slate-800 block mb-1.5">
                  5. Requested Account Type & Role *
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      requestedRole === 'citizen'
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requested_role"
                      value="citizen"
                      checked={requestedRole === 'citizen'}
                      onChange={() => setRequestedRole('citizen')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Public Citizen (Dashboard D1)</div>
                      <div className="text-[11px] text-slate-500">
                        Resident access to roadworks registry, road issue reporting, and public advisories.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      requestedRole === 'dept_officer'
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requested_role"
                      value="dept_officer"
                      checked={requestedRole === 'dept_officer'}
                      onChange={() => setRequestedRole('dept_officer')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">Highways Engineer (Dashboard D2)</div>
                      <div className="text-[11px] text-slate-500">
                        Corridor project scheduling, conflict detection workbench, and assigned repairs.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      requestedRole === 'city_admin'
                        ? 'border-teal-500 bg-teal-50/60 ring-1 ring-teal-500'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="requested_role"
                      value="city_admin"
                      checked={requestedRole === 'city_admin'}
                      onChange={() => setRequestedRole('city_admin')}
                      className="mt-0.5 text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <div className="font-bold text-slate-900">City Administrator (Dashboard D3)</div>
                      <div className="text-[11px] text-slate-500">
                        Inter-departmental coordination, spatial conflict approvals, and audit trail logs.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed mt-2.5">
                  🛡️ <strong>Database Security Enforcement:</strong> Self-registration creates a secured profile. If an engineer or admin role is chosen, the system registers the account and defaults initial access to Citizen until department verification is granted by the municipal admin.
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50 text-sm mt-3"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
              </button>

              <div className="text-center pt-1 text-slate-500 text-xs">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('sign_in')}
                  className="font-bold text-teal-700 hover:underline cursor-pointer"
                >
                  Sign In instead
                </button>
              </div>
            </form>
          )}

          {/* --- VIEW: VERIFICATION PENDING --- */}
          {mode === 'verification_pending' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Inbox className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Check Your Email Inbox</h2>
                <p className="text-slate-600 text-xs mt-1">
                  A Supabase verification email has been sent to:
                </p>
                <div className="mt-2 font-mono font-bold text-slate-900 bg-slate-100 py-1.5 px-4 rounded-lg border border-slate-200 inline-block text-xs">
                  {registeredEmail || email}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-left space-y-2 leading-relaxed">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-teal-700" />
                  <span>Next Steps:</span>
                </div>
                <p>1. Open your <strong>Gmail</strong> or inbox app.</p>
                <p>2. Open the email titled <strong>"Confirm your signup"</strong>.</p>
                <p>3. Click the verification button to confirm your account.</p>
                <p className="text-amber-800 text-[11px] pt-1">
                  💡 Don't see it? Please check your <strong>Spam</strong> or <strong>Promotions</strong> folder.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading || resendCooldown > 0}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('sign_in')}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer text-xs"
                >
                  ← Return to Sign In
                </button>
              </div>
            </div>
          )}

          {/* --- VIEW: FORGOT PASSWORD --- */}
          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-slate-600 text-xs leading-relaxed">
                Enter your registered email address and Supabase Auth will send you a secure link to reset your account password.
              </p>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sureshsmart669@gmail.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50 text-sm"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                <span>{isLoading ? 'Sending Link...' : 'Send Password Reset Email'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setMode('sign_in')}
                  className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer text-xs"
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
