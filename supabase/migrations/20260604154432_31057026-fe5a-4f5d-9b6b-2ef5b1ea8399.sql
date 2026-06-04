
-- App role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admin policy for profiles (read all)
CREATE POLICY "admins read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Prediction history
CREATE TABLE public.prediction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specific_gravity NUMERIC(5,3) NOT NULL,
  hypertension BOOLEAN NOT NULL,
  hemoglobin NUMERIC(5,2) NOT NULL,
  diabetes_mellitus BOOLEAN NOT NULL,
  albumin SMALLINT NOT NULL,
  appetite TEXT NOT NULL CHECK (appetite IN ('good','poor')),
  red_blood_cell_count NUMERIC(4,2) NOT NULL,
  pus_cell TEXT NOT NULL CHECK (pus_cell IN ('normal','abnormal')),
  selected_model TEXT NOT NULL CHECK (selected_model IN ('random_forest','adaboost','gradient_boosting')),
  prediction_result TEXT NOT NULL CHECK (prediction_result IN ('ckd','not_ckd')),
  confidence_score NUMERIC(5,2) NOT NULL,
  prediction_timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.prediction_history TO authenticated;
GRANT ALL ON public.prediction_history TO service_role;
ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own predictions" ON public.prediction_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own predictions" ON public.prediction_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users delete own predictions" ON public.prediction_history FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins read all predictions" ON public.prediction_history FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX prediction_history_user_id_idx ON public.prediction_history(user_id);
CREATE INDEX prediction_history_timestamp_idx ON public.prediction_history(prediction_timestamp DESC);

-- Auto-create profile + assign role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  admin_emails TEXT[] := ARRAY['nikhilmudhiraj.ch@gmail.com'];
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
