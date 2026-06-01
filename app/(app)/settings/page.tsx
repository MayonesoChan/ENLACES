import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings-client"

export default async function SettingsPage() {
  const session = await getSession()

  if (!session || session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return <SettingsClient />
}
