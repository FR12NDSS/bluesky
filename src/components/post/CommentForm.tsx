import { useState, useRef } from "react";
import { Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CommentForm({ onSubmit, isSubmitting }: CommentFormProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const success = await onSubmit(content);
    if (success) {
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && content.trim()) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!user) {
    return (
      <div className="border-t border-border p-4 text-center text-muted-foreground text-sm">
        กรุณาเข้าสู่ระบบเพื่อแสดงความคิดเห็น
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {(profile?.display_name || "ผู้ใช้").charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder="เขียนความคิดเห็น..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            className="pr-10 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/30"
            maxLength={300}
          />
          
          {content.trim() && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
