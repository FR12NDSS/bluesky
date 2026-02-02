import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Trash2, MoreHorizontal, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ReplyForm } from "./ReplyForm";
import type { Comment } from "@/hooks/useComments";

interface CommentCardProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
  onReply: (content: string, parentId: string) => Promise<boolean>;
  isSubmitting: boolean;
  isNested?: boolean;
}

export function CommentCard({ comment, onDelete, onReply, isSubmitting, isNested = false }: CommentCardProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const isOwner = user?.id === comment.user_id;

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: th,
  });

  const handleReply = async (content: string) => {
    return onReply(content, comment.id);
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <div className={`border-b border-border ${isNested ? "ml-12 border-l-2 border-l-muted pl-4" : ""}`}>
      <div className="flex gap-3 p-4 transition-colors hover:bg-muted/30">
        <Link to={`/profile/${comment.user_id}`}>
          <Avatar className={isNested ? "h-8 w-8" : "h-10 w-10"}>
            <AvatarImage src={comment.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {(comment.author?.display_name || "ผู้ใช้").charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/profile/${comment.user_id}`}
                className="font-semibold text-foreground hover:underline truncate text-sm"
              >
                {comment.author?.display_name || "ผู้ใช้"}
              </Link>
              {comment.author?.username && (
                <span className="text-xs text-muted-foreground truncate">
                  @{comment.author.username}
                </span>
              )}
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {timeAgo}
              </span>
            </div>

            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    ลบความคิดเห็น
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="mt-1 text-foreground whitespace-pre-wrap break-words text-sm">
            {comment.content}
          </p>

          {/* Reply actions - only show for top-level comments */}
          {!isNested && user && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                ตอบกลับ
              </button>

              {replyCount > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {showReplies ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {replyCount} การตอบกลับ
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && !isNested && (
        <div className="px-4 pb-4">
          <ReplyForm
            replyingTo={comment.author?.username || comment.author?.display_name || "ผู้ใช้"}
            onSubmit={handleReply}
            onCancel={() => setShowReplyForm(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Nested Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="border-t border-border">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onDelete={onDelete}
              onReply={onReply}
              isSubmitting={isSubmitting}
              isNested={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
