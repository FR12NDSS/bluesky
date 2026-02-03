import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserComment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
  parent_id: string | null;
  post: {
    id: string;
    content: string;
    author: {
      user_id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export function useUserComments(userId: string | undefined) {
  const [comments, setComments] = useState<UserComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserComments = useCallback(async () => {
    if (!userId) {
      setComments([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          post_id,
          parent_id
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (commentsError) throw commentsError;

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Fetch related posts
      const postIds = [...new Set(commentsData.map((c) => c.post_id))];
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, user_id")
        .in("id", postIds);

      // Fetch post authors
      const postAuthorIds = [...new Set(postsData?.map((p) => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", postAuthorIds);

      // Build enriched comments
      const enrichedComments: UserComment[] = commentsData.map((comment) => {
        const post = postsData?.find((p) => p.id === comment.post_id);
        const postAuthor = post 
          ? profiles?.find((p) => p.user_id === post.user_id) || null 
          : null;

        return {
          ...comment,
          post: post ? {
            id: post.id,
            content: post.content,
            author: postAuthor,
          } : null,
        };
      });

      setComments(enrichedComments);
    } catch (error) {
      console.error("Error fetching user comments:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserComments();

    // Subscribe to realtime updates
    if (userId) {
      const channel = supabase
        .channel(`user-comments-${userId}`)
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "comments",
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchUserComments();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchUserComments, userId]);

  return {
    comments,
    loading,
    refetch: fetchUserComments,
  };
}
