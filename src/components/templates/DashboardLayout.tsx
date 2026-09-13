import type { ReactNode } from "react";
import { Sidebar } from "@/components/organisms/Sidebar";
import { Header } from "@/components/organisms/Header";
import { RouteGuard } from "@/components/organisms/RouteGuard";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { RBACProvider } from "@/hooks/use-rbac";
import { RoleAssignmentsProvider } from "@/hooks/use-role-assignments";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <RBACProvider>
        <RoleAssignmentsProvider>
          {/* h-screen + overflow-hidden pins the sidebar and header in place;
              only <main> scrolls, so they never move with page content. */}
          <div className="flex h-screen overflow-hidden bg-surface">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                <RouteGuard>{children}</RouteGuard>
              </main>
            </div>
          </div>
        </RoleAssignmentsProvider>
      </RBACProvider>
    </SidebarProvider>
  );
}
