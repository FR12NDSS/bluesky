import { useState } from "react";
import { Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ComposePostProps {
  onSubmit?: (content: string, image?: File | null) => void;
  placeholder?: string;
  maxLength?: number;
  isSubmitting?: boolean;
  avatar?: string | null;
  userName?: string;
}

export function ComposePost({
  onSubmit,
  placeholder = "มีอะไรอยากเล่า?",
  maxLength = 300,
  isSubmitting = false,
  avatar,
  userName = "ผู้ใช้",
}: ComposePostProps) {
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const remainingChars = maxLength - content.length;
  const isOverLimit = remainingChars < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageFile(null);
  };

  const handleSubmit = () => {
    if (canSubmit && onSubmit) {
      onSubmit(content, imageFile);
      setContent("");
      setImagePreview(null);
      setImageFile(null);
    }
  };

  return (
    <div className="border-b border-border p-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={userName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {userName.charAt(0)}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="min-w-0 flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="relative mt-3 inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 rounded-xl border border-border"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute right-2 top-2 rounded-full bg-foreground/80 p-1 text-background transition-colors hover:bg-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-full p-2 text-primary transition-colors hover:bg-primary/10">
                <Image className="h-5 w-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Counter */}
              <div
                className={cn(
                  "text-sm",
                  remainingChars <= 20
                    ? remainingChars < 0
                      ? "text-destructive"
                      : "text-warning"
                    : "text-muted-foreground"
                )}
              >
                {remainingChars}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-full px-6"
              >
                {isSubmitting ? "กำลังโพสต์..." : "โพสต์"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
