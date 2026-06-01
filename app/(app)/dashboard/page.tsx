import { cookies } from "next/headers"
import { getSession, getAllLinks, executeQuery } from "@/lib/db"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard-client"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    redirect("/login")
  }

  const session = await getSession(sessionCookie.value)

  if (!session) {
    redirect("/login")
  }

  const links = await getAllLinks(session.user_id, session.role)
  const categories = (await executeQuery(
    "SELECT id, name, description, icon FROM categories ORDER BY name ASC",
  )) as any[]

  return (
    <DashboardClient
      links={links}
      categories={categories}
      userRole={session.role}
      userName={session.name}
      userId={session.user_id}
    />
  )
}
