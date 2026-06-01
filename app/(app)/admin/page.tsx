import { cookies } from "next/headers"
import { getSession, getAllLinks } from "@/lib/db"
import { redirect } from "next/navigation"
import { AdminLinksTable } from "@/components/admin-links-table"
import { AddLinkButton } from "@/components/add-link-button"

export default async function AdminPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("session")

  if (!sessionCookie) {
    redirect("/login")
  }

  const session = await getSession(sessionCookie.value)

  if (!session || session.role !== "admin") {
    redirect("/dashboard")
  }

  const links = await getAllLinks()

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Administrar Enlaces</h1>
        <AddLinkButton />
      </div>

      <AdminLinksTable links={links} />
    </div>
  )
}
