import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useTrendingHashtags } from "@/hooks/usePosts";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { supabase } from "@/integrations/supabase/client";

interface SuggestedUser {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

function SuggestedUserItem({ u }: { u: SuggestedUser }) {
  const navigate = useNavigate();
  const { isFollowing, loading, toggleFollow } = useFollow(u.user_id);

  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() => navigate(`/profile/${u.user_id}`)}
        className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <Avatar className="h-10 w-10">
          <AvatarImage src={u.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {(u.display_name || "U").charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-foreground truncate">
            {u.display_name || "ผู้ใช้"}
          </span>
          <span className="text-sm text-muted-foreground truncate">
            @{u.username || "user"}
          </span>
        </div>
      </button>
      <Button
        variant={isFollowing ? "outline" : "default"}
        size="sm"
        className="rounded-full"
        onClick={toggleFollow}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          "ติดตามแล้ว"
        ) : (
          "ติดตาม"
        )}
      </Button>
    </div>
  );
}

export function RightSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hashtags, loading: trendingLoading } = useTrendingHashtags();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) {
        setLoadingSuggested(false);
        return;
      }

      try {
        // Get users not followed by current user (excluding self)
        const { data: following } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        const followingIds = following?.map((f) => f.following_id) || [];
        followingIds.push(user.id); // Exclude self

        let query = supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_url")
          .limit(5);

        if (followingIds.length > 0) {
          query = query.not("user_id", "in", `(${followingIds.join(",")})`);
        }

        const { data } = await query;
        setSuggestedUsers(data || []);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      } finally {
        setLoadingSuggested(false);
      }
    };

    fetchSuggestedUsers();
  }, [user]);

  const handleHashtagClick = (tag: string) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-80 flex-col gap-4 overflow-y-auto p-4 lg:flex">
      {/* Trending */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            กำลังมาแรง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {trendingLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : hashtags.length > 0 ? (
            hashtags.slice(0, 5).map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => handleHashtagClick(topic.tag)}
                className="flex w-full flex-col items-start rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                <span className="text-xs text-muted-foreground">
                  อันดับ {index + 1} · กำลังมาแรง
                </span>
                <span className="font-semibold text-foreground">{topic.tag}</span>
                <span className="text-sm text-muted-foreground">
                  {topic.post_count.toLocaleString()} โพสต์
                </span>
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              ยังไม่มี hashtag ที่กำลังมาแรง
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suggested Users */}
      {user && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              แนะนำให้ติดตาม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingSuggested ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : suggestedUsers.length > 0 ? (
              suggestedUsers.map((u) => (
                <SuggestedUserItem key={u.user_id} u={u} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                ไม่มีคำแนะนำในขณะนี้
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-auto text-xs text-muted-foreground">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">
            เงื่อนไขการใช้งาน
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            นโยบายความเป็นส่วนตัว
          </a>
          <span>·</span>
          <a href="#" className="hover:underline">
            เกี่ยวกับเรา
          </a>
        </div>
        <p className="mt-2">© 2024 ท้องฟ้า</p>
      </div>
    </aside>
  );
}
