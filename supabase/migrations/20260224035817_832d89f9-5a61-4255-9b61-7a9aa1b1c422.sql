
-- Onboarding steps (global)
CREATE TABLE public.onboarding_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text,
  description text,
  sort_order integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Onboarding progress (location-scoped)
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL,
  step_id uuid REFERENCES public.onboarding_steps(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(location_id, step_id)
);

-- Training subjects (global)
CREATE TABLE public.training_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  accent_color text,
  sort_order integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Training videos (global)
CREATE TABLE public.training_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid REFERENCES public.training_subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- Training progress (location-scoped)
CREATE TABLE public.training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text NOT NULL,
  video_id uuid REFERENCES public.training_videos(id) ON DELETE CASCADE,
  watched boolean DEFAULT false,
  completed_at timestamptz,
  UNIQUE(location_id, video_id)
);

-- Automation boards
CREATE TABLE public.automation_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id text,
  name text NOT NULL,
  is_standard boolean DEFAULT false,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

-- Automation columns
CREATE TABLE public.automation_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid REFERENCES public.automation_boards(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order integer
);

-- Automation cards
CREATE TABLE public.automation_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id uuid REFERENCES public.automation_columns(id) ON DELETE CASCADE,
  card_type text NOT NULL,
  label text,
  notes text,
  sort_order integer
);

-- User roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  UNIQUE(user_id, role)
);

-- has_role RPC function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS: onboarding_steps
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read onboarding_steps" ON public.onboarding_steps FOR SELECT USING (true);
CREATE POLICY "Admins can insert onboarding_steps" ON public.onboarding_steps FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update onboarding_steps" ON public.onboarding_steps FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete onboarding_steps" ON public.onboarding_steps FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read onboarding_progress" ON public.onboarding_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can insert onboarding_progress" ON public.onboarding_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update onboarding_progress" ON public.onboarding_progress FOR UPDATE USING (true);

-- RLS: training_subjects
ALTER TABLE public.training_subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training_subjects" ON public.training_subjects FOR SELECT USING (true);
CREATE POLICY "Admins can insert training_subjects" ON public.training_subjects FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update training_subjects" ON public.training_subjects FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete training_subjects" ON public.training_subjects FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: training_videos
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training_videos" ON public.training_videos FOR SELECT USING (true);
CREATE POLICY "Admins can insert training_videos" ON public.training_videos FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update training_videos" ON public.training_videos FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete training_videos" ON public.training_videos FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: training_progress
ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read training_progress" ON public.training_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can insert training_progress" ON public.training_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update training_progress" ON public.training_progress FOR UPDATE USING (true);

-- RLS: automation_boards
ALTER TABLE public.automation_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read automation_boards" ON public.automation_boards FOR SELECT USING (true);
CREATE POLICY "Admins can insert standard boards" ON public.automation_boards FOR INSERT WITH CHECK (
  CASE WHEN is_standard THEN public.has_role(auth.uid(), 'admin') ELSE true END
);
CREATE POLICY "Admins can update standard boards" ON public.automation_boards FOR UPDATE USING (
  CASE WHEN is_standard THEN public.has_role(auth.uid(), 'admin') ELSE true END
);
CREATE POLICY "Admins can delete standard boards" ON public.automation_boards FOR DELETE USING (
  CASE WHEN is_standard THEN public.has_role(auth.uid(), 'admin') ELSE true END
);

-- RLS: automation_columns
ALTER TABLE public.automation_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read automation_columns" ON public.automation_columns FOR SELECT USING (true);
CREATE POLICY "Anyone can write automation_columns" ON public.automation_columns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update automation_columns" ON public.automation_columns FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete automation_columns" ON public.automation_columns FOR DELETE USING (true);

-- RLS: automation_cards
ALTER TABLE public.automation_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read automation_cards" ON public.automation_cards FOR SELECT USING (true);
CREATE POLICY "Anyone can write automation_cards" ON public.automation_cards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update automation_cards" ON public.automation_cards FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete automation_cards" ON public.automation_cards FOR DELETE USING (true);

-- RLS: user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
