import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useI18n } from '../lib/i18n';

interface AuthProps {
  onAuthSuccess: (password: string) => Promise<void> | void;
  mode: 'auth' | 'unlock';
}

export default function Auth({ onAuthSuccess, mode }: AuthProps) {
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const clearError = () => setError('');

  // ─── Login ──────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) { setError(t('auth.emailRequired')); return; }
    if (!password) { setError(t('auth.passwordRequired')); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('invalid login credentials') || msg.includes('invalid password') || msg.includes('email not confirmed')) {
          throw new Error(t('auth.invalidCredentials'));
        }
        throw new Error(t('auth.loginError'));
      }
      await onAuthSuccess(password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Signup ─────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!email.trim()) { setError(t('auth.emailRequired')); return; }
    if (!password) { setError(t('auth.passwordRequired')); return; }
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
          throw new Error(t('auth.loginError'));
        }
        throw new Error(t('auth.signupError'));
      }
      // ✅ Signup succeeded — show confirmation screen
      setSignupSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.signupError'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Unlock ─────────────────────────────────
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!password) { setError(t('auth.passwordRequired')); return; }
    setLoading(true);
    try {
      await onAuthSuccess(password);
    } catch {
      setError(t('auth.unlockError'));
    } finally {
      setLoading(false);
    }
  };

  // ─── Icons ──────────────────────────────────
  const ShieldIcon = () => (
    <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
  );
  const LockIcon = () => (
    <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
  );

  // ═══════════════════════════════════════════
  //  UNLOCK MODE
  // ═══════════════════════════════════════════
  if (mode === 'unlock') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
        <div className="w-full max-w-md animate-scaleIn">
          <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-8">
            <div className="text-center mb-8">
              <div className="w-24 h-24 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
                <LockIcon />
              </div>
              <h2 className="text-2xl font-bold text-white">{t('auth.unlockTitle')}</h2>
              <p className="text-slate-400 mt-2 text-sm">{t('auth.unlockDescription')}</p>
            </div>
            <form onSubmit={handleUnlock} className="space-y-5">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder={t('auth.password')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  autoFocus
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {t('auth.unlocking')}
                  </span>
                ) : t('auth.unlockButton')}
              </button>
            </form>
            {error && (
              <div className="mt-5 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  SIGNUP SUCCESS — CHECK EMAIL SCREEN
  // ═══════════════════════════════════════════
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
        <div className="w-full max-w-md animate-scaleIn">
          <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-float">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-emerald-400 mb-2">
              {t('auth.emailSent')}
            </h2>
            <p className="text-white text-lg font-semibold mb-2">
              {t('auth.checkEmail')}
            </p>

            {/* Email shown */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-xl mt-2 mb-4">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span className="text-indigo-300 text-sm font-medium" dir="ltr">{email}</span>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {t('auth.checkEmailDesc')}
            </p>

            {/* Go to Login Button */}
            <button
              onClick={() => {
                setSignupSuccess(false);
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
                clearError();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] text-base"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t('auth.goToLogin')}
              </span>
            </button>
          </div>

          {/* Developer Watermark */}
          <div className="mt-6 text-center">
            <p className="text-slate-500 text-xs">{t('settings.madeWith')}</p>
            <p className="text-slate-600 text-[11px] mt-1 font-medium">
              {t('settings.developedBy')} <span className="text-indigo-400 font-bold">{t('settings.developerAlias')}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  //  LOGIN / SIGNUP MODE
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 p-4">
      <div className="w-full max-w-md animate-scaleIn">
        <div className="bg-white/10 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 p-8">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 hover:scale-105 transition-transform duration-300">
              <ShieldIcon />
            </div>
            <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
            <p className="text-slate-400 mt-1 text-sm">{t('app.tagline')}</p>
          </div>

          {/* Tabs */}
          <div className="flex mb-6 bg-white/10 dark:bg-slate-800/80 rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setIsLogin(true); clearError(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              onClick={() => { setIsLogin(false); clearError(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                !isLogin ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('auth.signup')}
            </button>
          </div>

          {/* ─── Login Form ─── */}
          {isLogin && (
            <form onSubmit={handleLogin} className="space-y-4 animate-fadeIn">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder={t('auth.email')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  dir="ltr"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder={t('auth.password')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {t('auth.loggingIn')}
                  </span>
                ) : t('auth.loginButton')}
              </button>
            </form>
          )}

          {/* ─── Signup Form ─── */}
          {!isLogin && (
            <form onSubmit={handleSignup} className="space-y-4 animate-fadeIn">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  placeholder={t('auth.email')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  dir="ltr"
                  autoFocus
                />
              </div>
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder={t('auth.password')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  dir="ltr"
                />
              </div>
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                  placeholder={t('auth.confirmPassword')}
                  className="w-full px-4 py-3.5 bg-white/10 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-base"
                  dir="ltr"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    {t('auth.signingUp')}
                  </span>
                ) : t('auth.signupButton')}
              </button>
            </form>
          )}

          {/* Switch Login/Signup */}
          <p className="text-center text-slate-500 text-sm mt-6">
            {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
            <button
              onClick={() => { setIsLogin(!isLogin); clearError(); }}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isLogin ? t('auth.noAccountLink') : t('auth.hasAccountLink')}
            </button>
          </p>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Developer Watermark */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">{t('settings.madeWith')}</p>
          <p className="text-slate-600 text-[11px] mt-1 font-medium">
            {t('settings.developedBy')} <span className="text-indigo-400 font-bold">{t('settings.developerAlias')}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
