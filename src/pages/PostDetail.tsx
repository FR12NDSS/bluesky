import { useParams, useNavigate, Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { th } from "date-fns/locale";
import { ArrowLeft, Heart, MessageCircle, Repeat2, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MainLayout } from "@/components/layout/MainLayout";
import { CommentCard } from "@/components/post/CommentCard";
import { CommentForm } from "@/components/post/CommentForm";
import { useSinglePost, useComments } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { cn } from "@/lib/utils";

export default function PostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { post, loading: postLoading } = useSinglePost(postId || "");
  const { comments, loading: commentsLoading, isSubmitting, addComment, deleteComment } = useComments(postId || "");
  const { toggleLike, toggleRepost, deletePost } = usePosts();

  const handleDelete = async () => {
    if (!post) return;
    const success = await deletePost(post.id);
    if (success) {
      navigate("/");
    }
  };

  const handleLike = () => {
    if (post) toggleLike(post.id);
  };

  const handleRepost = () => {
    if (post) toggleRepost(post.id);
  };

  if (postLoading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">ไม่พบโพสต์</h2>
          <p className="text-muted-foreground mb-4">โพสต์นี้อาจถูกลบหรือไม่มีอยู่</p>
          <Button onClick={() => navigate("/")} variant="outline">
            กลับหน้าหลัก
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isOwner = user?.id === post.user_id;
  const fullDate = format(new Date(post.created_at), "d MMMM yyyy เวลา HH:mm", { locale: th });

  return (
    <MainLayout showRightSidebar={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">โพสต์</h1>
        </div>
      </header>

      {/* Post Content */}
      <article className="border-b border-border p-4">
        {/* Author Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex gap-3">
            <Link to={`/profile/${post.user_id}`}>
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(post.author?.display_name || "ผู้ใช้").charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link
                to={`/profile/${post.user_id}`}
                className="font-bold text-foreground hover:underline"
              >
                {post.author?.display_name || "ผู้ใช้"}
              </Link>
              {post.author?.username && (
                <p className="text-sm text-muted-foreground">
                  @{post.author.username}
                </p>
              )}
            </div>
          </div>

          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบโพสต์
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Text */}
        <div className="mb-4">
          <p className="text-lg text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Post Image */}
        {post.image_url && (
          <div className="mb-4 overflow-hidden rounded-2xl border border-border">
            <img
              src={post.image_url}
              alt="Post image"
              className="w-full object-cover"
            />
          </div>
        )}

        {/* Timestamp */}
        <p className="text-sm text-muted-foreground mb-4">{fullDate}</p>

        {/* Stats */}
        <div className="flex items-center gap-6 border-t border-border pt-4 text-sm text-muted-foreground">
          <span>
            <strong className="text-foreground">{post.reposts_count}</strong> รีโพสต์
          </span>
          <span>
            <strong className="text-foreground">{post.likes_count}</strong> ถูกใจ
          </span>
          <span>
            <strong className="text-foreground">{comments.length}</strong> ความคิดเห็น
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-around border-t border-border pt-3 mt-3">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </button>
          <button
            onClick={handleRepost}
            className={cn(
              "flex items-center gap-2 p-2 transition-colors",
              post.is_reposted
                ? "text-green-500"
                : "text-muted-foreground hover:text-green-500"
            )}
          >
            <Repeat2 className={cn("h-5 w-5", post.is_reposted && "fill-current")} />
          </button>
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-2 p-2 transition-colors",
              post.is_liked
                ? "text-red-500"
                : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart className={cn("h-5 w-5", post.is_liked && "fill-current")} />
          </button>
        </div>
      </article>

      {/* Comment Form */}
      <CommentForm onSubmit={addComment} isSubmitting={isSubmitting} />

      {/* Comments List */}
      <section>
        {commentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : comments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            ยังไม่มีความคิดเห็น เป็นคนแรกที่ตอบกลับ!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              onDelete={deleteComment}
              onReply={addComment}
              isSubmitting={isSubmitting}
            />
          ))
        )}
      </section>
    </MainLayout>
  );
}
