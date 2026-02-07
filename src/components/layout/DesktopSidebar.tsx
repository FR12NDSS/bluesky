import { Home, Search, Bell, User, Settings, LogOut, Cloud, Shield } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

export function DesktopSidebar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const { isAdmin } = useAdmin();

  const handleSignOut = async () => {
    await signOut();
  };

  // Add admin item if user is admin
  const navItems = isAdmin 
    ? [...baseNavItems, { icon: Shield, label: "แอดมิน", path: "/admin" }]
    : baseNavItems;

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-border bg-card p-4 md:flex lg:w-72">
      {/* Logo */}
      <Link to="/" className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Cloud className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground">ท้องฟ้า</span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const showBadge = item.path === "/notifications" && unreadCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 rounded-lg px-4 py-3 text-lg font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", isActive && "text-primary")} />
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

        {/* Post Button */}
        <Button
          asChild
          size="lg"
          className="mt-4 w-full rounded-full py-6 text-lg font-semibold"
        >
          <Link to="/compose">โพสต์ใหม่</Link>
        </Button>
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t border-border pt-4">
        {profile && (
          <div className="mb-3 flex items-center gap-3 px-4 py-2">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.display_name || "Avatar"}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
          </div>
        )}
        <button 
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
