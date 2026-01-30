import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SearchUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface SearchPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  is_liked: boolean;
  is_reposted: boolean;
}

export function useSearch() {
  const { user } = useAuth();
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, bio")
        .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPosts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select("id, user_id, content, image_url, created_at")
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      // Enrich posts
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          const author = profiles?.find((p) => p.user_id === post.user_id) || null;

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
      console.error("Error searching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const searchByHashtag = useCallback(async (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag : `#${tag}`;
    await searchPosts(cleanTag);
  }, [searchPosts]);

  return {
    users,
    posts,
    loading,
    searchUsers,
    searchPosts,
    searchByHashtag,
  };
}
