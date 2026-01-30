import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { ComposePost } from "@/components/post";
import { PostCard } from "@/components/post";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { posts, loading: postsLoading, createPost, deletePost, toggleLike, toggleRepost } = usePosts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (content: string, image?: File | null) => {
    setIsSubmitting(true);
    await createPost(content, image);
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center px-4">
          <h1 className="text-xl font-bold text-foreground">หน้าแรก</h1>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          <button 
            onClick={() => setActiveTab("forYou")}
            className="flex-1 py-3 text-center font-medium text-primary transition-colors hover:bg-muted"
          >
            <span className="relative">
              สำหรับคุณ
              {activeTab === "forYou" && (
                <span className="absolute -bottom-3 left-0 right-0 h-1 rounded-full bg-primary" />
              )}
            </span>
          </button>
          <button 
            onClick={() => setActiveTab("following")}
            className="flex-1 py-3 text-center font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <span className="relative">
              กำลังติดตาม
              {activeTab === "following" && (
                <span className="absolute -bottom-3 left-0 right-0 h-1 rounded-full bg-primary" />
              )}
            </span>
          </button>
        </div>
      </header>

      {/* Compose Post */}
      <ComposePost
        userName={profile?.display_name || "ผู้ใช้"}
        avatar={profile?.avatar_url}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Feed */}
      <div>
        {postsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
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
              onLike={() => toggleLike(post.id)}
              onComment={() => console.log("Comment:", post.id)}
              onRepost={() => toggleRepost(post.id)}
              onShare={() => {
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              }}
              onDelete={() => deletePost(post.id)}
            />
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">ยังไม่มีโพสต์</p>
            <p className="text-sm text-muted-foreground mt-1">เริ่มโพสต์เพื่อแชร์ความคิดของคุณ!</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
