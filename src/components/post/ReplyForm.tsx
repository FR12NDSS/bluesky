import { useState, useRef, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormProps {
  replyingTo: string;
  onSubmit: (content: string) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function ReplyForm({ replyingTo, onSubmit, onCancel, isSubmitting }: ReplyFormProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    const success = await onSubmit(content);
    if (success) {
      setContent("");
      onCancel();
    }
  };

  return (
    <div className="mt-2 ml-12 border-l-2 border-border pl-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">
          ตอบกลับ <span className="text-primary font-medium">@{replyingTo}</span>
        </span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="เขียนการตอบกลับ..."
        className="min-h-[60px] resize-none text-sm"
        maxLength={300}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{content.length}/300</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ยกเลิก
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                กำลังส่ง...
              </>
            ) : (
              "ตอบกลับ"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
