import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Post {
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
  // Quote repost fields
  is_quote_repost?: boolean;
  quote_content?: string | null;
  original_post?: {
    id: string;
    content: string;
    image_url: string | null;
    author: {
      user_id: string;
      display_name: string | null;
      username: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  reposted_by?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchPosts = useCallback(async () => {
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
        .order("created_at", { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      if (!postsData) {
        setPosts([]);
        return;
      }

      // Fetch author profiles
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      // Build posts with stats
      const enrichedPosts = await Promise.all(
        postsData.map(async (post) => {
          const author = profiles?.find((p) => p.user_id === post.user_id) || null;
          
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
      console.error("Error fetching posts:", error);
      toast.error("ไม่สามารถโหลดโพสต์ได้");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosts]);

  const createPost = async (content: string, imageFile?: File) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return false;
    }

    setIsCreating(true);
    try {
      let image_url = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("posts")
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }

      // Insert post
      const { error: postError } = await supabase
        .from("posts")
        .insert({ user_id: user.id, content, image_url });

      if (postError) throw postError;

      // Extract and save hashtags
      const hashtags = content.match(/#[\wก-๙]+/g);
      if (hashtags) {
        for (const tag of hashtags) {
          const cleanTag = tag.toLowerCase();
          
          // Upsert hashtag
          const { data: existingTag } = await supabase
            .from("hashtags")
            .select("id, post_count")
            .eq("tag", cleanTag)
            .maybeSingle();

          if (existingTag) {
            await supabase
              .from("hashtags")
              .update({ 
                post_count: existingTag.post_count + 1, 
                last_used_at: new Date().toISOString() 
              })
              .eq("id", existingTag.id);
          } else {
            await supabase
              .from("hashtags")
              .insert({ tag: cleanTag, post_count: 1 });
          }
        }
      }

      toast.success("โพสต์สำเร็จ!");
      return true;
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("ไม่สามารถโพสต์ได้");
      return false;
    } finally {
      setIsCreating(false);
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
      toast.success("ลบโพสต์แล้ว");
      return true;
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("ไม่สามารถลบโพสต์ได้");
      return false;
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return;
    }

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
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return;
    }

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

  const quoteRepost = async (postId: string, quoteContent: string) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return false;
    }

    try {
      const { error } = await supabase
        .from("reposts")
        .insert({ 
          user_id: user.id, 
          post_id: postId,
          quote_content: quoteContent
        });

      if (error) throw error;

      // Update post repost count
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_reposted: true,
                reposts_count: p.reposts_count + 1,
              }
            : p
        )
      );

      toast.success("โควตรีโพสต์สำเร็จ!");
      return true;
    } catch (error) {
      console.error("Error quote reposting:", error);
      toast.error("ไม่สามารถโควตรีโพสต์ได้");
      return false;
    }
  };

  return {
    posts,
    loading,
    isCreating,
    createPost,
    deletePost,
    toggleLike,
    toggleRepost,
    quoteRepost,
    refetch: fetchPosts,
  };
}

export function useTrendingHashtags() {
  const [hashtags, setHashtags] = useState<{ id: string; tag: string; post_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data, error } = await supabase.rpc("get_trending_hashtags", { limit_count: 10 });
        if (error) throw error;
        setHashtags(data || []);
      } catch (error) {
        console.error("Error fetching trending:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return { hashtags, loading };
}
