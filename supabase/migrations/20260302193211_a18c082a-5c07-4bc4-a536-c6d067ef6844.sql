
-- Fix groups policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.groups;
DROP POLICY IF EXISTS "Admins can insert groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;

CREATE POLICY "Enable read access for all users" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Admins can insert groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update groups" ON public.groups FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete groups" ON public.groups FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix banners policies
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admins can manage banners" ON public.banners;

CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())));
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix group_submissions policies
DROP POLICY IF EXISTS "Users can create submissions" ON public.group_submissions;
DROP POLICY IF EXISTS "Users can view own submissions" ON public.group_submissions;
DROP POLICY IF EXISTS "Admins can view all submissions" ON public.group_submissions;

CREATE POLICY "Users can create submissions" ON public.group_submissions FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Users can view own submissions" ON public.group_submissions FOR SELECT TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "Admins can view all submissions" ON public.group_submissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix group_edit_requests policies
DROP POLICY IF EXISTS "Users can create edit requests" ON public.group_edit_requests;
DROP POLICY IF EXISTS "Users can view own edit requests" ON public.group_edit_requests;
DROP POLICY IF EXISTS "Admins can manage edit requests" ON public.group_edit_requests;

CREATE POLICY "Users can create edit requests" ON public.group_edit_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Users can view own edit requests" ON public.group_edit_requests FOR SELECT TO authenticated USING (requested_by = auth.uid());
CREATE POLICY "Admins can manage edit requests" ON public.group_edit_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
