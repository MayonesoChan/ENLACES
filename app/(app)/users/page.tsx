import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { UsersManagementClient } from "@/components/users-management-client"

export default async function UsersPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return <UsersManagementClient user={session.user} />
}
