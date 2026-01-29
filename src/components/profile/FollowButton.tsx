import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  isFollowing: boolean;
  loading: boolean;
  onClick: () => void;
  className?: string;
}

export function FollowButton({ isFollowing, loading, onClick, className }: FollowButtonProps) {
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      className={cn(
        "rounded-full font-semibold transition-all",
        isFollowing && "hover:border-destructive hover:bg-destructive/10 hover:text-destructive",
        className
      )}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <span className="group-hover:hidden">กำลังติดตาม</span>
      ) : (
        "ติดตาม"
      )}
    </Button>
  );
}
