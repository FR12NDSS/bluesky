import { Home, Search, Bell, User, Settings, LogOut, Cloud } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: Home, label: "หน้าแรก", path: "/" },
  { icon: Search, label: "ค้นหา", path: "/search" },
  { icon: Bell, label: "แจ้งเตือน", path: "/notifications" },
  { icon: User, label: "โปรไฟล์", path: "/profile" },
  { icon: Settings, label: "ตั้งค่า", path: "/settings" },
];

export function DesktopSidebar() {
  const location = useLocation();

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
              <Icon className={cn("h-6 w-6", isActive && "text-primary")} />
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
        <button className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}
