-- Add parent_id column to comments table for nested replies
ALTER TABLE public.comments 
ADD COLUMN parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- Create index for faster parent lookups
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);

-- Create function to get reply count for a comment
CREATE OR REPLACE FUNCTION public.get_comment_reply_count(target_comment_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER FROM public.comments WHERE parent_id = target_comment_id;
$$;