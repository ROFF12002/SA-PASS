import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { encrypt, decrypt } from '../lib/encryption';
import * as db from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { PasswordEntry, ToastMessage } from '../types';
import PasswordModal, { FormData } from './PasswordModal';
import MySpaces from './MySpaces';

interface DashboardProps {
  user: { id: string; email: string };
  encryptionKey: CryptoKey;
  isOnline: boolean;
  onOpenSettings: () => void;
  openAddModal?: boolean;
  onAddModalOpened?: () => void;
}

const AVATAR_GRADIENTS = [
  'from-red-500 to-pink-500',
  'from-orange-500 to-amber-500',
  'from-amber-500 to-yellow-500',
  'from-emerald-500 to-teal-500',
  'from-teal-500 to-cyan-500',
  'from-cyan-500 to-sky-500',
  'from-sky-500 to-blue-500',
  'from-blue-500 to-indigo-500',
  'from-indigo-500 to-violet-500',
  'from-violet-500 to-purple-500',
  'from-purple-500 to-fuchsia-500',
  'from-fuchsia-500 to-pink-500',
];

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

const ACCENT_MAP: Record<string, string> = {
  'instagram': 'accent-instagram', 'facebook': 'accent-facebook', 'twitter': 'accent-twitter',
  'x': 'accent-twitter', 'gmail': 'accent-gmail', 'github': 'accent-github',
  'linkedin': 'accent-linkedin', 'tiktok': 'accent-tiktok', 'whatsapp': 'accent-whatsapp',
  'telegram': 'accent-telegram', 'discord': 'accent-discord', 'spotify': 'accent-spotify',
  'netflix': 'accent-netflix', 'youtube': 'accent-youtube', 'amazon': 'accent-amazon',
  'paypal': 'accent-paypal', 'snapchat': 'accent-snapchat', 'pinterest': 'accent-pinterest',
  'reddit': 'accent-reddit', 'outlook': 'accent-outlook', 'dropbox': 'accent-dropbox',
  'slack': 'accent-slack', 'figma': 'accent-figma',
};

function getAccentClass(name: string): string {
  const key = name.toLowerCase().replace(/[\s.]/g, '');
  for (const [k, v] of Object.entries(ACCENT_MAP)) {
    if (key.includes(k)) return v;
  }
  return '';
}

const CATEGORIES = ['social', 'email', 'work', 'finance', 'shopping', 'dev', 'other'];

export default function Dashboard({ user, encryptionKey, isOnline, onOpenSettings, openAddModal, onAddModalOpened }: DashboardProps) {
  const { t, language } = useI18n();
  const [activeMainTab, setActiveMainTab] = useState<'vault' | 'spaces'>('vault');
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PasswordEntry | null>(null);
  const [editingPlainPassword, setEditingPlainPassword] = useState('');
  const [decryptedPasswords, setDecryptedPasswords] = useState<Map<string, string>>(new Map());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [quickAddPlatform, setQuickAddPlatform] = useState<{ name: string; url: string; category: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedUsernameId, setCopiedUsernameId] = useState<string | null>(null);
  const [categoriesLayout, setCategoriesLayout] = useState<'horizontal' | 'vertical'>(() => {
    return (localStorage.getItem('sampass_categories_layout') as 'horizontal' | 'vertical') || 'horizontal';
  });

  useEffect(() => {
    const handleLayoutChange = () => {
      setCategoriesLayout((localStorage.getItem('sampass_categories_layout') as 'horizontal' | 'vertical') || 'horizontal');
    };
    window.addEventListener('sampass_layout_change', handleLayoutChange);
    return () => window.removeEventListener('sampass_layout_change', handleLayoutChange);
  }, []);

  // Open add modal when triggered from onboarding
  useEffect(() => {
    if (openAddModal) {
      setEditingEntry(null);
      setEditingPlainPassword('');
      setShowModal(true);
      onAddModalOpened?.();
    }
  }, [openAddModal, onAddModalOpened]);

  // ─── Toast helper ──────────────────────────
  const addToast = useCallback((text: string, type: ToastMessage['type'], action?: { label: string; fn: () => void }) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, text, type, action }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, action ? 5000 : 3000);
  }, []);

  // ─── Load passwords ────────────────────────
  const loadPasswords = useCallback(async () => {
    try {
      const all = await db.getAllPasswords(user.id);
      setPasswords(all);
    } catch (err) {
      console.error('Failed to load passwords:', err);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  // ─── Sync with Supabase ───────────────────
  // showToast=false for auto-sync (silent), true for manual sync button
  const syncWithCloud = useCallback(async (showToast = false) => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);

    try {
      // ── Pull from Supabase ──
      const { data, error: pullError } = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', user.id);

      if (pullError) {
        // Table might not exist yet — that's OK, skip pull
        const msg = pullError.message || '';
        const isTableMissing =
          msg.includes('does not exist') ||
          msg.includes('not found') ||
          msg.includes('relation') ||
          msg.includes('404') ||
          msg.includes('406') ||
          msg.includes('Undefined') ||
          msg.includes('Requested resource not found');
        const isAuthError =
          msg.includes('JWT') ||
          msg.includes('token') ||
          msg.includes('session') ||
          msg.includes('401') ||
          msg.includes('403');

        if (isAuthError) {
          if (showToast) addToast(t('sync.authError'), 'error');
          return;
        }
        if (!isTableMissing && showToast) {
          console.error('Pull error:', pullError);
          // Don't block — try push anyway
        }
      } else {
        // Merge remote into local
        for (const remote of data || []) {
          const mapped: PasswordEntry = {
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
      const pending = await db.getPendingPasswords(user.id);
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
          } else {
            console.warn('Push error for entry', entry.id, upsertError);
          }
        } catch {
          // Skip this entry, try next
        }
      }

      await loadPasswords();

      // Show success only on manual sync
      if (showToast) {
        addToast(t('sync.complete'), 'success');
      }
    } catch {
      // Catch-all — don't crash the app
      if (showToast) {
        addToast(t('sync.localOnly'), 'info');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, user.id, loadPasswords, addToast, t]);

  // Auto-sync silently on mount and when coming online
  useEffect(() => {
    if (isOnline) {
      syncWithCloud(false); // silent — no toast
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  // ─── Save password ─────────────────────────
  const handleSave = async (formData: FormData) => {
    try {
      const encryptedPassword = await encrypt(formData.password, encryptionKey);
      const now = new Date().toISOString();

      const entry: PasswordEntry = {
        id: editingEntry?.id || crypto.randomUUID(),
        userId: user.id,
        websiteName: formData.websiteName.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        username: formData.username.trim(),
        encryptedPassword,
        notes: formData.notes.trim(),
        category: formData.category,
        pinned: editingEntry?.pinned || false,
        lastUsedAt: editingEntry?.lastUsedAt || '',
        createdAt: editingEntry?.createdAt || now,
        updatedAt: now,
        syncStatus: 'pending',
      };

      await db.savePassword(entry);

      // Push to Supabase if online
      if (isOnline) {
        try {
          const { error } = await supabase.from('passwords').upsert(
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
          if (!error) {
            await db.updateSyncStatus(entry.id, 'synced');
          }
        } catch (e) {
          console.error('Failed to push to cloud:', e);
        }
      }

      await loadPasswords();

      // Smart CTA: "Add another on same platform?"
      const savedPlatform = quickAddPlatform;
      setShowModal(false);
      setEditingEntry(null);
      setEditingPlainPassword('');
      setQuickAddPlatform(null);

      if (savedPlatform) {
        const pInfo = { name: savedPlatform.name, url: savedPlatform.url, category: savedPlatform.category };
        addToast(t('password.saved'), 'success', {
          label: t('password.addAnotherBtn'),
          fn: () => {
            setQuickAddPlatform(pInfo);
            setEditingEntry(null);
            setEditingPlainPassword('');
            setShowModal(true);
          },
        });
      } else {
        addToast(t('password.saved'), 'success');
      }
    } catch (err) {
      console.error('Save failed:', err);
      addToast(t('general.error'), 'error');
    }
  };

  // ─── Delete password (instant + undo) ──────
  const deletedRef = useRef<{ entry: PasswordEntry; timeout: ReturnType<typeof setTimeout> } | null>(null);

  const handleDelete = async (entry: PasswordEntry) => {
    try {
      // Save reference for undo
      const copy = { ...entry };
      await db.deletePassword(entry.id);
      if (isOnline) {
        try { await supabase.from('passwords').delete().eq('id', entry.id); } catch { /* skip */ }
      }
      await loadPasswords();

      // Show undo toast
      const undoTimeout = setTimeout(async () => {
        deletedRef.current = null;
      }, 5000);

      deletedRef.current = { entry: copy, timeout: undoTimeout };

      addToast(t('password.deletedUndo'), 'info', {
        label: t('password.undo'),
        fn: async () => {
          if (deletedRef.current) {
            clearTimeout(deletedRef.current.timeout);
            await db.savePassword(deletedRef.current.entry);
            if (isOnline) {
              try {
                await supabase.from('passwords').upsert({
                  id: deletedRef.current.entry.id,
                  user_id: deletedRef.current.entry.userId,
                  website_name: deletedRef.current.entry.websiteName,
                  website_url: deletedRef.current.entry.websiteUrl,
                  username: deletedRef.current.entry.username,
                  encrypted_password: deletedRef.current.entry.encryptedPassword,
                  notes: deletedRef.current.entry.notes,
                  category: deletedRef.current.entry.category,
                  updated_at: deletedRef.current.entry.updatedAt,
                }, { onConflict: 'id' });
              } catch { /* skip */ }
            }
            deletedRef.current = null;
            await loadPasswords();
            addToast(t('password.saved'), 'success');
          }
        },
      });
    } catch {
      addToast(t('general.error'), 'error');
    }
  };

  // ─── Pin / Unpin ────────────────────────────
  const togglePin = async (entry: PasswordEntry) => {
    const updated = { ...entry, pinned: !entry.pinned, updatedAt: new Date().toISOString(), syncStatus: 'pending' as const };
    await db.savePassword(updated);
    if (isOnline) {
      try {
        await supabase.from('passwords').upsert({
          id: updated.id, user_id: updated.userId, website_name: updated.websiteName,
          website_url: updated.websiteUrl, username: updated.username,
          encrypted_password: updated.encryptedPassword, notes: updated.notes,
          category: updated.category, pinned: updated.pinned, updated_at: updated.updatedAt,
        }, { onConflict: 'id' });
        await db.updateSyncStatus(updated.id, 'synced');
      } catch { /* skip */ }
    }
    await loadPasswords();
  };

  // ─── Toggle group expand ──────────────────
  const toggleGroup = (name: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  // ─── Quick add to existing platform ────────
  const openQuickAdd = (entries: PasswordEntry[]) => {
    const first = entries[0];
    setQuickAddPlatform({ name: first.websiteName, url: first.websiteUrl, category: first.category });
    setEditingEntry(null);
    setEditingPlainPassword('');
    setShowModal(true);
  };

  // ─── Toggle password visibility ────────────
  const toggleVisibility = async (entry: PasswordEntry) => {
    const next = new Map(decryptedPasswords);
    if (next.has(entry.id)) {
      next.delete(entry.id);
    } else {
      try {
        const plain = await decrypt(entry.encryptedPassword, encryptionKey);
        next.set(entry.id, plain);
        // Update lastUsedAt
        const updated = { ...entry, lastUsedAt: new Date().toISOString() };
        await db.savePassword(updated);
      } catch {
        addToast(t('general.error'), 'error');
        return;
      }
    }
    setDecryptedPasswords(next);
  };

  // ─── Copy password (with checkmark feedback) ─
  const handleCopy = async (entry: PasswordEntry) => {
    try {
      let plain = decryptedPasswords.get(entry.id);
      if (!plain) {
        plain = await decrypt(entry.encryptedPassword, encryptionKey);
      }
      await navigator.clipboard.writeText(plain);
      // Show checkmark on the button
      setCopiedId(entry.id);
      addToast(t('password.copied'), 'success');
      // Auto-hide after 0.6s
      setTimeout(() => setCopiedId(null), 600);
    } catch {
      addToast(t('general.error'), 'error');
    }
  };

  // ─── Copy username (with checkmark feedback) ─
  const handleCopyUsername = async (entry: PasswordEntry) => {
    try {
      await navigator.clipboard.writeText(entry.username);
      setCopiedUsernameId(entry.id);
      addToast(t('password.copied'), 'success'); // Reusing the same text or we can check translations
      setTimeout(() => setCopiedUsernameId(null), 600);
    } catch {
      addToast(t('general.error'), 'error');
    }
  };

  // ─── Open edit modal ──────────────────────
  const openEdit = async (entry: PasswordEntry) => {
    try {
      const plain = await decrypt(entry.encryptedPassword, encryptionKey);
      setEditingEntry(entry);
      setEditingPlainPassword(plain);
      setShowModal(true);
    } catch {
      addToast(t('general.error'), 'error');
    }
  };

  // ─── Filter & Group ────────────────────────
  const filtered = useMemo(() => {
    return passwords.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        p.websiteName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.websiteUrl.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [passwords, searchQuery, selectedCategory]);

  // Pinned entries
  const pinnedEntries = useMemo(() => {
    return filtered.filter(p => p.pinned);
  }, [filtered]);

  // Regular groups (non-pinned)
  const groups = useMemo(() => {
    const map = new Map<string, PasswordEntry[]>();
    for (const p of filtered) {
      if (p.pinned) continue; // pinned shown separately
      const key = p.websiteName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], language === 'ar' ? 'ar' : 'en'));
  }, [filtered, language]);

  // ─── Render ────────────────────────────────
  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${categoriesLayout === 'vertical' ? 'flex items-start' : 'flex flex-col'}`}>
      
      {/* --- SIDEBAR for Vertical Layout --- */}
      {categoriesLayout === 'vertical' && (
        <aside className="w-64 shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-e border-slate-200 dark:border-slate-800 h-screen sticky top-0 flex flex-col p-4 z-50 animate-fadeIn">
          <div className="flex items-center gap-2.5 shrink-0 mb-8 px-2">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('app.shortName')}
            </h1>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveMainTab('vault')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeMainTab === 'vault'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {t('dashboard.tabVault')}
            </button>
            <button
              onClick={() => setActiveMainTab('spaces')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeMainTab === 'spaces'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {t('dashboard.tabLaunchpad')}
            </button>
          </div>
        </aside>
      )}

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header — Entry stagger 1 */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 animate-fadeIn stagger-1">
          <div className="max-w-6xl w-full mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Logo (Only show if horizontal) */}
              {categoriesLayout !== 'vertical' && (
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
                    {t('app.shortName')}
                  </h1>
                </div>
              )}

            {/* Search */}
            <div className="flex-1 max-w-xl relative">
              <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('dashboard.search')}
                className="w-full ps-10 pe-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            {/* Online indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              {isOnline ? t('sync.online') : t('sync.offline')}
            </div>

            {/* Action buttons */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              title={t('dashboard.settings')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* --- MAIN TABS (Vault vs Spaces) - Horizontal Only --- */}
        {categoriesLayout !== 'vertical' && (
          <div className="max-w-6xl w-full mx-auto px-4 pb-0">
            <div className="flex items-center gap-6 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveMainTab('vault')}
                className={`pb-3 text-sm font-medium transition-all relative ${
                  activeMainTab === 'vault'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {t('dashboard.tabVault')}
                {activeMainTab === 'vault' && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>
              <button
                onClick={() => setActiveMainTab('spaces')}
                className={`pb-3 text-sm font-medium transition-all relative ${
                  activeMainTab === 'spaces'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {t('dashboard.tabLaunchpad')}
                {activeMainTab === 'spaces' && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl w-full mx-auto px-4 py-6">

        {activeMainTab === 'spaces' ? (
          <MySpaces />
        ) : (
          <div className="animate-fadeIn animate-slideUp">
            {/* Reassurance Banner — Entry stagger 2 */}
        <div className="mb-6 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl animate-fadeIn stagger-2">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/icon.png" alt="Logo" className="w-8 h-8 object-contain opacity-90 drop-shadow-md" />
          </div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
            {t('reassurance.title')}
          </p>
        </div>

        {/* Category pills — Entry stagger 3 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide animate-fadeIn stagger-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}
          >
            {t('dashboard.allCategories')}
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
              }`}
            >
              {t(`password.categories.${cat}`)}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-6 text-sm text-slate-500 dark:text-slate-400">
          <span>{passwords.length} {t('dashboard.totalPasswords')}</span>
          <span>•</span>
          <span>{groups.length} {t('dashboard.websites')}</span>
          {isSyncing && (
            <span className="flex items-center gap-1.5 text-indigo-500">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              {t('sync.syncing')}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && passwords.length === 0 && (
          <div className="text-center py-20 animate-fadeIn">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t('password.emptyTitle')}
            </h3>
            <p className="text-slate-400 text-sm mb-1">{t('password.emptyDesc')}</p>
            <p className="text-slate-500 dark:text-slate-500 text-xs">{t('password.emptyHint')}</p>
          </div>
        )}

        {/* No search results */}
        {!loading && filtered.length === 0 && passwords.length > 0 && (
          <div className="text-center py-12 animate-fadeIn">
            <p className="text-slate-400">{searchQuery ? `"${searchQuery}"` : ''}</p>
          </div>
        )}

        {/* ─── Expandable Platform Groups ─── */}
        {(() => {
          // Compact account row inside a group
          const renderRow = (entry: PasswordEntry, idx: number) => (
            <div key={entry.id} className="flex items-center gap-3 py-2.5 row-hover border-b border-slate-100 dark:border-slate-800 last:border-0 px-1 -mx-1 rounded-lg" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarGradient(entry.websiteName)} flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0`}>
                {entry.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer group" onClick={() => handleCopyUsername(entry)}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{entry.username}</p>
                  {entry.notes && <p className="text-[11px] text-slate-400 truncate">{entry.notes}</p>}
                </div>
                <button className={`p-1 rounded-md transition-all shrink-0 opacity-0 group-hover:opacity-100 ${copiedUsernameId === entry.id ? 'opacity-100 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`} title={t('password.copy')}>
                  {copiedUsernameId === entry.id ? (
                    <svg className="w-3.5 h-3.5 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 13.5-13.5" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                  )}
                </button>
              </div>
              <code className={`text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md max-w-[90px] truncate hidden sm:block ${decryptedPasswords.has(entry.id) ? 'text-slate-700 dark:text-slate-300 animate-blur-reveal' : 'password-dots'}`} dir="ltr">
                {decryptedPasswords.has(entry.id) ? decryptedPasswords.get(entry.id) : '●●●●●●●●'}
              </code>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => toggleVisibility(entry)} className="p-1.5 rounded-md action-btn text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" title={t('password.show')}>
                  {decryptedPasswords.has(entry.id) ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
                <button onClick={() => handleCopy(entry)} className={`p-1.5 rounded-md transition-all ${copiedId === entry.id ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`} title={t('password.copy')}>
                  {copiedId === entry.id ? (
                    <svg className="w-3.5 h-3.5 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 13.5-13.5" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg>
                  )}
                </button>
                <button onClick={() => togglePin(entry)} className={`p-1.5 rounded-md transition-all ${entry.pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`} title={t('password.pin')}>
                  <svg className="w-3.5 h-3.5" fill={entry.pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                </button>
                <button onClick={() => openEdit(entry)} className="p-1.5 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all" title={t('password.edit')}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
                <button onClick={() => setDeleteConfirmId(entry.id)} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title={t('password.delete')}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          );

          return (
            <>
              {/* ⭐ Pinned Section */}
              {!loading && pinnedEntries.length > 0 && (
                <div className="mb-6 animate-fadeIn">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">⭐</span>
                    <h2 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{t('password.pinnedSection')}</h2>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-500/20 overflow-hidden">
                    {pinnedEntries.map((e, i) => renderRow(e, i))}
                  </div>
                </div>
              )}

              {/* Expandable Platform Groups */}
              {!loading && groups.map(([websiteName, entries], gi) => {
                const isExpanded = expandedGroups.has(websiteName);
                const accentCls = getAccentClass(websiteName);
                return (
                  <div key={websiteName} className={`mb-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover-lift animate-slide-in stagger-4 ${accentCls}`} style={{ animationDelay: `${gi * 60}ms` }}>
                    {/* Group Header - clickable */}
                    <button type="button" onClick={() => toggleGroup(websiteName)} className="w-full flex items-center justify-between p-4 text-start hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getAvatarGradient(websiteName)} flex items-center justify-center text-white font-bold shadow-sm transition-transform duration-200 ${isExpanded ? 'scale-110' : ''}`}>
                          {websiteName.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-start">
                          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">{websiteName}</h3>
                          <p className="text-xs text-slate-400">{entries.length} {entries.length === 1 ? t('password.account') : t('password.accounts')}</p>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-slate-400 chevron-rotate" data-open={String(isExpanded)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-4 pb-3">
                        {entries.map((e, i) => (
                          <div key={e.id} className="animate-expand-reveal" style={{ animationDelay: `${i * 50}ms` }}>
                            {renderRow(e, i)}
                          </div>
                        ))}

                        {/* Add email button */}
                        <button type="button" onClick={() => openQuickAdd(entries)} className="w-full mt-2 py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-indigo-500 hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all flex items-center justify-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          {t('password.addEmailTo')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}
          </div>
        )}
      </main>

      {/* FAB - Add New (Delightful) - Only show in vault view */}
      {activeMainTab === 'vault' && (
        <button
          onClick={() => { setEditingEntry(null); setEditingPlainPassword(''); setQuickAddPlatform(null); setShowModal(true); }}
          className="fixed bottom-8 end-8 w-14 h-14 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 hover:scale-110 hover:shadow-2xl hover:shadow-indigo-500/40 z-30 animate-fab-glow animate-gradient-bg group"
          title={t('password.addSecure')}
        >
          <svg className="w-7 h-7 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Password Modal */}
      <PasswordModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEntry(null); setEditingPlainPassword(''); setQuickAddPlatform(null); }}
        onSave={handleSave}
        initialData={editingEntry ? {
          websiteName: editingEntry.websiteName,
          websiteUrl: editingEntry.websiteUrl,
          username: editingEntry.username,
          password: editingPlainPassword,
          notes: editingEntry.notes,
          category: editingEntry.category,
        } : quickAddPlatform ? {
          websiteName: quickAddPlatform.name,
          websiteUrl: quickAddPlatform.url,
          username: '',
          password: editingPlainPassword,
          notes: '',
          category: quickAddPlatform.category,
        } : undefined}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-scaleIn">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t('password.deleteConfirm')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t('password.deleteConfirmFull')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {t('general.cancel')}
                </button>
                <button
                  onClick={() => {
                    const entry = passwords.find(p => p.id === deleteConfirmId);
                    if (entry) handleDelete(entry);
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all"
                >
                  {t('general.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts with Undo */}
      <div className="fixed bottom-8 start-8 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm animate-slideUp text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : toast.type === 'error'
                ? 'bg-red-50/90 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400'
                : 'bg-blue-50/90 dark:bg-indigo-500/10 border-blue-200 dark:border-indigo-500/20 text-blue-700 dark:text-indigo-400'
            }`}
          >
            <span>{toast.text}</span>
            {toast.action && (
              <button
                onClick={toast.action.fn}
                className="shrink-0 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer Watermark */}
      <footer className="mt-8 pb-6 text-center">
        <p className="text-[11px] text-slate-300 dark:text-slate-700">
          {t('settings.copyright')}
        </p>
      </footer>
      
      </div> {/* Close main wrapper for responsive sidebar */}
    </div>
  );
}
