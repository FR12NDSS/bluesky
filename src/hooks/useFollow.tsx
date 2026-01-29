import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<FollowStats>({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!targetUserId) return;

    try {
      // Fetch follower count
      const { count: followersCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", targetUserId);

      // Fetch following count
      const { count: followingCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", targetUserId);

      // Check if current user is following target
      let isFollowing = false;
      if (user && user.id !== targetUserId) {
        const { data } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId)
          .maybeSingle();
        isFollowing = !!data;
      }

      setStats({
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        isFollowing,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const follow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetUserId,
      });

      if (error) throw error;

      setStats((prev) => ({
        ...prev,
        followersCount: prev.followersCount + 1,
        isFollowing: true,
      }));

      toast({
        title: "ติดตามแล้ว",
        description: "คุณกำลังติดตามผู้ใช้นี้",
      });
    } catch (error: any) {
      console.error("Error following user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถติดตามได้",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const unfollow = async () => {
    if (!user || !targetUserId) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;

      setStats((prev) => ({
        ...prev,
        followersCount: Math.max(0, prev.followersCount - 1),
        isFollowing: false,
      }));

      toast({
        title: "เลิกติดตามแล้ว",
        description: "คุณเลิกติดตามผู้ใช้นี้แล้ว",
      });
    } catch (error: any) {
      console.error("Error unfollowing user:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเลิกติดตามได้",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleFollow = async () => {
    if (stats.isFollowing) {
      await unfollow();
    } else {
      await follow();
    }
  };

  return {
    ...stats,
    loading,
    actionLoading,
    follow,
    unfollow,
    toggleFollow,
    refreshStats: fetchStats,
  };
}

interface FollowUser {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export function useFollowList(userId: string | undefined, type: "followers" | "following") {
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        if (type === "followers") {
          // Get users who follow this user
          const { data: followsData, error: followsError } = await supabase
            .from("follows")
            .select("follower_id")
            .eq("following_id", userId);

          if (followsError) throw followsError;

          if (followsData && followsData.length > 0) {
            const followerIds = followsData.map((f) => f.follower_id);
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, user_id, username, display_name, avatar_url, bio")
              .in("user_id", followerIds);

            if (profilesError) throw profilesError;
            setUsers(profilesData || []);
          } else {
            setUsers([]);
          }
        } else {
          // Get users this user follows
          const { data: followsData, error: followsError } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", userId);

          if (followsError) throw followsError;

          if (followsData && followsData.length > 0) {
            const followingIds = followsData.map((f) => f.following_id);
            const { data: profilesData, error: profilesError } = await supabase
              .from("profiles")
              .select("id, user_id, username, display_name, avatar_url, bio")
              .in("user_id", followingIds);

            if (profilesError) throw profilesError;
            setUsers(profilesData || []);
          } else {
            setUsers([]);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [userId, type]);

  return { users, loading };
}
