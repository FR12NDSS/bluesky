import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Post } from "./usePosts";

export function useUserLikedPosts(userId: string | undefined) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLikedPosts = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      // Get liked post IDs
      const { data: likesData, error: likesError } = await supabase
        .from("likes")
        .select("post_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (likesError) throw likesError;

      if (!likesData || likesData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = likesData.map((like) => like.post_id);

      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("id, user_id, content, image_url, created_at")
        .in("id", postIds);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(postsData.map((post) => post.user_id))];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p]) || []
      );

      // Enrich posts with stats
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          const { data: stats } = await supabase.rpc("get_post_stats", {
            target_post_id: post.id,
          });

          let is_reposted = false;
          if (user) {
            const { data } = await supabase.rpc("has_reposted", {
              user_uuid: user.id,
              target_post_id: post.id,
            });
            is_reposted = data || false;
          }

          return {
            ...post,
            author: profileMap.get(post.user_id) || null,
            likes_count: stats?.[0]?.likes_count || 0,
            comments_count: stats?.[0]?.comments_count || 0,
            reposts_count: stats?.[0]?.reposts_count || 0,
            is_liked: true, // Always true since these are liked posts
            is_reposted,
          };
        })
      );

      // Sort by like order (most recently liked first)
      const likeOrder = new Map(likesData.map((l, i) => [l.post_id, i]));
      enrichedPosts.sort((a, b) => {
        const orderA = likeOrder.get(a.id) ?? 999;
        const orderB = likeOrder.get(b.id) ?? 999;
        return orderA - orderB;
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchLikedPosts();

    if (userId) {
      const channel = supabase
        .channel(`user-likes-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "likes",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchLikedPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchLikedPosts, userId]);

  const toggleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    try {
      // Unlike the post
      await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
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

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_reposted: !p.is_reposted,
                reposts_count: p.is_reposted
                  ? p.reposts_count - 1
                  : p.reposts_count + 1,
              }
            : p
        )
      );
    } catch (error) {
      console.error("Error toggling repost:", error);
    }
  };

  return {
    posts,
    loading,
    toggleLike,
    toggleRepost,
    refetch: fetchLikedPosts,
  };
}
