import type React from "react"
import { cookies } from "next/headers"
import { getSession } from "@/lib/db"
import { redirect } from "next/navigation"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { UserMenu } from "@/components/user-menu"
import { Suspense } from "react"
import { NotificationsPopover } from "@/components/notifications-popover"
import { SearchProvider } from "@/components/search-context"
import { DailyMessagesPopover } from "@/components/daily-messages-popover"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    redirect("/login")
  }

  const session = await getSession(sessionCookie.value)

  if (!session) {
    redirect("/login")
  }

  return (
    <SearchProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar userRole={session.role} />
          <div className="flex-1 flex flex-col">
            <Suspense fallback={<div>Loading...</div>}>
              <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-card px-6">
                <SidebarTrigger className="-ml-2" />

                <div className="flex-1" />

                <DailyMessagesPopover userRole={session.role} />
                <NotificationsPopover />
                <UserMenu userName={session.name} userEmail={session.email} userRole={session.role} />
              </header>
            </Suspense>
            <main className="flex-1 bg-muted/30">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </SearchProvider>
  )
}
