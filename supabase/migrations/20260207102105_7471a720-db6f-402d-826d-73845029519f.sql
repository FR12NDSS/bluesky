-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'
  )
$$;

-- RLS Policies for user_roles
-- Everyone can view roles (needed for admin checks)
CREATE POLICY "Roles are viewable by everyone"
ON public.user_roles FOR SELECT
USING (true);

-- Only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin(auth.uid()));

-- Only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_admin(auth.uid()));

-- Allow admins to delete any posts
CREATE POLICY "Admins can delete any posts"
ON public.posts FOR DELETE
USING (public.is_admin(auth.uid()));

-- Allow admins to delete any comments
CREATE POLICY "Admins can delete any comments"
ON public.comments FOR DELETE
USING (public.is_admin(auth.uid()));

-- Create function to get platform statistics
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE(
  total_users integer,
  total_posts integer,
  total_comments integer,
  total_likes integer,
  users_today integer,
  posts_today integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*)::INTEGER FROM public.profiles),
    (SELECT COUNT(*)::INTEGER FROM public.posts),
    (SELECT COUNT(*)::INTEGER FROM public.comments),
    (SELECT COUNT(*)::INTEGER FROM public.likes),
    (SELECT COUNT(*)::INTEGER FROM public.profiles WHERE created_at >= CURRENT_DATE),
    (SELECT COUNT(*)::INTEGER FROM public.posts WHERE created_at >= CURRENT_DATE);
$$;