-- Fix hashtags policies - only authenticated users can modify
DROP POLICY IF EXISTS "Anyone can insert hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Anyone can update hashtags" ON public.hashtags;

CREATE POLICY "Authenticated users can insert hashtags" ON public.hashtags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update hashtags" ON public.hashtags
  FOR UPDATE USING (auth.role() = 'authenticated');