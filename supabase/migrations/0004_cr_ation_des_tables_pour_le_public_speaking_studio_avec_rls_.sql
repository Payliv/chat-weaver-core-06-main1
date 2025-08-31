-- Table: public_speaking_sessions
CREATE TABLE public.public_speaking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  overall_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.public_speaking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own public_speaking_sessions" ON public.public_speaking_sessions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own public_speaking_sessions" ON public.public_speaking_sessions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public_speaking_sessions" ON public.public_speaking_sessions
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public_speaking_sessions" ON public.public_speaking_sessions
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_public_speaking_sessions_updated_at
BEFORE UPDATE ON public.public_speaking_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Table: speech_analyses
CREATE TABLE public.speech_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.public_speaking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  speech_text TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.speech_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own speech_analyses" ON public.speech_analyses
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own speech_analyses" ON public.speech_analyses
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own speech_analyses" ON public.speech_analyses
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own speech_analyses" ON public.speech_analyses
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Table: audience_simulations
CREATE TABLE public.audience_simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.public_speaking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  persona TEXT NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.audience_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audience_simulations" ON public.audience_simulations
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audience_simulations" ON public.audience_simulations
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audience_simulations" ON public.audience_simulations
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audience_simulations" ON public.audience_simulations
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Table: guided_exercises
CREATE TABLE public.guided_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.public_speaking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  challenge_text TEXT NOT NULL,
  user_response TEXT NOT NULL,
  feedback_result TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.guided_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own guided_exercises" ON public.guided_exercises
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own guided_exercises" ON public.guided_exercises
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guided_exercises" ON public.guided_exercises
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guided_exercises" ON public.guided_exercises
FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- Table: public_speaking_actions
CREATE TABLE public.public_speaking_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.public_speaking_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT NOT NULL,
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.public_speaking_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own public_speaking_actions" ON public.public_speaking_actions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own public_speaking_actions" ON public.public_speaking_actions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own public_speaking_actions" ON public.public_speaking_actions
FOR DELETE TO authenticated USING (auth.uid() = user_id);