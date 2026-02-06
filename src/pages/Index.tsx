import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { ComposePost, PostCard, QuotePostCard, CommentDialog, RepostDialog } from "@/components/post";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { useQuoteReposts } from "@/hooks/useQuoteReposts";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { posts, loading: postsLoading, createPost, deletePost, toggleLike, toggleRepost, quoteRepost } = usePosts();
  const { quoteReposts, loading: quoteRepostsLoading } = useQuoteReposts();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<typeof posts[0] | null>(null);
  const [repostDialogOpen, setRepostDialogOpen] = useState(false);
  const [repostPost, setRepostPost] = useState<typeof posts[0] | null>(null);

  const handleOpenCommentDialog = (post: typeof posts[0]) => {
    setSelectedPost(post);
    setCommentDialogOpen(true);
  };

  const handleOpenRepostDialog = (post: typeof posts[0]) => {
    setRepostPost(post);
    setRepostDialogOpen(true);
  };

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
        {postsLoading || quoteRepostsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Merge and sort posts with quote reposts by date */}
            {(() => {
              // Create combined feed items
              type FeedItem = 
                | { type: 'post'; data: typeof posts[0]; date: Date }
                | { type: 'quote'; data: typeof quoteReposts[0]; date: Date };

              const feedItems: FeedItem[] = [
                ...posts.map(post => ({
                  type: 'post' as const,
                  data: post,
                  date: new Date(post.created_at),
                })),
                ...quoteReposts.map(quote => ({
                  type: 'quote' as const,
                  data: quote,
                  date: new Date(quote.created_at),
                })),
              ].sort((a, b) => b.date.getTime() - a.date.getTime());

              if (feedItems.length === 0) {
                return (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">ยังไม่มีโพสต์</p>
                    <p className="text-sm text-muted-foreground mt-1">เริ่มโพสต์เพื่อแชร์ความคิดของคุณ!</p>
                  </div>
                );
              }

              return feedItems.map((item) => {
                if (item.type === 'post') {
                  const post = item.data;
                  return (
                    <PostCard
                      key={`post-${post.id}`}
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
                      onComment={() => handleOpenCommentDialog(post)}
                      onRepost={() => handleOpenRepostDialog(post)}
                      onShare={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                      }}
                      onDelete={() => deletePost(post.id)}
                    />
                  );
                } else {
                  const quote = item.data;
                  return (
                    <QuotePostCard
                      key={`quote-${quote.id}`}
                      id={quote.id}
                      quoter={{
                        name: quote.quoter?.display_name || "ผู้ใช้",
                        handle: `@${quote.quoter?.username || "user"}`,
                        avatar: quote.quoter?.avatar_url,
                      }}
                      quoteContent={quote.quote_content}
                      originalPost={{
                        id: quote.original_post.id,
                        content: quote.original_post.content,
                        image: quote.original_post.image_url,
                        author: {
                          name: quote.original_post.author?.display_name || "ผู้ใช้",
                          handle: `@${quote.original_post.author?.username || "user"}`,
                          avatar: quote.original_post.author?.avatar_url,
                        },
                      }}
                      createdAt={new Date(quote.created_at)}
                      likes={quote.likes_count}
                      comments={quote.comments_count}
                      reposts={quote.reposts_count}
                      isLiked={quote.is_liked}
                      isReposted={quote.is_reposted}
                      isOwner={quote.user_id === user?.id}
                      onLike={() => toggleLike(quote.post_id)}
                      onComment={() => {
                        // Find the original post to open comment dialog
                        const originalPost = posts.find(p => p.id === quote.post_id);
                        if (originalPost) handleOpenCommentDialog(originalPost);
                      }}
                      onRepost={() => {
                        const originalPost = posts.find(p => p.id === quote.post_id);
                        if (originalPost) handleOpenRepostDialog(originalPost);
                      }}
                      onShare={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/post/${quote.post_id}`);
                      }}
                    />
                  );
                }
              });
            })()}
          </>
        )}
      </div>

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
          onRepost={() => toggleRepost(repostPost.id)}
          onQuoteRepost={(content) => quoteRepost(repostPost.id, content)}
        />
      )}
    </MainLayout>
  );
};

export default Index;
