import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User as UserIcon,
  Bell,
  Palette,
  Lock,
  Globe,
  Info,
  LogOut,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Type,
  ShieldAlert,
  Mail,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Section =
  | "account"
  | "profile"
  | "notifications"
  | "appearance"
  | "privacy"
  | "language"
  | "about";

const sections: { id: Section; label: string; icon: typeof UserIcon }[] = [
  { id: "account", label: "บัญชี", icon: UserIcon },
  { id: "profile", label: "โปรไฟล์", icon: UserIcon },
  { id: "notifications", label: "การแจ้งเตือน", icon: Bell },
  { id: "appearance", label: "การแสดงผล", icon: Palette },
  { id: "privacy", label: "ความเป็นส่วนตัว", icon: Lock },
  { id: "language", label: "ภาษา", icon: Globe },
  { id: "about", label: "เกี่ยวกับ", icon: Info },
];

export default function Settings() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    setTheme,
    notifications,
    setNotification,
    display,
    setDisplay,
  } = useSettings();

  const [active, setActive] = useState<Section>("account");
  const [editOpen, setEditOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [loading, user, navigate]);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPw(false);
    if (error) {
      toast.error("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message);
    } else {
      toast.success("เปลี่ยนรหัสผ่านสำเร็จแล้ว");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSignOutAll = async () => {
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) {
      toast.error("ออกจากระบบไม่สำเร็จ");
    } else {
      toast.success("ออกจากทุกอุปกรณ์แล้ว");
      navigate("/auth");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold">ตั้งค่า</h1>
        <p className="text-sm text-muted-foreground">
          จัดการบัญชีและการตั้งค่าการใช้งานของคุณ
        </p>
      </div>

      <Tabs value={active} onValueChange={(v) => setActive(v as Section)}>
        <div className="border-b border-border bg-background">
          <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none bg-transparent p-2">
            {sections.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="flex shrink-0 items-center gap-2 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ACCOUNT */}
        <TabsContent value="account" className="m-0 space-y-6 p-4">
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">ข้อมูลบัญชี</h2>
              <p className="text-sm text-muted-foreground">
                อีเมลและข้อมูลการเข้าสู่ระบบ
              </p>
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>ชื่อผู้ใช้</Label>
              <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                @{profile?.username || "-"}
              </div>
            </div>
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">เปลี่ยนรหัสผ่าน</h2>
              <p className="text-sm text-muted-foreground">
                ใช้รหัสผ่านที่คาดเดายากอย่างน้อย 8 ตัวอักษร
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPw}>
              {changingPw ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
            </Button>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">เซสชัน</h2>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
              <Button variant="outline" onClick={handleSignOutAll}>
                ออกจากทุกอุปกรณ์
              </Button>
            </div>
          </section>
        </TabsContent>

        {/* PROFILE */}
        <TabsContent value="profile" className="m-0 space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">โปรไฟล์สาธารณะ</h2>
            <p className="text-sm text-muted-foreground">
              แก้ไขชื่อที่แสดง คำอธิบายตัว รูปโปรไฟล์ และภาพหน้าปก
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border p-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl text-primary-foreground">
                {(profile?.display_name || "ผ").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {profile?.display_name || "ผู้ใช้"}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                @{profile?.username}
              </p>
              {profile?.bio && (
                <p className="mt-1 line-clamp-2 text-sm">{profile.bio}</p>
              )}
            </div>
          </div>
          <Button onClick={() => setEditOpen(true)}>แก้ไขโปรไฟล์</Button>
          <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="m-0 space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">การแจ้งเตือน</h2>
            <p className="text-sm text-muted-foreground">
              เลือกประเภทการแจ้งเตือนที่ต้องการรับ
            </p>
          </div>

          {[
            { key: "likes", label: "การถูกใจ", desc: "เมื่อมีคนถูกใจโพสต์ของคุณ" },
            { key: "follows", label: "ผู้ติดตาม", desc: "เมื่อมีคนเริ่มติดตามคุณ" },
            { key: "comments", label: "ความคิดเห็น", desc: "เมื่อมีคนแสดงความคิดเห็นในโพสต์" },
            { key: "mentions", label: "การกล่าวถึง", desc: "เมื่อมีคนกล่าวถึง @คุณ" },
            { key: "reposts", label: "การรีโพสต์", desc: "เมื่อมีคนรีโพสต์โพสต์ของคุณ" },
            { key: "sound", label: "เสียงแจ้งเตือน", desc: "เล่นเสียงเมื่อได้รับแจ้งเตือน" },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="min-w-0 pr-3">
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(v) =>
                  setNotification(item.key as keyof typeof notifications, v)
                }
              />
            </div>
          ))}
        </TabsContent>

        {/* APPEARANCE */}
        <TabsContent value="appearance" className="m-0 space-y-6 p-4">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">ธีมสี</h2>
              <p className="text-sm text-muted-foreground">
                เลือกโหมดสว่าง มืด หรือตามระบบ
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "light", label: "สว่าง", icon: Sun },
                { id: "dark", label: "มืด", icon: Moon },
                { id: "system", label: "ตามระบบ", icon: Monitor },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id as typeof theme)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                    theme === id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">ขนาดตัวอักษร</h2>
              <p className="text-sm text-muted-foreground">
                ปรับขนาดตัวอักษรสำหรับการอ่าน
              </p>
            </div>
            <Select
              value={display.fontSize}
              onValueChange={(v) =>
                setDisplay("fontSize", v as typeof display.fontSize)
              }
            >
              <SelectTrigger className="w-full sm:w-64">
                <Type className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">เล็ก</SelectItem>
                <SelectItem value="base">มาตรฐาน</SelectItem>
                <SelectItem value="lg">ใหญ่</SelectItem>
              </SelectContent>
            </Select>
          </section>

          <Separator />

          <section className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">ลดการเคลื่อนไหว</p>
              <p className="text-sm text-muted-foreground">
                ปิดแอนิเมชันที่ไม่จำเป็น
              </p>
            </div>
            <Switch
              checked={display.reducedMotion}
              onCheckedChange={(v) => setDisplay("reducedMotion", v)}
            />
          </section>
        </TabsContent>

        {/* PRIVACY */}
        <TabsContent value="privacy" className="m-0 space-y-6 p-4">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">ความเป็นส่วนตัว</h2>
            <p className="text-sm text-muted-foreground">
              โพสต์และโปรไฟล์ของคุณจะแสดงต่อสาธารณะโดยค่าเริ่มต้น
            </p>
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
              <ShieldAlert className="mb-2 inline h-4 w-4 text-primary" /> ระบบมีการตรวจสอบรหัสผ่านที่รั่วไหลผ่านฐานข้อมูล HIBP โดยอัตโนมัติ
            </div>
          </section>

          <Separator />

          <section className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">ลบบัญชี</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              การลบบัญชีจะลบข้อมูลทั้งหมดของคุณอย่างถาวรและไม่สามารถกู้คืนได้
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบบัญชีของฉัน
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>ยืนยันการลบบัญชี?</AlertDialogTitle>
                  <AlertDialogDescription>
                    หากต้องการลบบัญชี กรุณาติดต่อทีมงานผ่านอีเมล support เพื่อขอลบข้อมูลอย่างถาวร
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      toast.info("โปรดติดต่อทีมงานเพื่อดำเนินการลบบัญชี")
                    }
                  >
                    รับทราบ
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </TabsContent>

        {/* LANGUAGE */}
        <TabsContent value="language" className="m-0 space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">ภาษา</h2>
            <p className="text-sm text-muted-foreground">
              ภาษาที่ใช้แสดงผลในแอปพลิเคชัน
            </p>
          </div>
          <Select value="th" onValueChange={() => {}}>
            <SelectTrigger className="w-full sm:w-64">
              <Globe className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="th">ไทย (Thai)</SelectItem>
              <SelectItem value="en" disabled>
                English (เร็ว ๆ นี้)
              </SelectItem>
            </SelectContent>
          </Select>
        </TabsContent>

        {/* ABOUT */}
        <TabsContent value="about" className="m-0 space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">เกี่ยวกับ ท้องฟ้า</h2>
            <p className="text-sm text-muted-foreground">
              เครือข่ายสังคมภาษาไทยที่ได้แรงบันดาลใจจาก Bluesky
            </p>
          </div>
          <div className="space-y-2 rounded-lg border border-border p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">เวอร์ชัน</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">สร้างด้วย</span>
              <span className="font-medium">Lovable</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">ข้อกำหนดในการให้บริการ</a>
            <a href="#" className="hover:text-primary">นโยบายความเป็นส่วนตัว</a>
            <a href="#" className="hover:text-primary">ติดต่อทีมงาน</a>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
