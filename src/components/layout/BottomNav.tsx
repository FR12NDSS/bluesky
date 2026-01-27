import { Home, Search, Bell, User, PenSquare } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "หน้าแรก", path: "/" },
  { icon: Search, label: "ค้นหา", path: "/search" },
  { icon: PenSquare, label: "โพสต์", path: "/compose", isAction: true },
  { icon: Bell, label: "แจ้งเตือน", path: "/notifications" },
  { icon: User, label: "โปรไฟล์", path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Icon className="h-6 w-6" />
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "fill-current")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
