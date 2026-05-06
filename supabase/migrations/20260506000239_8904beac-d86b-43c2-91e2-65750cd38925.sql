
CREATE POLICY "Admins can update leads"
ON public.contact_leads
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
