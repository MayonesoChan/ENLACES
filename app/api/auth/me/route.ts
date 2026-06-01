import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession } from "@/lib/db"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ user: null })
    }

    const session = await getSession(sessionCookie.value)

    if (!session) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: session.user_id,
        email: session.email,
        role: session.role,
        name: session.name,
      },
    })
  } catch (error) {
    console.error("[log] Get user error:", error)
    return NextResponse.json({ user: null })
  }
}
