import { useState, useEffect, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { generatePassword, getPasswordStrength } from '../lib/encryption';
import {
  POPULAR_WEBSITES,
  WEBSITE_CATEGORIES_ORDER,
  getWebsiteName,
  searchWebsites,
  WebsiteInfo,
} from '../lib/websites';

export interface FormData {
  websiteName: string;
  websiteUrl: string;
  username: string;
  password: string;
  notes: string;
  category: string;
}

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
}

const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-500'];
const STRENGTH_WIDTHS = ['w-1/4', 'w-2/4', 'w-3/4', 'w-full', 'w-full'];

export default function PasswordModal({ isOpen, onClose, onSave, initialData }: PasswordModalProps) {
  const { t, language } = useI18n();
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [genLength, setGenLength] = useState(20);

  // Website dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const name = initialData?.websiteName || '';
      setWebsiteName(name);
      setWebsiteUrl(initialData?.websiteUrl || '');
      setUsername(initialData?.username || '');
      setPassword(initialData?.password || '');
      setNotes(initialData?.notes || '');
      setCategory(initialData?.category || 'other');
      setShowPassword(false);
      setDropdownOpen(false);
      setDropdownSearch('');
      // If initial data has a name, check if it's a known website
      if (name) {
        const found = POPULAR_WEBSITES.find(
          s => getWebsiteName(s, language) === name || s.nameEn === name || s.nameAr === name
        );
        setIsCustom(!found);
      } else {
        setIsCustom(false);
      }
    }
  }, [isOpen, initialData, language]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (dropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [dropdownOpen]);

  const strength = getPasswordStrength(password);
  const strengthLabel = strength <= 1 ? t('password.weak') : strength === 2 ? t('password.fair') : strength === 3 ? t('password.good') : t('password.strong');

  const handleSelectWebsite = (site: WebsiteInfo) => {
    setWebsiteName(getWebsiteName(site, language));
    setWebsiteUrl(site.url);
    setCategory(site.category);
    setIsCustom(false);
    setDropdownOpen(false);
    setDropdownSearch('');
  };

  const handleSelectCustom = () => {
    setWebsiteName('');
    setWebsiteUrl('');
    setIsCustom(true);
    setDropdownOpen(false);
    setDropdownSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName.trim() || !username.trim() || !password) return;
    setSaving(true);
    try {
      await onSave({ websiteName, websiteUrl, username, password, notes, category });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = () => {
    const pw = generatePassword(genLength);
    setPassword(pw);
    setShowPassword(true);
  };

  if (!isOpen) return null;

  // Filter and group websites for dropdown
  const filteredSites = searchWebsites(dropdownSearch);
  const groupedSites = WEBSITE_CATEGORIES_ORDER.map(cat => ({
    category: cat,
    sites: filteredSites.filter(s => s.category === cat),
  })).filter(g => g.sites.length > 0);

  const getCategoryLabel = (cat: string) => t(`password.categories.${cat}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {initialData ? t('password.editTitle') : t('password.addTitle')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ═══ Website Dropdown ═══ */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.websiteName')} *
              </label>

              {/* Trigger button */}
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-start focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all flex items-center justify-between gap-2 ${
                  websiteName
                    ? 'border-indigo-300 dark:border-indigo-600 text-slate-900 dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {websiteName && !isCustom ? (
                    <>
                      {(() => {
                        const site = POPULAR_WEBSITES.find(
                          s => getWebsiteName(s, language) === websiteName || s.nameEn === websiteName
                        );
                        return site ? (
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: site.color }}
                          >
                            {site.icon.length <= 2 ? site.icon : site.icon}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                            {websiteName.charAt(0)}
                          </div>
                        );
                      })()}
                      <span className="truncate">{websiteName}</span>
                    </>
                  ) : isCustom ? (
                    <>
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">{t('password.customWebsite')}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
                      </svg>
                      <span>{t('password.chooseWebsite')}</span>
                    </>
                  )}
                </div>
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div className="absolute z-50 top-full mt-2 inset-x-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl animate-scaleIn overflow-hidden" style={{ maxHeight: '360px' }}>
                  {/* Search */}
                  <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                    <div className="relative">
                      <svg className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        placeholder={t('password.searchWebsites')}
                        className="w-full ps-9 pe-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Website list */}
                  <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                    {groupedSites.map(group => (
                      <div key={group.category}>
                        {/* Category header */}
                        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 sticky">
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            {getCategoryLabel(group.category)}
                          </span>
                        </div>
                        {/* Sites */}
                        {group.sites.map(site => {
                          const name = getWebsiteName(site, language);
                          const isSelected = websiteName === name || websiteName === site.nameEn || websiteName === site.nameAr;
                          return (
                            <button
                              key={site.id}
                              type="button"
                              onClick={() => handleSelectWebsite(site)}
                              className={`w-full px-3 py-2 flex items-center gap-3 text-start hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors duration-100 ${
                                isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''
                              }`}
                            >
                              <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: site.color }}
                              >
                                {site.icon.length <= 2 ? site.icon : ''}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {name}
                                </p>
                                <p className="text-[11px] text-slate-400 truncate" dir="ltr">
                                  {site.url}
                                </p>
                              </div>
                              {isSelected && (
                                <svg className="w-4 h-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}

                    {/* Divider + Custom option */}
                    <div className="border-t border-slate-200 dark:border-slate-700 mt-1">
                      <button
                        type="button"
                        onClick={handleSelectCustom}
                        className={`w-full px-3 py-3 flex items-center gap-3 text-start hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors duration-100 ${
                          isCustom && !websiteName ? 'bg-purple-50 dark:bg-purple-500/10' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            {t('password.customWebsite')}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {t('password.customWebsiteName')}
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom website name input (shown when "Custom" is selected) */}
              {isCustom && !dropdownOpen && (
                <input
                  type="text"
                  value={websiteName}
                  onChange={(e) => setWebsiteName(e.target.value)}
                  placeholder={t('password.customWebsiteName')}
                  className="w-full mt-2 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  autoFocus
                  required
                />
              )}
            </div>

            {/* Website URL (auto-filled, editable) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.websiteUrl')}
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                dir="ltr"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.username')} *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="user@email.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                dir="ltr"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.password')} *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pe-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  dir="ltr"
                  required
                />
                <div className="absolute end-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all"
                    title={t('password.generateNew')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">{t('password.strength')}</span>
                    <span className={`text-xs font-medium ${
                      strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-yellow-500' : 'text-emerald-500'
                    }`}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLORS[strength]} ${STRENGTH_WIDTHS[strength]}`} />
                  </div>
                </div>
              )}

              {/* Password length for generator */}
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs text-slate-500">{t('password.length')}:</span>
                <input
                  type="range"
                  min={8}
                  max={40}
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
                <span className="text-xs text-slate-400 font-mono w-8 text-center">{genLength}</span>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.category')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['social', 'email', 'work', 'finance', 'shopping', 'dev', 'other'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                      category === cat
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    {t(`password.categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('password.notes')}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('password.notes')}
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                {t('password.cancel')}
              </button>
              <button
                type="submit"
                disabled={saving || !websiteName.trim() || !username.trim() || !password}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  </span>
                ) : t('password.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
