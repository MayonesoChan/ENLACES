import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await getSession(sessionCookie.value)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { id } = await params

    try {
      await executeQuery("UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?", [
        Number.parseInt(id),
        session.user_id,
      ])

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      if (dbError?.errno === 1146) {
        return NextResponse.json({ success: true })
      }
      throw dbError
    }
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ error: "Error al marcar como leída" }, { status: 500 })
  }
}
