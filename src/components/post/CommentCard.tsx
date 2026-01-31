import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@/hooks/useComments";

interface CommentCardProps {
  comment: Comment;
  onDelete: (commentId: string) => void;
}

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === comment.user_id;

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: th,
  });

  return (
    <div className="flex gap-3 border-b border-border p-4 transition-colors hover:bg-muted/30">
      <Link to={`/profile/${comment.user_id}`}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.author?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {(comment.author?.display_name || "ผู้ใช้").charAt(0)}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to={`/profile/${comment.user_id}`}
              className="font-semibold text-foreground hover:underline truncate"
            >
              {comment.author?.display_name || "ผู้ใช้"}
            </Link>
            {comment.author?.username && (
              <span className="text-sm text-muted-foreground truncate">
                @{comment.author.username}
              </span>
            )}
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
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

        <p className="mt-1 text-foreground whitespace-pre-wrap break-words">
          {comment.content}
        </p>
      </div>
    </div>
  );
}
