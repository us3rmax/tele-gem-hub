
-- Allow admins to insert groups (when approving submissions)
CREATE POLICY "Admins can insert groups"
ON public.groups
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update groups
CREATE POLICY "Admins can update groups"
ON public.groups
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete groups
CREATE POLICY "Admins can delete groups"
ON public.groups
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
