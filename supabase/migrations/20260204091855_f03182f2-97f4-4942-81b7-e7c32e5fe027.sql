-- Fix 1: Remove permissive notification INSERT policy
-- Notifications should ONLY be created by SECURITY DEFINER triggers, not by direct client inserts
-- The existing triggers (handle_new_follow, handle_new_like, handle_new_comment, handle_new_repost, handle_comment_reply) 
-- are already SECURITY DEFINER and will continue to work

DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;