import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import type { UserComment } from "@/hooks/useUserComments";

interface UserCommentCardProps {
  comment: UserComment;
  userProfile: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function UserCommentCard({ comment, userProfile }: UserCommentCardProps) {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { 
    addSuffix: true, 
    locale: th 
  });

  const handleClick = () => {
    if (comment.post_id) {
      navigate(`/post/${comment.post_id}`);
    }
  };

  return (
    <article
      onClick={handleClick}
      className="border-b border-border p-4 transition-colors hover:bg-muted/30 cursor-pointer"
    >
      {/* Replying to indicator */}
      {comment.post && (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          <span>ตอบกลับ</span>
          <span className="font-medium text-foreground">
            @{comment.post.author?.username || "ผู้ใช้"}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {userProfile.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.display_name || "Avatar"}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {(userProfile.display_name || "ผู้ใช้").charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {userProfile.display_name || "ผู้ใช้"}
            </span>
            {userProfile.username && (
              <span className="text-muted-foreground">@{userProfile.username}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Comment Content */}
          <p className="mt-1 whitespace-pre-wrap break-words text-foreground">
            {comment.content}
          </p>

          {/* Original Post Preview */}
          {comment.post && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-sm">
                {comment.post.author?.avatar_url ? (
                  <img
                    src={comment.post.author.avatar_url}
                    alt={comment.post.author.display_name || "Avatar"}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {(comment.post.author?.display_name || "ผู้ใช้").charAt(0)}
                  </div>
                )}
                <span className="font-medium text-foreground">
                  {comment.post.author?.display_name || "ผู้ใช้"}
                </span>
                {comment.post.author?.username && (
                  <span className="text-muted-foreground">
                    @{comment.post.author.username}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {comment.post.content}
              </p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
