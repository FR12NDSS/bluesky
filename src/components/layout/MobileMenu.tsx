import { Home, Search, Bell, User, Settings, LogOut, Cloud, Shield, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useAdmin } from "@/hooks/useAdmin";

const baseNavItems = [
  { icon: Home, label: "หน้าแรก", path: "/" },
  { icon: Search, label: "ค้นหา", path: "/search" },
  { icon: Bell, label: "แจ้งเตือน", path: "/notifications" },
  { icon: User, label: "โปรไฟล์", path: "/profile" },
  { icon: Settings, label: "ตั้งค่า", path: "/settings" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAdmin();

  const navItems = isAdmin
    ? [...baseNavItems, { icon: Shield, label: "แอดมิน", path: "/admin" }]
    : baseNavItems;

  const close = () => setOpen(false);

  const handleSignOut = async () => {
    close();
    await signOut();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="เปิดเมนู"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle asChild>
            <Link to="/" onClick={close} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Cloud className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">ท้องฟ้า</span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        {profile && (
          <Link
            to="/profile"
            onClick={close}
            className="flex items-center gap-3 border-b border-border p-4 hover:bg-muted"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || "Avatar"}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {(profile.display_name || "ผู้ใช้").charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {profile.display_name || "ผู้ใช้"}
              </p>
              {profile.username && (
                <p className="truncate text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              )}
            </div>
          </Link>
        )}

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const showBadge = item.path === "/notifications" && unreadCount > 0;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={close}
                className={cn(
                  "flex items-center gap-4 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  {showBadge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Button
            asChild
            size="lg"
            className="mt-3 w-full rounded-full py-5 font-semibold"
            onClick={close}
          >
            <Link to="/compose">โพสต์ใหม่</Link>
          </Button>
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
