import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { deleteSession } from "@/lib/db"

export async function POST() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get("session")

    if (session) {
      await deleteSession(session.value)
      cookieStore.delete("session")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[log] Logout error:", error)
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
  }
}
