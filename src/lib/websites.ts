/**
 * Popular Websites Database
 * Each entry has: id, name (ar/en), url, category, and color for avatar
 */

export interface WebsiteInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  url: string;
  category: string;
  color: string;
  icon: string; // emoji or letter
}

export const POPULAR_WEBSITES: WebsiteInfo[] = [
  // ─── Social Media ───────────────────────────
  { id: 'facebook',   nameAr: 'فيسبوك',        nameEn: 'Facebook',      url: 'https://www.facebook.com',    category: 'social',   color: '#1877F2', icon: 'f' },
  { id: 'twitter',    nameAr: 'تويتر / إكس',   nameEn: 'Twitter / X',   url: 'https://www.x.com',           category: 'social',   color: '#000000', icon: '𝕏' },
  { id: 'instagram',  nameAr: 'إنستغرام',      nameEn: 'Instagram',     url: 'https://www.instagram.com',   category: 'social',   color: '#E4405F', icon: '📷' },
  { id: 'tiktok',     nameAr: 'تيك توك',       nameEn: 'TikTok',        url: 'https://www.tiktok.com',      category: 'social',   color: '#000000', icon: '♪' },
  { id: 'linkedin',   nameAr: 'لينكد إن',      nameEn: 'LinkedIn',      url: 'https://www.linkedin.com',    category: 'social',   color: '#0A66C2', icon: 'in' },
  { id: 'snapchat',   nameAr: 'سناب شات',      nameEn: 'Snapchat',      url: 'https://www.snapchat.com',    category: 'social',   color: '#FFFC00', icon: '👻' },
  { id: 'whatsapp',   nameAr: 'واتساب',        nameEn: 'WhatsApp',      url: 'https://web.whatsapp.com',    category: 'social',   color: '#25D366', icon: '💬' },
  { id: 'telegram',   nameAr: 'تيليجرام',      nameEn: 'Telegram',      url: 'https://web.telegram.org',    category: 'social',   color: '#26A5E4', icon: '✈️' },
  { id: 'reddit',     nameAr: 'ريديت',         nameEn: 'Reddit',        url: 'https://www.reddit.com',      category: 'social',   color: '#FF4500', icon: '🔴' },
  { id: 'pinterest',  nameAr: 'بنترست',        nameEn: 'Pinterest',     url: 'https://www.pinterest.com',   category: 'social',   color: '#E60023', icon: '📌' },
  { id: 'discord',    nameAr: 'ديسكورد',       nameEn: 'Discord',       url: 'https://discord.com',         category: 'social',   color: '#5865F2', icon: '🎮' },
  { id: 'threads',    nameAr: 'ثريدز',         nameEn: 'Threads',       url: 'https://www.threads.net',     category: 'social',   color: '#000000', icon: '@' },

  // ─── Email ──────────────────────────────────
  { id: 'gmail',      nameAr: 'جيميل',         nameEn: 'Gmail',         url: 'https://mail.google.com',     category: 'email',    color: '#EA4335', icon: '✉️' },
  { id: 'outlook',    nameAr: 'أوتلوك',        nameEn: 'Outlook',       url: 'https://outlook.live.com',    category: 'email',    color: '#0078D4', icon: '📬' },
  { id: 'yahoo',      nameAr: 'ياهو ميل',     nameEn: 'Yahoo Mail',    url: 'https://mail.yahoo.com',      category: 'email',    color: '#6001D2', icon: '📧' },
  { id: 'protonmail', nameAr: 'بروتون ميل',   nameEn: 'Proton Mail',   url: 'https://mail.proton.me',      category: 'email',    color: '#6D4AFF', icon: '🔒' },
  { id: 'icloud',     nameAr: 'آي كلاود ميل', nameEn: 'iCloud Mail',   url: 'https://www.icloud.com/mail', category: 'email',    color: '#3693F5', icon: '☁️' },
  { id: 'hotmail',    nameAr: 'هوتميل',       nameEn: 'Hotmail',       url: 'https://outlook.live.com',    category: 'email',    color: '#0078D4', icon: '📨' },

  // ─── Development ────────────────────────────
  { id: 'github',     nameAr: 'جيت هب',       nameEn: 'GitHub',        url: 'https://github.com',          category: 'dev',      color: '#181717', icon: '🐙' },
  { id: 'gitlab',     nameAr: 'جيت لاب',      nameEn: 'GitLab',        url: 'https://gitlab.com',          category: 'dev',      color: '#FC6D26', icon: '🦊' },
  { id: 'bitbucket',  nameAr: 'بيت باكيت',    nameEn: 'Bitbucket',     url: 'https://bitbucket.org',       category: 'dev',      color: '#0052CC', icon: '🪣' },
  { id: 'stackoverflow', nameAr: 'ستاك أوفرفلو', nameEn: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'dev',   color: '#F48024', icon: '📚' },
  { id: 'npmjs',      nameAr: 'إن بي إم',     nameEn: 'npm',           url: 'https://www.npmjs.com',       category: 'dev',      color: '#CB3837', icon: '📦' },
  { id: 'docker',     nameAr: 'داكر هب',      nameEn: 'Docker Hub',    url: 'https://hub.docker.com',      category: 'dev',      color: '#2496ED', icon: '🐳' },
  { id: 'vercel',     nameAr: 'فيرسل',        nameEn: 'Vercel',        url: 'https://vercel.com',          category: 'dev',      color: '#000000', icon: '▲' },
  { id: 'netlify',    nameAr: 'نيتليفاي',     nameEn: 'Netlify',       url: 'https://app.netlify.com',     category: 'dev',      color: '#00C7B7', icon: '🌐' },
  { id: 'aws',        nameAr: 'أمازون AWS',   nameEn: 'AWS Console',   url: 'https://aws.amazon.com',      category: 'dev',      color: '#FF9900', icon: '☁️' },
  { id: 'azure',      nameAr: 'مايكروسوفت أزور', nameEn: 'Azure',      url: 'https://portal.azure.com',    category: 'dev',      color: '#0078D4', icon: '🔷' },
  { id: 'digitalocean', nameAr: 'ديجيتال أوشن', nameEn: 'DigitalOcean', url: 'https://www.digitalocean.com', category: 'dev',    color: '#0080FF', icon: '🌊' },
  { id: 'heroku',     nameAr: 'هيروكو',       nameEn: 'Heroku',        url: 'https://www.heroku.com',      category: 'dev',      color: '#430098', icon: '💜' },
  { id: 'jira',       nameAr: 'جيرا',         nameEn: 'Jira',          url: 'https://www.atlassian.com',   category: 'dev',      color: '#0052CC', icon: '📋' },
  { id: 'figma',      nameAr: 'فيجما',        nameEn: 'Figma',         url: 'https://www.figma.com',       category: 'dev',      color: '#F24E1E', icon: '🎨' },

  // ─── Work ───────────────────────────────────
  { id: 'slack',      nameAr: 'سلاك',         nameEn: 'Slack',         url: 'https://slack.com',           category: 'work',     color: '#4A154B', icon: '#️⃣' },
  { id: 'trello',     nameAr: 'تريلو',        nameEn: 'Trello',        url: 'https://trello.com',          category: 'work',     color: '#0052CC', icon: '📋' },
  { id: 'zoom',       nameAr: 'زوم',          nameEn: 'Zoom',          url: 'https://zoom.us',             category: 'work',     color: '#2D8CFF', icon: '📹' },
  { id: 'teams',      nameAr: 'مايكروسوفت تيمز', nameEn: 'MS Teams',  url: 'https://teams.microsoft.com', category: 'work',     color: '#6264A7', icon: '👥' },
  { id: 'notion',     nameAr: 'نوشن',         nameEn: 'Notion',        url: 'https://www.notion.so',       category: 'work',     color: '#000000', icon: '📝' },
  { id: 'asana',      nameAr: 'أسانا',        nameEn: 'Asana',         url: 'https://app.asana.com',       category: 'work',     color: '#F06A6A', icon: '✅' },
  { id: 'google_workspace', nameAr: 'جوجل وركسبيس', nameEn: 'Google Workspace', url: 'https://workspace.google.com', category: 'work', color: '#4285F4', icon: '🏢' },
  { id: 'monday',     nameAr: 'مانداي',       nameEn: 'Monday.com',    url: 'https://monday.com',          category: 'work',     color: '#FF3D57', icon: '📆' },
  { id: 'clickup',    nameAr: 'كليك أب',      nameEn: 'ClickUp',       url: 'https://app.clickup.com',     category: 'work',     color: '#7B68EE', icon: '☝️' },

  // ─── Finance ────────────────────────────────
  { id: 'paypal',     nameAr: 'باي بال',       nameEn: 'PayPal',        url: 'https://www.paypal.com',      category: 'finance',  color: '#003087', icon: '💰' },
  { id: 'wise',       nameAr: 'وايز (TransferWise)', nameEn: 'Wise',    url: 'https://wise.com',            category: 'finance',  color: '#9FE870', icon: '💱' },
  { id: 'revolut',    nameAr: 'ريفولوت',      nameEn: 'Revolut',       url: 'https://www.revolut.com',     category: 'finance',  color: '#0075EB', icon: '🏦' },
  { id: 'binance',    nameAr: 'بينانس',       nameEn: 'Binance',       url: 'https://www.binance.com',     category: 'finance',  color: '#F0B90B', icon: '🪙' },
  { id: 'coinbase',   nameAr: 'كوين بيز',     nameEn: 'Coinbase',      url: 'https://www.coinbase.com',    category: 'finance',  color: '#0052FF', icon: '₿' },
  { id: 'stripe',     nameAr: 'سترايب',       nameEn: 'Stripe',        url: 'https://dashboard.stripe.com', category: 'finance',  color: '#635BFF', icon: '💳' },

  // ─── Shopping ───────────────────────────────
  { id: 'amazon',     nameAr: 'أمازون',        nameEn: 'Amazon',        url: 'https://www.amazon.com',      category: 'shopping', color: '#FF9900', icon: '📦' },
  { id: 'aliexpress', nameAr: 'علي إكسبرس',   nameEn: 'AliExpress',    url: 'https://www.aliexpress.com',  category: 'shopping', color: '#FF4747', icon: '🛒' },
  { id: 'ebay',       nameAr: 'إي باي',       nameEn: 'eBay',          url: 'https://www.ebay.com',        category: 'shopping', color: '#E53238', icon: '🏷️' },
  { id: 'noon',       nameAr: 'نون',          nameEn: 'Noon',          url: 'https://www.noon.com',        category: 'shopping', color: '#FEEE00', icon: '🛍️' },
  { id: 'shein',      nameAr: 'شي إن',        nameEn: 'SHEIN',         url: 'https://www.shein.com',       category: 'shopping', color: '#000000', icon: '👗' },
  { id: 'temu',       nameAr: 'تيمو',         nameEn: 'Temu',          url: 'https://www.temu.com',        category: 'shopping', color: '#FB6F20', icon: '🛃' },
  { id: 'etsy',       nameAr: 'إتسي',         nameEn: 'Etsy',          url: 'https://www.etsy.com',        category: 'shopping', color: '#F1641E', icon: '🎨' },

  // ─── Other / Services ──────────────────────
  { id: 'google',     nameAr: 'جوجل',         nameEn: 'Google',        url: 'https://accounts.google.com', category: 'other',    color: '#4285F4', icon: 'G' },
  { id: 'apple',      nameAr: 'آبل',          nameEn: 'Apple',         url: 'https://appleid.apple.com',   category: 'other',    color: '#000000', icon: '🍎' },
  { id: 'microsoft',  nameAr: 'مايكروسوفت',   nameEn: 'Microsoft',     url: 'https://account.microsoft.com', category: 'other',  color: '#00A4EF', icon: '🪟' },
  { id: 'netflix',    nameAr: 'نتفلكس',       nameEn: 'Netflix',       url: 'https://www.netflix.com',     category: 'other',    color: '#E50914', icon: '🎬' },
  { id: 'spotify',    nameAr: 'سبوتيفاي',     nameEn: 'Spotify',       url: 'https://www.spotify.com',     category: 'other',    color: '#1DB954', icon: '🎵' },
  { id: 'youtube',    nameAr: 'يوتيوب',       nameEn: 'YouTube',       url: 'https://www.youtube.com',     category: 'other',    color: '#FF0000', icon: '▶️' },
  { id: 'chatgpt',    nameAr: 'تشات جي بي تي', nameEn: 'ChatGPT',     url: 'https://chat.openai.com',     category: 'other',    color: '#10A37F', icon: '🤖' },
  { id: 'openai',     nameAr: 'أوبن إيه آي',  nameEn: 'OpenAI',        url: 'https://platform.openai.com', category: 'other',    color: '#412991', icon: '⚡' },
  { id: 'dropbox',    nameAr: 'دروب بوكس',    nameEn: 'Dropbox',       url: 'https://www.dropbox.com',     category: 'other',    color: '#0061FF', icon: '📁' },
  { id: 'wordpress',  nameAr: 'ووردبريس',     nameEn: 'WordPress',     url: 'https://wordpress.com',       category: 'other',    color: '#21759B', icon: '✍️' },
  { id: 'cloudflare', nameAr: 'كلاود فلير',   nameEn: 'Cloudflare',    url: 'https://dash.cloudflare.com', category: 'other',    color: '#F6821F', icon: '🌤️' },
  { id: 'namecheap',  nameAr: 'نيم تشيب',     nameEn: 'Namecheap',     url: 'https://www.namecheap.com',   category: 'other',    color: '#DE5833', icon: '🌐' },
  { id: 'godaddy',    nameAr: 'جو دادي',      nameEn: 'GoDaddy',       url: 'https://www.godaddy.com',     category: 'other',    color: '#1BDBDB', icon: '🏷️' },
];

/** Get website name based on current language */
export function getWebsiteName(site: WebsiteInfo, lang: 'ar' | 'en'): string {
  return lang === 'ar' ? site.nameAr : site.nameEn;
}

/** Find a website by its id */
export function getWebsiteById(id: string): WebsiteInfo | undefined {
  return POPULAR_WEBSITES.find(s => s.id === id);
}

/** Search websites by name */
export function searchWebsites(query: string, _lang?: 'ar' | 'en'): WebsiteInfo[] {
  if (!query.trim()) return POPULAR_WEBSITES;
  const q = query.toLowerCase();
  return POPULAR_WEBSITES.filter(s =>
    s.nameEn.toLowerCase().includes(q) ||
    s.nameAr.includes(q) ||
    s.url.toLowerCase().includes(q) ||
    s.id.toLowerCase().includes(q)
  );
}

/** Website categories for grouping */
export const WEBSITE_CATEGORIES_ORDER = ['social', 'email', 'dev', 'work', 'finance', 'shopping', 'other'];
