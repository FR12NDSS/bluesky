import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface QuoteRepost {
  id: string;
  user_id: string;
  post_id: string;
  quote_content: string;
  created_at: string;
  quoter: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  original_post: {
    id: string;
    content: string;
    image_url: string | null;
    author: {
      user_id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    } | null;
  };
  // Stats for the original post
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_liked: boolean;
  is_reposted: boolean;
}

export function useQuoteReposts() {
  const { user } = useAuth();
  const [quoteReposts, setQuoteReposts] = useState<QuoteRepost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuoteReposts = useCallback(async () => {
    try {
      // Fetch reposts that have quote_content
      const { data: repostsData, error } = await supabase
        .from("reposts")
        .select("id, user_id, post_id, quote_content, created_at")
        .not("quote_content", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!repostsData || repostsData.length === 0) {
        setQuoteReposts([]);
        return;
      }

      // Get unique user IDs and post IDs
      const quoterIds = [...new Set(repostsData.map(r => r.user_id))];
      const postIds = [...new Set(repostsData.map(r => r.post_id))];

      // Fetch quoter profiles
      const { data: quoterProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", quoterIds);

      // Fetch original posts
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, user_id, content, image_url")
        .in("id", postIds);

      // Get original post author IDs
      const postAuthorIds = postsData ? [...new Set(postsData.map(p => p.user_id))] : [];

      // Fetch post author profiles
      const { data: postAuthorProfiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", postAuthorIds);

      // Build enriched quote reposts
      const enrichedQuoteReposts = await Promise.all(
        repostsData.map(async (repost) => {
          const quoter = quoterProfiles?.find(p => p.user_id === repost.user_id) || null;
          const originalPostData = postsData?.find(p => p.id === repost.post_id);
          const originalPostAuthor = originalPostData 
            ? postAuthorProfiles?.find(p => p.user_id === originalPostData.user_id) || null
            : null;

          // Get stats for original post
          const { data: stats } = await supabase.rpc("get_post_stats", {
            target_post_id: repost.post_id,
          });

          let is_liked = false;
          let is_reposted = false;

          if (user) {
            const [likeResult, repostResult] = await Promise.all([
              supabase.rpc("has_liked", { user_uuid: user.id, target_post_id: repost.post_id }),
              supabase.rpc("has_reposted", { user_uuid: user.id, target_post_id: repost.post_id }),
            ]);
            is_liked = likeResult.data || false;
            is_reposted = repostResult.data || false;
          }

          return {
            id: repost.id,
            user_id: repost.user_id,
            post_id: repost.post_id,
            quote_content: repost.quote_content || "",
            created_at: repost.created_at,
            quoter,
            original_post: originalPostData ? {
              id: originalPostData.id,
              content: originalPostData.content,
              image_url: originalPostData.image_url,
              author: originalPostAuthor,
            } : {
              id: repost.post_id,
              content: "[โพสต์ถูกลบแล้ว]",
              image_url: null,
              author: null,
            },
            likes_count: stats?.[0]?.likes_count || 0,
            comments_count: stats?.[0]?.comments_count || 0,
            reposts_count: stats?.[0]?.reposts_count || 0,
            is_liked,
            is_reposted,
          };
        })
      );

      setQuoteReposts(enrichedQuoteReposts);
    } catch (error) {
      console.error("Error fetching quote reposts:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuoteReposts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("quote-reposts-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reposts" },
        () => {
          fetchQuoteReposts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchQuoteReposts]);

  return { quoteReposts, loading, refetch: fetchQuoteReposts };
}
