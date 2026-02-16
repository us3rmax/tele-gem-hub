
-- Adicionar apenas clicks_count (views já existe na tabela groups)
ALTER TABLE public.groups
ADD COLUMN IF NOT EXISTS clicks_count INTEGER NOT NULL DEFAULT 0;

-- Criar tabela de edições pendentes
CREATE TABLE public.group_edit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- RLS
ALTER TABLE public.group_edit_requests ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver próprias solicitações
CREATE POLICY "Users can view own edit requests"
  ON public.group_edit_requests FOR SELECT
  USING (requested_by = auth.uid());

-- Usuários podem criar solicitações
CREATE POLICY "Users can create edit requests"
  ON public.group_edit_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid());

-- Admins podem gerenciar tudo (usando has_role em vez de profiles.role)
CREATE POLICY "Admins can manage edit requests"
  ON public.group_edit_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
