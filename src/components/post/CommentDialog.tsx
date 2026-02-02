import { useState, useRef, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/useComments";
import { useMention } from "@/hooks/useMention";
import { MentionSuggestions } from "./MentionSuggestions";

interface CommentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  postAuthor: {
    name: string;
    handle: string;
    avatar?: string | null;
  };
  postContent: string;
  postCreatedAt: Date;
}

export function CommentDialog({
  open,
  onOpenChange,
  postId,
  postAuthor,
  postContent,
  postCreatedAt,
}: CommentDialogProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addComment, isSubmitting } = useComments(postId);
  
  const {
    mentionQuery,
    mentionPosition,
    suggestions,
    loading: mentionLoading,
    showSuggestions,
    handleInputChange,
    handleSelectUser,
    closeSuggestions,
  } = useMention();

  const timeAgo = formatDistanceToNow(postCreatedAt, { addSuffix: true, locale: th });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);
    handleInputChange(newValue, e.target.selectionStart || 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === "Escape")) {
      e.preventDefault();
      if (e.key === "Escape") {
        closeSuggestions();
      }
    }
  };

  const handleSelectMention = useCallback((username: string) => {
    if (!textareaRef.current) return;
    
    const cursorPos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);
    
    // Find the @ position
    const atIndex = textBefore.lastIndexOf("@");
    if (atIndex === -1) return;
    
    const newText = textBefore.substring(0, atIndex) + `@${username} ` + textAfter;
    setContent(newText);
    handleSelectUser(username);
    
    // Focus and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = atIndex + username.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, handleSelectUser]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    const success = await addComment(content);
    if (success) {
      setContent("");
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ตอบกลับ</DialogTitle>
        </DialogHeader>

        {/* Original Post Preview */}
        <div className="flex gap-3 border-b border-border pb-4">
          <div className="flex-shrink-0">
            {postAuthor.avatar ? (
              <img
                src={postAuthor.avatar}
                alt={postAuthor.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {postAuthor.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {postAuthor.name}
              </span>
              <span className="text-muted-foreground text-sm">{postAuthor.handle}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{timeAgo}</span>
            </div>
            <p className="mt-1 text-sm text-foreground line-clamp-3">
              {postContent}
            </p>
          </div>
        </div>

        {/* Reply Form */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="เขียนความคิดเห็นของคุณ... (ใช้ @username เพื่อกล่าวถึง)"
            className="min-h-[100px] resize-none border-0 focus-visible:ring-0 text-base"
            maxLength={300}
          />
          
          {/* Mention Suggestions */}
          {showSuggestions && (
            <MentionSuggestions
              suggestions={suggestions}
              loading={mentionLoading}
              onSelect={handleSelectMention}
              onClose={closeSuggestions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {content.length}/300
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังโพสต์...
              </>
            ) : (
              "ตอบกลับ"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
