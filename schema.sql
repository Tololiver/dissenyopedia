-- =====================================================
-- DISSENYOPEDIA — Schema SQL
-- Executar a: Supabase > SQL Editor > New query
-- =====================================================

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name_ca      TEXT NOT NULL,
  name_es      TEXT NOT NULL,
  subtitle_ca  TEXT,
  subtitle_es  TEXT,
  sort_order   INTEGER DEFAULT 0
);

INSERT INTO categories (slug, name_ca, name_es, subtitle_ca, subtitle_es, sort_order) VALUES
  ('llegendes',      'Llegendes i Pioners',               'Leyendas y Pioneros',                'Els mestres que van crear el llenguatge visual del segle XX',        'Los maestros que crearon el lenguaje visual del siglo XX',      1),
  ('branding',       'Mestres del Branding i la Identitat','Maestros del Branding e Identidad',  'Els arquitectes de les identitats corporatives més icòniques',      'Los arquitectos de las identidades corporativas más icónicas',  2),
  ('contemporanis',  'Visionaris Contemporanis',           'Visionarios Contemporáneos',         'Els dissenyadors que estan definint el present',                    'Los diseñadores que están definiendo el presente',              3),
  ('hispa',          'Destacats del Món Hispà',            'Destacados del Mundo Hispano',       'Referents del disseny a Espanya',                                   'Referentes del diseño en España',                              4)
ON CONFLICT (slug) DO NOTHING;

-- DESIGNERS
CREATE TABLE IF NOT EXISTS designers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  category_slug TEXT REFERENCES categories(slug),
  name         TEXT NOT NULL,
  tagline_ca   TEXT,
  tagline_es   TEXT,
  period       TEXT,
  origin       TEXT,
  portrait_url TEXT,
  bio_ca       TEXT,
  bio_es       TEXT,
  style        JSONB DEFAULT '[]',
  techniques   JSONB DEFAULT '[]',
  principles   JSONB DEFAULT '[]',
  works        JSONB DEFAULT '[]',
  lesson_ca    TEXT,
  lesson_es    TEXT,
  sources      JSONB DEFAULT '[]',
  video_id     TEXT,
  links        JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- BLOG POSTS
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  title_ca     TEXT,
  title_es     TEXT,
  excerpt_ca   TEXT,
  excerpt_es   TEXT,
  content_ca   TEXT,
  content_es   TEXT,
  cover_image  TEXT,
  author       TEXT DEFAULT 'Tolo Oliver',
  tags         TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE designers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts  ENABLE ROW LEVEL SECURITY;

-- Public read (anon + publishable key)
CREATE POLICY "public_read_categories" ON categories  FOR SELECT USING (true);
CREATE POLICY "public_read_designers"  ON designers   FOR SELECT USING (is_published = true);
CREATE POLICY "public_read_posts"      ON blog_posts  FOR SELECT USING (is_published = true);

-- Service role (secret key) can do everything — no extra policy needed

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER designers_updated_at  BEFORE UPDATE ON designers  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
