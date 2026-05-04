const fs = require('fs');
let lines = fs.readFileSync('src/components/MySpaces.tsx', 'utf8').split('\n');

const start = 363; // Check to ensure this is correct
const end = lines.findIndex((l, i) => i > 363 && l.trim() === '</div>' && lines[i + 1] && lines[i + 1].trim() === ')}');

if (end > start) {
  const modalCode = `        {showAddModal && (
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

                  {/* Icon Setup */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('mySpaces.icon')}</label>
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden relative group transition-all hover:ring-2 hover:ring-indigo-500/50">
                      {customIcon ? (
                        <img src={customIcon} alt="Icon" className="w-8 h-8 object-contain" />
                      ) : (linkUrl && linkUrl.length > 5) ? (
                        <img src={\`https://www.google.com/s2/favicons?domain=\${new URL(linkUrl.startsWith('http') ? linkUrl : 'https://'+linkUrl).hostname}&sz=128\`} alt="Favicon" className="w-8 h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
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
        )}`;
  lines.splice(start, end - start + 1, modalCode);
  fs.writeFileSync('src/components/MySpaces.tsx', lines.join('\n'));
  console.log('Successfully replaced modal');
} else {
  console.log('End index not found', end);
}