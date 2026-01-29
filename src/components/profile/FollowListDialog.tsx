import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowList } from "@/hooks/useFollow";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FollowListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: "followers" | "following";
  title: string;
}

export function FollowListDialog({
  open,
  onOpenChange,
  userId,
  type,
  title,
}: FollowListDialogProps) {
  const { users, loading } = useFollowList(open ? userId : undefined, type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {loading ? (
            <div className="space-y-4 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {type === "followers" ? "ยังไม่มีผู้ติดตาม" : "ยังไม่ได้ติดตามใคร"}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {users.map((user) => (
                <Link
                  key={user.id}
                  to={`/profile/${user.user_id}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {(user.display_name || "ผู้ใช้").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {user.display_name || "ผู้ใช้"}
                    </p>
                    {user.username && (
                      <p className="truncate text-sm text-muted-foreground">
                        @{user.username}
                      </p>
                    )}
                    {user.bio && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
