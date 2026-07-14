-- ===================================================================
-- Fix 1: notifications_insert_policy_missing
-- Add explicit INSERT policy that denies all client inserts.
-- SECURITY DEFINER triggers bypass RLS and continue to work.
-- ===================================================================
CREATE POLICY "No client inserts on notifications"
ON public.notifications
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

-- ===================================================================
-- Fix 2: user_roles_public_exposure
-- Restrict SELECT so users can only see their own role.
-- Admin checks continue to work via SECURITY DEFINER has_role/is_admin.
-- ===================================================================
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- ===================================================================
-- Fix 3: security_definer_functions
-- Add authorization checks to notification helper functions so they
-- only operate on the calling user's own data.
-- ===================================================================
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(target_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.notifications
    WHERE user_id = target_user_id AND read = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
    RAISE EXCEPTION 'Unauthorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.notifications
  SET read = true
  WHERE user_id = target_user_id AND read = false;
END;
$$;

-- ===================================================================
-- Fix 4: hashtag_injection_risk
-- Enforce length constraint on hashtags at the database level.
-- ===================================================================
ALTER TABLE public.hashtags
  ADD CONSTRAINT hashtag_length_check
  CHECK (char_length(tag) >= 2 AND char_length(tag) <= 50);

-- ===================================================================
-- Fix 5: hashtag_manipulation
-- Remove client-side write access to hashtags. Move hashtag sync into
-- a SECURITY DEFINER trigger driven by post inserts. Also enforce a
-- maximum of 10 hashtags per post server-side (addresses count-limit
-- part of hashtag_injection_risk).
-- ===================================================================
DROP POLICY IF EXISTS "Authenticated users can insert hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Authenticated users can update hashtags" ON public.hashtags;

-- Sync trigger: extracts hashtags from post content and updates the
-- hashtags + post_hashtags tables. Runs as owner so it can bypass RLS.
CREATE OR REPLACE FUNCTION public.sync_post_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  hashtag_matches text[];
  raw_tag text;
  clean_tag text;
  tag_id uuid;
  processed_tags text[] := ARRAY[]::text[];
  max_hashtags constant int := 10;
BEGIN
  -- Extract distinct hashtags (Thai + ASCII word chars), lowercase, with '#'.
  SELECT array_agg(DISTINCT lower('#' || m[1]))
    INTO hashtag_matches
  FROM regexp_matches(COALESCE(NEW.content, ''), '#([[:alnum:]_\u0e00-\u0e7f]+)', 'g') AS m;

  IF hashtag_matches IS NULL THEN
    RETURN NEW;
  END IF;

  -- Enforce max hashtags per post
  IF array_length(hashtag_matches, 1) > max_hashtags THEN
    RAISE EXCEPTION 'Too many hashtags (max %)', max_hashtags USING ERRCODE = '22023';
  END IF;

  FOREACH clean_tag IN ARRAY hashtag_matches
  LOOP
    -- Length guard (defense-in-depth alongside CHECK constraint)
    IF char_length(clean_tag) < 2 OR char_length(clean_tag) > 50 THEN
      CONTINUE;
    END IF;

    -- Upsert hashtag row
    INSERT INTO public.hashtags (tag, post_count, last_used_at)
    VALUES (clean_tag, 1, now())
    ON CONFLICT (tag) DO UPDATE
      SET post_count = public.hashtags.post_count + 1,
          last_used_at = now()
    RETURNING id INTO tag_id;

    -- Link post <-> hashtag
    INSERT INTO public.post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, tag_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_insert_sync_hashtags ON public.posts;
CREATE TRIGGER on_post_insert_sync_hashtags
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_post_hashtags();

-- Cleanup trigger: decrement counts when posts are deleted.
CREATE OR REPLACE FUNCTION public.cleanup_post_hashtags()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.hashtags h
     SET post_count = GREATEST(0, h.post_count - 1)
   WHERE h.id IN (
     SELECT hashtag_id FROM public.post_hashtags WHERE post_id = OLD.id
   );
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_post_delete_cleanup_hashtags ON public.posts;
CREATE TRIGGER on_post_delete_cleanup_hashtags
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_post_hashtags();