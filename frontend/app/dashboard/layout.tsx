import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { MobileSidebar } from "@/components/mobile-sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Desktop Sidebar */}
        <DashboardSidebar />

        {/* Mobile Sidebar */}
        <MobileSidebar />

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container  mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
