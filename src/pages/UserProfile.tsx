import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { PostCard, CommentDialog, RepostDialog } from "@/components/post";
import { UserCommentCard } from "@/components/profile";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useUserPosts } from "@/hooks/useUserPosts";
import { useUserLikedPosts } from "@/hooks/useUserLikedPosts";
import { useUserRepostedPosts } from "@/hooks/useUserRepostedPosts";
import { useUserComments } from "@/hooks/useUserComments";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ArrowLeft, Loader2 } from "lucide-react";
import { FollowButton } from "@/components/profile/FollowButton";
import { FollowListDialog } from "@/components/profile/FollowListDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at: string;
}

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostPost, setRepostPost] = useState<any>(null);

  const {
    followersCount,
    followingCount,
    isFollowing,
    actionLoading,
    toggleFollow,
  } = useFollow(userId);

  // Fetch user's posts, likes, reposts, and comments
  const { 
    posts: userPosts, 
    loading: postsLoading, 
    toggleLike: togglePostLike, 
    toggleRepost: togglePostRepost,
    deletePost 
  } = useUserPosts(userId);

  const { 
    posts: likedPosts, 
    loading: likedLoading, 
    toggleLike: toggleLikedPostLike 
  } = useUserLikedPosts(userId);

  const { 
    posts: repostedPosts, 
    loading: repostedLoading, 
    toggleLike: toggleRepostedPostLike, 
    toggleRepost: toggleRepostedPostRepost 
  } = useUserRepostedPosts(userId);

  const { 
    comments: userComments, 
    loading: commentsLoading 
  } = useUserComments(userId);

  const handleOpenCommentDialog = (post: any) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
  };

  const handleOpenRepostDialog = (post: any, toggleFn: (id: string) => void) => {
    setRepostPost({ ...post, toggleFn });
    setRepostDialogOpen(true);
  };

  const handleQuoteRepost = async (postId: string, quoteContent: string) => {
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
      toast.success("โควตรีโพสต์สำเร็จ!");
      return true;
    } catch (error) {
      console.error("Error quote reposting:", error);
      toast.error("ไม่สามารถโควตรีโพสต์ได้");
      return false;
    }
  };

  // If viewing own profile, redirect to /profile
  useEffect(() => {
    if (user && userId === user.id) {
      navigate("/profile", { replace: true });
    }
  }, [user, userId, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">😕</div>
          <h2 className="mb-2 text-xl font-bold text-foreground">
            ไม่พบผู้ใช้นี้
          </h2>
          <p className="mb-4 text-muted-foreground">
            ผู้ใช้นี้อาจถูกลบหรือไม่มีอยู่
          </p>
          <Button onClick={() => navigate(-1)}>ย้อนกลับ</Button>
        </div>
      </MainLayout>
    );
  }

  const joinedDate = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy", { locale: th })
    : "";

  return (
    <MainLayout showRightSidebar={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-6 px-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {profile.display_name || "ผู้ใช้"}
            </h1>
            <p className="text-sm text-muted-foreground">{userPosts.length} โพสต์</p>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-primary/60 to-sky-light sm:h-48">
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="relative border-b border-border px-4 pb-4">
        {/* Avatar */}
        <div className="relative -mt-16 mb-3 sm:-mt-20">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || "Avatar"}
              className="h-24 w-24 rounded-full border-4 border-card object-cover sm:h-32 sm:w-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground sm:h-32 sm:w-32 sm:text-4xl">
              {(profile.display_name || "ผู้ใช้").charAt(0)}
            </div>
          )}
        </div>

        {/* Follow Button */}
        {user && (
          <div className="absolute right-4 top-4">
            <FollowButton
              isFollowing={isFollowing}
              loading={actionLoading}
              onClick={toggleFollow}
            />
          </div>
        )}

        {/* Name & Handle */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {profile.display_name || "ผู้ใช้"}
          </h2>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mb-3 whitespace-pre-wrap text-foreground">{profile.bio}</p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>เข้าร่วมเมื่อ {joinedDate}</span>
          </div>
        </div>

        {/* Follow Stats */}
        <div className="mt-3 flex gap-4">
          <button
            className="text-sm hover:underline"
            onClick={() => setFollowingDialogOpen(true)}
          >
            <span className="font-bold text-foreground">{followingCount}</span>{" "}
            <span className="text-muted-foreground">กำลังติดตาม</span>
          </button>
          <button
            className="text-sm hover:underline"
            onClick={() => setFollowersDialogOpen(true)}
          >
            <span className="font-bold text-foreground">{followersCount}</span>{" "}
            <span className="text-muted-foreground">ผู้ติดตาม</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            โพสต์
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            ตอบกลับ
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            ถูกใจ
          </TabsTrigger>
          <TabsTrigger
            value="reposts"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            รีโพสต์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {postsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userPosts.length > 0 ? (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={{
                  name: post.author?.display_name || "ผู้ใช้",
                  handle: `@${post.author?.username || "user"}`,
                  avatar: post.author?.avatar_url,
                }}
                content={post.content}
                image={post.image_url}
                createdAt={new Date(post.created_at)}
                likes={post.likes_count}
                comments={post.comments_count}
                reposts={post.reposts_count}
                isLiked={post.is_liked}
                isReposted={post.is_reposted}
                isOwner={post.user_id === user?.id}
                onLike={() => togglePostLike(post.id)}
                onComment={() => handleOpenCommentDialog(post)}
                onRepost={() => handleOpenRepostDialog(post, togglePostRepost)}
                onShare={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                }}
                onDelete={() => deletePost(post.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">📝</div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                ยังไม่มีโพสต์
              </h3>
              <p className="text-muted-foreground">
                ผู้ใช้นี้ยังไม่ได้โพสต์อะไร
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          {commentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : userComments.length > 0 ? (
            userComments.map((comment) => (
              <UserCommentCard 
                key={comment.id} 
                comment={comment} 
                userProfile={{
                  display_name: profile.display_name,
                  username: profile.username,
                  avatar_url: profile.avatar_url,
                }}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                ยังไม่มีการตอบกลับ
              </h3>
              <p className="text-muted-foreground">
                ผู้ใช้นี้ยังไม่ได้ตอบกลับอะไร
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          {likedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : likedPosts.length > 0 ? (
            likedPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={{
                  name: post.author?.display_name || "ผู้ใช้",
                  handle: `@${post.author?.username || "user"}`,
                  avatar: post.author?.avatar_url,
                }}
                content={post.content}
                image={post.image_url}
                createdAt={new Date(post.created_at)}
                likes={post.likes_count}
                comments={post.comments_count}
                reposts={post.reposts_count}
                isLiked={post.is_liked}
                isReposted={post.is_reposted}
                isOwner={post.user_id === user?.id}
                onLike={() => toggleLikedPostLike(post.id)}
                onComment={() => handleOpenCommentDialog(post)}
                onRepost={() => handleOpenRepostDialog(post, () => {})}
                onShare={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                }}
                onDelete={() => {}}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">❤️</div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                ยังไม่มีโพสต์ที่ถูกใจ
              </h3>
              <p className="text-muted-foreground">
                ผู้ใช้นี้ยังไม่ได้ถูกใจโพสต์ใดๆ
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reposts" className="mt-0">
          {repostedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : repostedPosts.length > 0 ? (
            repostedPosts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={{
                  name: post.author?.display_name || "ผู้ใช้",
                  handle: `@${post.author?.username || "user"}`,
                  avatar: post.author?.avatar_url,
                }}
                content={post.content}
                image={post.image_url}
                createdAt={new Date(post.created_at)}
                likes={post.likes_count}
                comments={post.comments_count}
                reposts={post.reposts_count}
                isLiked={post.is_liked}
                isReposted={post.is_reposted}
                isOwner={post.user_id === user?.id}
                onLike={() => toggleRepostedPostLike(post.id)}
                onComment={() => handleOpenCommentDialog(post)}
                onRepost={() => handleOpenRepostDialog(post, toggleRepostedPostRepost)}
                onShare={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                }}
                onDelete={() => {}}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-6xl">🔁</div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                ยังไม่มีโพสต์ที่รีโพสต์
              </h3>
              <p className="text-muted-foreground">
                ผู้ใช้นี้ยังไม่ได้รีโพสต์อะไร
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Follow Dialogs */}
      <FollowListDialog
        open={followersDialogOpen}
        onOpenChange={setFollowersDialogOpen}
        userId={userId!}
        type="followers"
        title="ผู้ติดตาม"
      />
      <FollowListDialog
        open={followingDialogOpen}
        onOpenChange={setFollowingDialogOpen}
        userId={userId!}
        type="following"
        title="กำลังติดตาม"
      />

      {/* Comment Dialog */}
      {selectedPost && (
        <CommentDialog
          open={commentDialogOpen}
          onOpenChange={setCommentDialogOpen}
          postId={selectedPost.id}
          postAuthor={{
            name: selectedPost.author?.display_name || "ผู้ใช้",
            handle: `@${selectedPost.author?.username || "user"}`,
            avatar: selectedPost.author?.avatar_url,
          }}
          postContent={selectedPost.content}
          postCreatedAt={new Date(selectedPost.created_at)}
        />
      )}

      {/* Repost Dialog */}
      {repostPost && (
        <RepostDialog
          open={repostDialogOpen}
          onOpenChange={setRepostDialogOpen}
          postAuthor={{
            name: repostPost.author?.display_name || "ผู้ใช้",
            handle: `@${repostPost.author?.username || "user"}`,
            avatar: repostPost.author?.avatar_url,
          }}
          postContent={repostPost.content}
          isReposted={repostPost.is_reposted}
          onRepost={() => repostPost.toggleFn(repostPost.id)}
          onQuoteRepost={(content) => handleQuoteRepost(repostPost.id, content)}
        />
      )}
    </MainLayout>
  );
};

export default UserProfile;
