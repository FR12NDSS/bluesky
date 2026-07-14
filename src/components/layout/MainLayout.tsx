import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";
import { DesktopSidebar } from "./DesktopSidebar";
import { RightSidebar } from "./RightSidebar";
import { BottomNav } from "./BottomNav";
import { MobileMenu } from "./MobileMenu";

interface MainLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
}

export function MainLayout({ children, showRightSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar with slide-out menu trigger */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur md:hidden">
        <MobileMenu />
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">ท้องฟ้า</span>
        </Link>
        <div className="w-10" />
      </header>

      <div className="mx-auto flex max-w-7xl">
        {/* Left Sidebar - Desktop */}
        <DesktopSidebar />

        {/* Main Content */}
        <main className="min-h-screen flex-1 border-x border-border pb-20 md:pb-0">
          {children}
        </main>

        {/* Right Sidebar - Desktop */}
        {showRightSidebar && <RightSidebar />}
      </div>

      {/* Bottom Navigation - Mobile */}
      <BottomNav />
    </div>
  );
}
