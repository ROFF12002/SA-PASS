import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { deriveKey } from './lib/encryption';
import { I18nProvider, useI18n } from './lib/i18n';
import * as db from './lib/db';
import { Language, Theme } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import AdminDashboard from './components/AdminDashboard';

// ضع إيميل المطور الخاص بك هنا بدلاً من هذا الإيميل
const DEVELOPER_EMAIL = 'Khalerdkolkolkol@gmail.com'.toLowerCase();

function AppContent() {
  const { language, setLanguage: setI18nLanguage } = useI18n();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [theme, setThemeState] = useState<Theme>(() =>
    (localStorage.getItem('pm_theme') as Theme) || 'dark'
  );
  const [page, setPage] = useState<'dashboard' | 'settings' | 'admin'>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [calmMode, setCalmMode] = useState(() => localStorage.getItem('sampass_calm') === 'true');
  const [openAddModal, setOpenAddModal] = useState(false);

  // Calm mode
  useEffect(() => {
    document.body.classList.toggle('calm-mode', calmMode);
    localStorage.setItem('sampass_calm', String(calmMode));
  }, [calmMode]);

  // Check onboarding status
  useEffect(() => {
    const done = localStorage.getItem('sampass_onboarding_done');
    if (!done) {
      setShowOnboarding(true);
    }
  }, []);

  // ─── Theme ────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('pm_theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  // ─── Online / Offline ─────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ─── Auth State ───────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email || '' });
          
          const savedMp = localStorage.getItem('sampass_mp');
          if (savedMp) {
            const key = await deriveKey(savedMp, session.user.id);
            setEncryptionKey(key);
            setPage('dashboard');
          }
        }
      } catch {
        // ignore session check errors
      } finally {
        setInitializing(false);
      }
    };
    init();

    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser({ id: session.user.id, email: session.user.email || '' });
        
        const savedMp = localStorage.getItem('sampass_mp');
        if (savedMp) {
          const key = await deriveKey(savedMp, session.user.id);
          setEncryptionKey(key);
          setPage('dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setEncryptionKey(null);
        localStorage.removeItem('sampass_mp');
        setPage('dashboard');
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // ─── Auth Success ─────────────────────────
  const handleAuthSuccess = useCallback(async (password: string) => {
    let userId = user?.id;
    if (!userId) {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (session?.user) {
        userId = session.user.id;
        setUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        throw new Error('No active session');
      }
    }
    const key = await deriveKey(password, userId);
    setEncryptionKey(key);
    localStorage.setItem('sampass_mp', password);
    setPage('dashboard');
  }, [user]);

  // ─── Logout ───────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    localStorage.removeItem('sampass_mp');
    setUser(null);
    setEncryptionKey(null);
    setPage('dashboard');
  }, []);

  // ─── Sync ─────────────────────────────────
  const syncNow = useCallback(async () => {
    const userId = user?.id;
    if (!userId || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      // ── Pull from Supabase ──
      const { data, error: pullError } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', userId);

      if (pullError) {
        // Table might not exist — that's OK
        const msg = pullError.message || '';
        const isTableMissing =
          msg.includes('does not exist') ||
          msg.includes('not found') ||
          msg.includes('relation') ||
          msg.includes('404') ||
          msg.includes('406') ||
          msg.includes('Undefined');
        if (!isTableMissing) {
          console.warn('Pull warning:', pullError);
        }
      } else {
        // Merge remote entries into IndexedDB
        for (const remote of data || []) {
          const mapped = {
            id: remote.id,
            userId: remote.user_id,
            websiteName: remote.website_name || '',
            websiteUrl: remote.website_url || '',
            username: remote.username || '',
            encryptedPassword: remote.encrypted_password || '',
            notes: remote.notes || '',
            category: remote.category || 'other',
            pinned: remote.pinned || false,
            lastUsedAt: remote.last_used_at || '',
            createdAt: remote.created_at,
            updatedAt: remote.updated_at,
            syncStatus: 'synced' as const,
          };
          const local = await db.getPassword(remote.id);
          if (!local || new Date(remote.updated_at) > new Date(local.updatedAt)) {
            await db.savePassword(mapped);
          }
        }
      }

      // ── Push pending local changes ──
      const pending = await db.getPendingPasswords(userId);
      for (const entry of pending) {
        try {
          const { error: upsertError } = await supabase.from('passwords').upsert(
            {
              id: entry.id,
              user_id: entry.userId,
              website_name: entry.websiteName,
              website_url: entry.websiteUrl,
              username: entry.username,
              encrypted_password: entry.encryptedPassword,
              notes: entry.notes,
              category: entry.category,
              updated_at: entry.updatedAt,
            },
            { onConflict: 'id' }
          );
          if (!upsertError) {
            await db.updateSyncStatus(entry.id, 'synced');
          }
        } catch {
          // Skip this entry, keep as pending
        }
      }

      setLastSyncTime(new Date());
    } catch {
      // Catch-all — sync is best-effort
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, isSyncing]);

  // ─── Language ─────────────────────────────
  const handleSetLanguage = useCallback(
    (lang: Language) => setI18nLanguage(lang),
    [setI18nLanguage]
  );

  // ─── Render ───────────────────────────────
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <img src="/icon.png" alt="Logo" className="w-16 h-16 object-contain rounded-2xl shadow-lg shadow-indigo-500/30" />
        </div>
      </div>
    );
  }

  // Not authenticated or key not derived
  if (!user || !encryptionKey) {
    return <Auth onAuthSuccess={handleAuthSuccess} mode={user ? 'unlock' : 'auth'} />;
  }

  // Onboarding
  if (showOnboarding && user && encryptionKey) {
    return (
      <Onboarding
        onComplete={() => {
          setShowOnboarding(false);
          localStorage.setItem('sampass_onboarding_done', 'true');
        }}
        onAddFirst={() => {
          setShowOnboarding(false);
          localStorage.setItem('sampass_onboarding_done', 'true');
          setOpenAddModal(true);
        }}
      />
    );
  }

  // Settings
  if (page === 'settings') {
    const isAdmin = user?.email?.toLowerCase() === DEVELOPER_EMAIL;
    
    return (
      <Settings
        userEmail={user.email}
        language={language}
        theme={theme}
        calmMode={calmMode}
        isOnline={isOnline}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onSetLanguage={handleSetLanguage}
        onSetTheme={setTheme}
        onSetCalmMode={setCalmMode}
        onSync={syncNow}
        onLogout={handleLogout}
        onBack={() => setPage('dashboard')}
        onGoToAdmin={isAdmin ? () => setPage('admin') : undefined}
      />
    );
  }

  // Admin Dashboard
  if (page === 'admin') {
    const isAdmin = user?.email?.toLowerCase() === DEVELOPER_EMAIL;
    
    // حماية إضافية: إذا حاول شخص فتح الصفحة ولم يكن المطور
    if (!isAdmin) {
      setPage('dashboard');
      return null;
    }

    return (
      <AdminDashboard 
        userEmail={user.email} 
        onBack={() => setPage('settings')} 
      />
    );
  }

  // Dashboard
  return (
    <Dashboard
      user={user}
      encryptionKey={encryptionKey}
      isOnline={isOnline}
      onOpenSettings={() => setPage('settings')}
      openAddModal={openAddModal}
      onAddModalOpened={() => setOpenAddModal(false)}
    />
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
