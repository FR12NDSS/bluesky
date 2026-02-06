-- Add quote_content column to reposts table for quote reposts
ALTER TABLE public.reposts 
ADD COLUMN quote_content TEXT DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN public.reposts.quote_content IS 'Optional quote text when user does a quote repost';