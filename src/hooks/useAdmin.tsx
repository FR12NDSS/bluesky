import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface PlatformStats {
  total_users: number;
  total_posts: number;
  total_comments: number;
  total_likes: number;
  users_today: number;
  posts_today: number;
}

interface UserWithRole {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "moderator" | "user" | null;
}

interface AdminPost {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  author: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface AdminComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  post_id: string;
  author: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function useAdmin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if current user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("is_admin", { _user_id: user.id });
      if (error) {
        console.error("Error checking admin status:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!user?.id,
  });

  // Fetch platform statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_stats");
      if (error) throw error;
      return data[0] as PlatformStats;
    },
    enabled: isAdmin === true,
  });

  // Fetch all users with roles
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get roles for all users
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) || null,
      })) as UserWithRole[];
    },
    enabled: isAdmin === true,
  });

  // Fetch all posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id, content, image_url, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(data.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((post) => ({
        ...post,
        author: profileMap.get(post.user_id) || null,
      })) as AdminPost[];
    },
    enabled: isAdmin === true,
  });

  // Fetch all comments
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, post_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get author profiles
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((comment) => ({
        ...comment,
        author: profileMap.get(comment.user_id) || null,
      })) as AdminComment[];
    },
    enabled: isAdmin === true,
  });

  // Set user role mutation
  const setUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      // First, delete existing role
      await supabase.from("user_roles").delete().eq("user_id", userId);
      
      // Then insert new role
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: role,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("เปลี่ยนบทบาทสำเร็จ");
    },
    onError: (error) => {
      console.error("Error setting role:", error);
      toast.error("ไม่สามารถเปลี่ยนบทบาทได้");
    },
  });

  // Delete post mutation
  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("ลบโพสต์สำเร็จ");
    },
    onError: (error) => {
      console.error("Error deleting post:", error);
      toast.error("ไม่สามารถลบโพสต์ได้");
    },
  });

  // Delete comment mutation
  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast.success("ลบความคิดเห็นสำเร็จ");
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast.error("ไม่สามารถลบความคิดเห็นได้");
    },
  });

  return {
    isAdmin,
    isCheckingAdmin,
    stats,
    isLoadingStats,
    users,
    isLoadingUsers,
    posts,
    isLoadingPosts,
    comments,
    isLoadingComments,
    setUserRole,
    deletePost,
    deleteComment,
  };
}
