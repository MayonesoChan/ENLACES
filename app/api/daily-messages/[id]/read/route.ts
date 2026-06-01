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
      // We create a read_by entry for this user-message combination
      await executeQuery(
        `INSERT IGNORE INTO daily_message_reads (message_id, user_id, read_at)
         VALUES (?, ?, NOW())`,
        [Number.parseInt(id), session.user_id],
      )

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      if (dbError?.errno === 1146) {
        // Table doesn't exist yet - this is okay for backward compatibility
        return NextResponse.json({ success: true })
      }
      throw dbError
    }
  } catch (error) {
    console.error("[log] Error marking daily message as read:", error)
    return NextResponse.json({ error: "Error al marcar como leída" }, { status: 500 })
  }
}
