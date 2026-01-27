import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PostCardProps {
  id: string;
  author: {
    name: string;
    handle: string;
    avatar?: string | null;
  };
  content: string;
  image?: string | null;
  createdAt: Date;
  likes: number;
  comments: number;
  reposts: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isOwner?: boolean;
  onLike?: () => void;
  onComment?: () => void;
  onRepost?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export function PostCard({
  author,
  content,
  image,
  createdAt,
  likes,
  comments,
  reposts,
  isLiked = false,
  isReposted = false,
  isOwner = false,
  onLike,
  onComment,
  onRepost,
  onShare,
  onDelete,
}: PostCardProps) {
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true, locale: th });

  return (
    <article className="border-b border-border p-4 transition-colors hover:bg-muted/30">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {author.avatar ? (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {author.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground hover:underline">
                {author.name}
              </span>
              <span className="text-muted-foreground">{author.handle}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{timeAgo}</span>
            </div>

            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && (
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    ลบโพสต์
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>แจ้งปัญหา</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Content */}
          <p className="mt-1 whitespace-pre-wrap break-words text-foreground">
            {content}
          </p>

          {/* Image */}
          {image && (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <img
                src={image}
                alt="Post image"
                className="max-h-96 w-full object-cover"
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between max-w-md">
            {/* Comment */}
            <button
              onClick={onComment}
              className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-primary/10">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-sm">{comments > 0 ? comments : ""}</span>
            </button>

            {/* Repost */}
            <button
              onClick={onRepost}
              className={cn(
                "group flex items-center gap-2 transition-colors",
                isReposted
                  ? "text-success"
                  : "text-muted-foreground hover:text-success"
              )}
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-success/10">
                <Repeat2 className="h-5 w-5" />
              </div>
              <span className="text-sm">{reposts > 0 ? reposts : ""}</span>
            </button>

            {/* Like */}
            <button
              onClick={onLike}
              className={cn(
                "group flex items-center gap-2 transition-colors",
                isLiked
                  ? "text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-destructive/10">
                <Heart
                  className={cn("h-5 w-5", isLiked && "fill-current animate-heart-beat")}
                />
              </div>
              <span className="text-sm">{likes > 0 ? likes : ""}</span>
            </button>

            {/* Share */}
            <button
              onClick={onShare}
              className="group flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <div className="rounded-full p-2 transition-colors group-hover:bg-primary/10">
                <Share className="h-5 w-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
