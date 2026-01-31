import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Image, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { useToast } from "@/hooks/use-toast";

const MAX_CONTENT_LENGTH = 300;

export default function Compose() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { createPost, isCreating } = usePosts();
  const { toast } = useToast();
  
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "ไฟล์ใหญ่เกินไป",
          description: "กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) {
      toast({
        title: "ไม่สามารถโพสต์ได้",
        description: "กรุณาเขียนข้อความหรือแนบรูปภาพ",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPost(content, imageFile || undefined);
      toast({
        title: "โพสต์สำเร็จ! 🎉",
        description: "โพสต์ของคุณถูกเผยแพร่แล้ว",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโพสต์ได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const remainingChars = MAX_CONTENT_LENGTH - content.length;
  const isOverLimit = remainingChars < 0;

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || isOverLimit || (!content.trim() && !imageFile)}
            className="rounded-full px-6"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังโพสต์...
              </>
            ) : (
              "โพสต์"
            )}
          </Button>
        </div>
      </header>

      {/* Compose Area */}
      <div className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {(profile?.display_name || "ผู้ใช้").charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              placeholder="เกิดอะไรขึ้น?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none border-0 bg-transparent p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
              autoFocus
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-4 overflow-hidden rounded-2xl">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-80 w-full object-cover"
                />
                <button
                  onClick={removeImage}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur transition-colors hover:bg-background"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <label className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10">
                  <Image className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
              </div>

              <div
                className={`text-sm font-medium ${
                  isOverLimit
                    ? "text-destructive"
                    : remainingChars <= 20
                    ? "text-warning"
                    : "text-muted-foreground"
                }`}
              >
                {remainingChars}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
