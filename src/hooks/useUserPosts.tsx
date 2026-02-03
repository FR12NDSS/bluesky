import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Post } from "./usePosts";

export function useUserPosts(userId: string | undefined) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserPosts = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select(`
          id,
          user_id,
          content,
          image_url,
          created_at
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Fetch author profile
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .eq("user_id", userId);

      const author = profiles?.[0] || null;

      // Build posts with stats
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          // Get stats
          const { data: stats } = await supabase.rpc("get_post_stats", {
            target_post_id: post.id,
          });

          let is_liked = false;
          let is_reposted = false;

          if (user) {
            const [likeResult, repostResult] = await Promise.all([
              supabase.rpc("has_liked", { user_uuid: user.id, target_post_id: post.id }),
              supabase.rpc("has_reposted", { user_uuid: user.id, target_post_id: post.id }),
            ]);
            is_liked = likeResult.data || false;
            is_reposted = repostResult.data || false;
          }

          return {
            ...post,
            author,
            likes_count: stats?.[0]?.likes_count || 0,
            comments_count: stats?.[0]?.comments_count || 0,
            reposts_count: stats?.[0]?.reposts_count || 0,
            is_liked,
            is_reposted,
          };
        })
      );

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchUserPosts();

    // Subscribe to realtime updates for this user's posts
    if (userId) {
      const channel = supabase
        .channel(`user-posts-${userId}`)
        .on(
          "postgres_changes",
          { 
            event: "*", 
            schema: "public", 
            table: "posts",
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchUserPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchUserPosts, userId]);

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("likes")
          .insert({ user_id: user.id, post_id: postId });
      }

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked: !p.is_liked,
                likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const toggleRepost = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      if (post.is_reposted) {
        await supabase
          .from("reposts")
          .delete()
          .eq("user_id", user.id)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("reposts")
          .insert({ user_id: user.id, post_id: postId });
      }

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_reposted: !p.is_reposted,
                reposts_count: p.is_reposted ? p.reposts_count - 1 : p.reposts_count + 1,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling repost:", error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;
      
      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      return false;
    }
  };

  return {
    posts,
    loading,
    toggleLike,
    toggleRepost,
    deletePost,
    refetch: fetchUserPosts,
  };
}
