import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Post } from "./usePosts";

export function useUserRepostedPosts(userId: string | undefined) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepostedPosts = useCallback(async () => {
    if (!userId) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      // Get reposted post IDs
      const { data: repostsData, error: repostsError } = await supabase
        .from("reposts")
        .select("post_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (repostsError) throw repostsError;

      if (!repostsData || repostsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const postIds = repostsData.map((repost) => repost.post_id);

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

          let is_liked = false;
          if (user) {
            const { data } = await supabase.rpc("has_liked", {
              user_uuid: user.id,
              target_post_id: post.id,
            });
            is_liked = data || false;
          }

          return {
            ...post,
            author: profileMap.get(post.user_id) || null,
            likes_count: stats?.[0]?.likes_count || 0,
            comments_count: stats?.[0]?.comments_count || 0,
            reposts_count: stats?.[0]?.reposts_count || 0,
            is_liked,
            is_reposted: true, // Always true since these are reposted posts
          };
        })
      );

      // Sort by repost order (most recently reposted first)
      const repostOrder = new Map(repostsData.map((r, i) => [r.post_id, i]));
      enrichedPosts.sort((a, b) => {
        const orderA = repostOrder.get(a.id) ?? 999;
        const orderB = repostOrder.get(b.id) ?? 999;
        return orderA - orderB;
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error fetching reposted posts:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchRepostedPosts();

    if (userId) {
      const channel = supabase
        .channel(`user-reposts-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "reposts",
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchRepostedPosts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchRepostedPosts, userId]);

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

    try {
      // Unrepost the post
      await supabase
        .from("reposts")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

      // Remove from local state
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Error toggling repost:", error);
    }
  };

  return {
    posts,
    loading,
    toggleLike,
    toggleRepost,
    refetch: fetchRepostedPosts,
  };
}
