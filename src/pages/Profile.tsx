import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Link as LinkIcon, ArrowLeft, Loader2 } from "lucide-react";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { format } from "date-fns";
import { th } from "date-fns/locale";

const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const joinedDate = profile.created_at
    ? format(new Date(profile.created_at), "MMMM yyyy", { locale: th })
    : "";

  return (
    <MainLayout showRightSidebar={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-6 px-4">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {profile.display_name || "ผู้ใช้"}
            </h1>
            <p className="text-sm text-muted-foreground">0 โพสต์</p>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      <div className="relative h-32 bg-gradient-to-r from-primary/60 to-sky-light sm:h-48">
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt="Cover"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Profile Info */}
      <div className="relative border-b border-border px-4 pb-4">
        {/* Avatar */}
        <div className="relative -mt-16 mb-3 sm:-mt-20">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || "Avatar"}
              className="h-24 w-24 rounded-full border-4 border-card object-cover sm:h-32 sm:w-32"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-3xl font-bold text-primary-foreground sm:h-32 sm:w-32 sm:text-4xl">
              {(profile.display_name || "ผู้ใช้").charAt(0)}
            </div>
          )}
        </div>

        {/* Edit Button */}
        <div className="absolute right-4 top-4">
          <Button
            variant="outline"
            className="rounded-full font-semibold"
            onClick={() => setIsEditDialogOpen(true)}
          >
            แก้ไขโปรไฟล์
          </Button>
        </div>

        {/* Name & Handle */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {profile.display_name || "ผู้ใช้"}
          </h2>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mb-3 whitespace-pre-wrap text-foreground">{profile.bio}</p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>เข้าร่วมเมื่อ {joinedDate}</span>
          </div>
        </div>

        {/* Follow Stats */}
        <div className="mt-3 flex gap-4">
          <button className="text-sm hover:underline">
            <span className="font-bold text-foreground">0</span>{" "}
            <span className="text-muted-foreground">กำลังติดตาม</span>
          </button>
          <button className="text-sm hover:underline">
            <span className="font-bold text-foreground">0</span>{" "}
            <span className="text-muted-foreground">ผู้ติดตาม</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            โพสต์
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            ตอบกลับ
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-none border-b-2 border-transparent py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            ถูกใจ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">📝</div>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              ยังไม่มีโพสต์
            </h3>
            <p className="text-muted-foreground">
              เริ่มโพสต์เพื่อแชร์ความคิดของคุณ
            </p>
          </div>
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">💬</div>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              ยังไม่มีการตอบกลับ
            </h3>
            <p className="text-muted-foreground">
              ร่วมสนทนากับคนอื่นๆ
            </p>
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 text-6xl">❤️</div>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              ยังไม่มีโพสต์ที่ถูกใจ
            </h3>
            <p className="text-muted-foreground">
              กดถูกใจโพสต์ที่คุณชอบ
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </MainLayout>
  );
};

export default Profile;
