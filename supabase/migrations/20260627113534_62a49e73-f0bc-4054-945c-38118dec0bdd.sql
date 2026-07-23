
-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========== PROFILES ===========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  template_id TEXT NOT NULL DEFAULT 'resume',
  theme JSONB NOT NULL DEFAULT '{"accent":"#FF6B35","mode":"light","fontPreset":"rubik"}'::jsonb,
  identity JSONB NOT NULL DEFAULT '{}'::jsonb,
  founder JSONB NOT NULL DEFAULT '{}'::jsonb,
  vision JSONB NOT NULL DEFAULT '{}'::jsonb,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access on profiles" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Public can read published profiles" ON public.profiles
  FOR SELECT TO anon, authenticated USING (is_published = true);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Security definer helper: is this profile published?
CREATE OR REPLACE FUNCTION public.is_profile_published(p_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_id AND is_published = true);
$$;

-- Auto-create profile + unique slug on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  n INT := 0;
BEGIN
  base_slug := lower(regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'founder'), '[^a-z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN base_slug := 'founder'; END IF;
  candidate := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = candidate) LOOP
    n := n + 1;
    candidate := base_slug || '-' || n;
  END LOOP;
  INSERT INTO public.profiles (id, slug, identity, contact)
  VALUES (
    NEW.id,
    candidate,
    jsonb_build_object('name', coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')),
    jsonb_build_object('email', NEW.email)
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========== SKILLS ===========
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(profile_id, tag)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skills TO authenticated;
GRANT SELECT ON public.skills TO anon;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages skills" ON public.skills
  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Public reads skills of published profiles" ON public.skills
  FOR SELECT TO anon, authenticated USING (public.is_profile_published(profile_id));

-- =========== JOURNEY MILESTONES ===========
CREATE TABLE public.journey_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_milestones TO authenticated;
GRANT SELECT ON public.journey_milestones TO anon;
GRANT ALL ON public.journey_milestones TO service_role;
ALTER TABLE public.journey_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages journey" ON public.journey_milestones
  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Public reads journey of published profiles" ON public.journey_milestones
  FOR SELECT TO anon, authenticated USING (public.is_profile_published(profile_id));
CREATE TRIGGER trg_journey_updated_at BEFORE UPDATE ON public.journey_milestones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== PORTFOLIO ITEMS ===========
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  file_url TEXT,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolio_items TO authenticated;
GRANT SELECT ON public.portfolio_items TO anon;
GRANT ALL ON public.portfolio_items TO service_role;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages portfolio" ON public.portfolio_items
  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Public reads portfolio of published profiles" ON public.portfolio_items
  FOR SELECT TO anon, authenticated USING (public.is_profile_published(profile_id));
CREATE TRIGGER trg_portfolio_updated_at BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
