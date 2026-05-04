-- ──────────────────────────────────────────────────
-- Spaces & Folders Tables for Launchpad
-- ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS space_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT 'bg-slate-100',
  is_workspace BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE space_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own folders" ON space_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON space_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON space_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON space_folders FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS space_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_url TEXT,
  domain_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  order_index INT DEFAULT 0
);

ALTER TABLE space_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own links" ON space_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links" ON space_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links" ON space_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links" ON space_links FOR DELETE USING (auth.uid() = user_id);