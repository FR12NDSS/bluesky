-- Add 'reply' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'reply';

-- Create trigger function for comment replies
CREATE OR REPLACE FUNCTION public.handle_comment_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_comment_owner_id uuid;
BEGIN
  -- Only process if this is a reply (has parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the owner of the parent comment
    SELECT user_id INTO parent_comment_owner_id 
    FROM public.comments 
    WHERE id = NEW.parent_id;
    
    -- Don't notify if replying to your own comment
    IF parent_comment_owner_id IS NOT NULL AND parent_comment_owner_id != NEW.user_id THEN
      INSERT INTO public.notifications (user_id, actor_id, type, post_id)
      VALUES (parent_comment_owner_id, NEW.user_id, 'reply', NEW.post_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for comment replies
DROP TRIGGER IF EXISTS on_comment_reply ON public.comments;
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_comment_reply();