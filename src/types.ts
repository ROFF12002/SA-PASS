export interface PasswordEntry {
  id: string;
  userId: string;
  websiteName: string;
  websiteUrl: string;
  username: string;
  encryptedPassword: string;
  notes: string;
  category: string;
  pinned: boolean;
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'synced' | 'pending';
}

export interface SpaceFolder {
  id: string;
  name: string;
  icon: string; // Emoji
  color: string;
  isWorkspace: boolean;
}

export interface SpaceLink {
  id: string;
  folderId: string;
  name: string;
  url: string;
  iconUrl: string;
  domainColor: string;
  createdAt: string;
}

export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light';

export interface AppPreferences {
  calmMode: boolean;
}
export type Page = 'auth' | 'unlock' | 'dashboard' | 'settings';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
  action?: { label: string; fn: () => void };
}
