import { ReactNode } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { RightSidebar } from "./RightSidebar";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
}

export function MainLayout({ children, showRightSidebar = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
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
