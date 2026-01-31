import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  author: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function useComments(postId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (!commentsData) {
        setComments([]);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const enrichedComments = commentsData.map((comment) => ({
        ...comment,
        author: profiles?.find((p) => p.user_id === comment.user_id) || null,
      }));

      setComments(enrichedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchComments, postId]);

  const addComment = async (content: string) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return false;
    }

    if (!content.trim()) {
      toast.error("กรุณาเขียนความคิดเห็น");
      return false;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({ user_id: user.id, post_id: postId, content: content.trim() });

      if (error) throw error;

      toast.success("แสดงความคิดเห็นแล้ว");
      return true;
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("ไม่สามารถแสดงความคิดเห็นได้");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("ลบความคิดเห็นแล้ว");
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("ไม่สามารถลบความคิดเห็นได้");
      return false;
    }
  };

  return {
    comments,
    loading,
    isSubmitting,
    addComment,
    deleteComment,
    refetch: fetchComments,
  };
}

export function useSinglePost(postId: string) {
  const { user } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data: postData, error } = await supabase
          .from("posts")
          .select("*")
          .eq("id", postId)
          .maybeSingle();

        if (error) throw error;

        if (!postData) {
          setPost(null);
          setLoading(false);
          return;
        }

        // Fetch author profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url")
          .eq("user_id", postData.user_id)
          .maybeSingle();

        // Get stats
        const { data: stats } = await supabase.rpc("get_post_stats", {
          target_post_id: postData.id,
        });

        let is_liked = false;
        let is_reposted = false;

        if (user) {
          const [likeResult, repostResult] = await Promise.all([
            supabase.rpc("has_liked", { user_uuid: user.id, target_post_id: postData.id }),
            supabase.rpc("has_reposted", { user_uuid: user.id, target_post_id: postData.id }),
          ]);
          is_liked = likeResult.data || false;
          is_reposted = repostResult.data || false;
        }

        setPost({
          ...postData,
          author: profile,
          likes_count: stats?.[0]?.likes_count || 0,
          comments_count: stats?.[0]?.comments_count || 0,
          reposts_count: stats?.[0]?.reposts_count || 0,
          is_liked,
          is_reposted,
        });
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, user]);

  return { post, loading };
}
