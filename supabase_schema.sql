-- ╔══════════════════════════════════════════════════════════════╗
-- ║  PassGuard – Password Manager Database Schema               ║
-- ║  مطوّر: خالد محمد الغريب (سامينسا)                          ║
-- ║                                                              ║
-- ║  ⚡ شغّل هذا الملف بالكامل في Supabase SQL Editor           ║
-- ║  ⚡ Run this entire file in your Supabase SQL Editor         ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────
-- 1. إنشاء جدول كلمات المرور
--    Create the passwords table
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS passwords (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website_name      TEXT    NOT NULL,
  website_url       TEXT    DEFAULT '',
  username          TEXT    NOT NULL,
  encrypted_password TEXT   NOT NULL,
  notes             TEXT    DEFAULT '',
  category          TEXT    DEFAULT 'other'
                         CHECK (category IN ('social','email','work','finance','shopping','dev','other')),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 2. تفعيل أمان الصفوف (RLS)
--    Enable Row Level Security
-- ──────────────────────────────────────────────
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- 3. سياسات الأمان — كل مستخدم يرى بياناته فقط
--    RLS Policies — users can only access their own data
-- ──────────────────────────────────────────────

-- قراءة / Read
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own passwords'
  ) THEN
    CREATE POLICY "Users can read own passwords"
      ON passwords FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- إضافة / Insert
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own passwords'
  ) THEN
    CREATE POLICY "Users can insert own passwords"
      ON passwords FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- تحديث / Update
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own passwords'
  ) THEN
    CREATE POLICY "Users can update own passwords"
      ON passwords FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- حذف / Delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own passwords'
  ) THEN
    CREATE POLICY "Users can delete own passwords"
      ON passwords FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ──────────────────────────────────────────────
-- 4. فهارس لتسريع البحث
--    Indexes for performance
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_passwords_user_id    ON passwords(user_id);
CREATE INDEX IF NOT EXISTS idx_passwords_category   ON passwords(category);
CREATE INDEX IF NOT EXISTS idx_passwords_updated_at ON passwords(updated_at DESC);

-- ──────────────────────────────────────────────
-- 5. تحديث تلقائي لحقل updated_at
--    Auto-update trigger for updated_at
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS passwords_updated_at ON passwords;
CREATE TRIGGER passwords_updated_at
  BEFORE UPDATE ON passwords
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ──────────────────────────────────────────────
-- Admin Dashboard Statistics
-- Creates an RPC to get total users and total passwords
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_users INT;
  total_passwords INT;
BEGIN
  -- Total Users count from auth.users
  SELECT COUNT(*) INTO total_users FROM auth.users;
  
  -- Total passwords
  SELECT COUNT(*) INTO total_passwords FROM public.passwords;
  
  RETURN json_build_object(
    'totalUsers', total_users,
    'totalPasswords', total_passwords
  );
END;
$$;
