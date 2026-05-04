import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SpaceFolder, SpaceLink } from '../types';
import { useI18n } from '../lib/i18n';

const INITIAL_FOLDERS: SpaceFolder[] = [
  { id: '1', name: 'Social Media', icon: '📱', color: 'bg-pink-100', isWorkspace: false },
  { id: '2', name: 'AI Tools', icon: '🤖', color: 'bg-emerald-100', isWorkspace: true },
  { id: '3', name: 'Work', icon: '💼', color: 'bg-indigo-100', isWorkspace: false },
  { id: '4', name: 'Education', icon: '🎓', color: 'bg-amber-100', isWorkspace: false },
  { id: '5', name: 'Favorites', icon: '⭐', color: 'bg-yellow-100', isWorkspace: false },
];

const INITIAL_LINKS: SpaceLink[] = [
  { id: 'l1', folderId: '1', name: 'Facebook', url: 'https://facebook.com', iconUrl: 'https://www.google.com/s2/favicons?domain=facebook.com&sz=128', domainColor: '#1877F2', createdAt: new Date().toISOString() },
  { id: 'l2', folderId: '2', name: 'ChatGPT', url: 'https://chat.openai.com', iconUrl: 'https://www.google.com/s2/favicons?domain=chat.openai.com&sz=128', domainColor: '#10A37F', createdAt: new Date().toISOString() },
];

export default function MySpaces() {
  const { t } = useI18n();
  const [folders, setFolders] = useState<SpaceFolder[]>(() => {
    try {
      const saved = localStorage.getItem('sampass_folders');
      return saved ? JSON.parse(saved) : INITIAL_FOLDERS;
    } catch { return INITIAL_FOLDERS }
  });
  
  const [links, setLinks] = useState<SpaceLink[]>(() => {
    try {
      const saved = localStorage.getItem('sampass_links');
      return saved ? JSON.parse(saved) : INITIAL_LINKS;
    } catch { return INITIAL_LINKS; }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkFolderId, setLinkFolderId] = useState(folders[0]?.id || '');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    localStorage.setItem('sampass_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('sampass_links', JSON.stringify(links));
  }, [links]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http') || text.includes('.'))) {
        setLinkUrl(text);
        try {
          const urlObj = new URL(text.startsWith('http') ? text : 'https://' + text);
          let hostname = urlObj.hostname.replace('www.', '');
          hostname = hostname.split('.')[0];
          setLinkName(hostname.charAt(0).toUpperCase() + hostname.slice(1));
        } catch (e) {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl || !linkName) return;

    let finalUrl = linkUrl;
    if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
    
    let folderIdToUse = linkFolderId;
    if (!folderIdToUse) {
       folderIdToUse = folders[0].id;
    }

    const domain = new URL(finalUrl).hostname;
    
    if (editingLinkId) {
      setLinks(links.map(l => l.id === editingLinkId ? {
        ...l,
        name: linkName,
        url: finalUrl,
        folderId: folderIdToUse,
        iconUrl: customIcon || l.iconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      } : l));
    } else {
      const newLink: SpaceLink = {
        id: crypto.randomUUID(),
        folderId: folderIdToUse,
        name: linkName,
        url: finalUrl,
        iconUrl: customIcon || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        domainColor: '#4F46E5', // Fallback color
        createdAt: new Date().toISOString(),
      };
      setLinks([...links, newLink]);
    }

    setShowAddModal(false);
    resetModal();
  };

  const resetModal = () => {
    setLinkUrl('');
    setLinkName('');
    setCustomIcon(null);
    setEditingLinkId(null);
  };

  const openAddModal = () => {
    resetModal();
    setLinkFolderId(activeFolderId !== 'all' ? activeFolderId : folders[0].id);
    setShowAddModal(true);
  };

  const openEditModal = (e: React.MouseEvent, link: SpaceLink) => {
    e.stopPropagation();
    setLinkUrl(link.url);
    setLinkName(link.name);
    setLinkFolderId(link.folderId);
    setCustomIcon(link.iconUrl.startsWith('data:') ? link.iconUrl : null); // Only keep if Custom Base64, or wait, maybe keep all? Keep all for now.
    setCustomIcon(link.iconUrl);
    setEditingLinkId(link.id);
    setShowAddModal(true);
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
    setShowAddModal(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomIcon(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImportBookmarks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const html = event.target?.result as string;
      if (!html) return;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let currentFolders = [...folders];
      const newLinks: SpaceLink[] = [];

      const dls = doc.querySelectorAll('DL');
      
      dls.forEach(dl => {
        let folderName = 'Imported Links';
        const prevSibling = dl.previousElementSibling;
        if (prevSibling && prevSibling.tagName.toUpperCase() === 'DT') {
          const h3 = prevSibling.querySelector('H3');
          if (h3) folderName = h3.textContent || 'Imported Links';
        } else if (dl.parentElement?.tagName.toUpperCase() === 'DT') {
          const h3 = dl.parentElement.querySelector('H3');
          if (h3) folderName = h3.textContent || 'Imported Links';
        }

        // Find or create folder
        let folder = currentFolders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
        if (!folder) {
          folder = {
            id: crypto.randomUUID(),
            name: folderName,
            icon: '📁',
            color: 'bg-slate-100',
            isWorkspace: false
          };
          currentFolders.push(folder);
        }

        const linksInDl = dl.querySelectorAll(':scope > p > dt > a, :scope > dt > a');
        linksInDl.forEach(a => {
          const href = a.getAttribute('href');
          const title = a.textContent || 'Bookmark';
          const iconStr = a.getAttribute('icon');
          if (href && href.startsWith('http')) {
            try {
              const domain = new URL(href).hostname;
              newLinks.push({
                id: crypto.randomUUID(),
                folderId: folder.id,
                name: title,
                url: href,
                iconUrl: iconStr || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
                domainColor: '#4F46E5', // Fallback color
                createdAt: new Date().toISOString(),
              });
            } catch {
              // ignore invalid url
            }
          }
        });
      });

      setFolders(currentFolders);
      setLinks([...links, ...newLinks]);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const filteredLinks = activeFolderId === 'all' 
    ? links 
    : links.filter(l => l.folderId === activeFolderId);

  const openWorkspace = (folderId: string) => {
    const folderLinks = links.filter(l => l.folderId === folderId);
    folderLinks.forEach(link => {
      window.open(link.url, '_blank');
    });
  };

  const openLink = (url: string) => {
    const safeUrl = btoa(url).replace(/=/g, ''); 
    const el = document.getElementById(`link-rip-${safeUrl}`);
    if (el) {
      el.classList.add('opacity-100', 'scale-110');
      setTimeout(() => el.classList.remove('opacity-100', 'scale-110'), 300);
    }
    setTimeout(() => {
      window.open(url, '_blank');
    }, 150); // slight delay for visual effect
  };

  return (
    <div className="animate-fadeIn pb-12 w-full">
      {/* Categories */}
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide py-2 mb-2">
        <button 
          onClick={() => setActiveFolderId('all')}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
            activeFolderId === 'all' 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
          }`}
        >
          <span>🌐</span>
          {t('mySpaces.allSpaces')}
        </button>
        
        {folders.map(folder => (
          <button 
            key={folder.id}
            onClick={() => setActiveFolderId(folder.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
              activeFolderId === folder.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-transparent' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
            }`}
          >
            <span>{folder.icon}</span>
            {folder.name}
            {folder.isWorkspace && activeFolderId !== folder.id && (
               <span 
                 onClick={(e) => { e.stopPropagation(); openWorkspace(folder.id); }}
                 className="ml-2 w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] hover:scale-110 transition-transform"
                 title={t('mySpaces.launchWorkspace')}
               >
                 🚀
               </span>
            )}
          </button>
        ))}
      </div>

      {/* Action / Add button area */}
      <div className="flex items-center justify-between mb-6 px-1">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          {activeFolderId === 'all' ? t('mySpaces.yourLaunchpad') : folders.find(f => f.id === activeFolderId)?.name}
        </h2>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
            <span className="hidden sm:block">{t('mySpaces.importBookmarks')}</span>
            <input type="file" accept=".html" className="hidden" onChange={handleImportBookmarks} />
          </label>
          
          {activeFolderId !== 'all' && folders.find(f => f.id === activeFolderId)?.isWorkspace && (
            <button 
              onClick={() => openWorkspace(activeFolderId)}
              className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:underline bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-500/20"
            >
              {t('mySpaces.launchAll')}
            </button>
          )}
        </div>
      </div>

      {/* Grid of Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {/* ADD NEW CARD */}
        <button 
          onClick={openAddModal}
          className="group relative flex flex-col items-center justify-center p-5 bg-slate-100/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-1 min-h-[130px] cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-2 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('mySpaces.addLink')}</span>
        </button>

        {filteredLinks.map((link, i) => {
          const safeUrl = btoa(link.url).replace(/=/g, '');
          return (
            <button
              key={link.id}
              onClick={() => openLink(link.url)}
              className="group relative flex flex-col items-center justify-center p-4 bg-white dark:bg-slate-800/80 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden min-h-[130px]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div id={`link-rip-${safeUrl}`} className="absolute inset-0 bg-indigo-500/10 opacity-0 transition-all duration-300 ease-out z-0 rounded-3xl blur-md"></div>
              
              <div className="relative z-10 w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-100 dark:border-slate-700 mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center items-center">
                <img src={link.iconUrl} alt={link.name} className="w-7 h-7 object-contain drop-shadow-sm" loading="lazy" />
              </div>
              
              <h3 className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate w-full text-center relative z-10 px-1">{link.name}</h3>
              
              {/* The folder symbol small */}
              {activeFolderId === 'all' && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 absolute bottom-2 flex items-center gap-1 z-10">
                  {folders.find(f => f.id === link.folderId)?.icon}
                </span>
              )}
              
              {/* Edit / Actions */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
                <button 
                  onClick={(e) => openEditModal(e, link)}
                  className="p-1.5 bg-white dark:bg-slate-700 shadow flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                </button>
              </div>
            </button>
          )
        })}
      </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            
            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-slideUp max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingLinkId ? t('mySpaces.editLink') : t('mySpaces.quickAdd')}
                  </h2>
                  <div className="flex items-center gap-2">
                    {editingLinkId && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteLink(editingLinkId)} 
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                        title={t('mySpaces.deleteLink')}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="space-y-4">
                  {/* Link Url */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('mySpaces.urlLabel', 'URL رابط الموقع')}</label>
                    <input 
                      type="url" 
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder={t('mySpaces.urlPlaceholder', 'https://example.com')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                      dir="ltr"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('mySpaces.nameLabel')}</label>
                    <input 
                      type="text" 
                      value={linkName}
                      onChange={(e) => setLinkName(e.target.value)}
                      placeholder={t('mySpaces.namePlaceholder', 'مثلاً: ماسنجر')}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Folder Selection */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('mySpaces.category', 'القسم')}</label>
                    <div className="relative">
                      <select
                        value={linkFolderId}
                        onChange={(e) => setLinkFolderId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                      >
                        {folders.map(f => (
                          <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 end-0 flex items-center pe-4 pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Icon Setup */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('mySpaces.icon')}</label>
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group transition-all hover:ring-2 hover:ring-indigo-500/50">
                      {customIcon ? (
                        <img src={customIcon} alt="Icon" className="w-8 h-8 object-contain" />
                      ) : (linkUrl && linkUrl.length > 5) ? (
                        <img src={`https://www.google.com/s2/favicons?domain=${new URL(linkUrl.startsWith('http') ? linkUrl : 'https://'+linkUrl).hostname}&sz=128`} alt="Favicon" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                      ) : (
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      )}
                      <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-[2px]">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                    >
                      {t('general.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={!linkUrl.trim() || !linkName.trim()}
                      className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                    >
                      {editingLinkId ? t('mySpaces.saveWebApp') : t('mySpaces.quickAdd')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}