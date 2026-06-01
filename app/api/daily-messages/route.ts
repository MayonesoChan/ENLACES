import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/db"
import { cookies } from "next/headers"

// GET - Obtener todos los mensajes del día
export async function GET() {
  try {
    const messages = await query(
      `SELECT dm.*, u.name as creator_name, dm.is_read 
       FROM daily_messages dm
       LEFT JOIN users u ON dm.created_by = u.id
       ORDER BY dm.created_at DESC`,
    )
    return NextResponse.json(messages)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener mensajes" }, { status: 500 })
  }
}

// POST - Crear nuevo mensaje (solo administrador)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await getSession(sessionCookie.value)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden crear mensajes" }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 })
    }

    const result = await query("INSERT INTO daily_messages (message, created_by) VALUES (?, ?)", [
      message.trim(),
      session.user_id,
    ])

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: "Mensaje creado exitosamente",
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear mensaje" }, { status: 500 })
  }
}

// PATCH - Marcar todos los mensajes como leídos (solo administrador)
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await getSession(sessionCookie.value)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden marcar mensajes como leídos" }, { status: 403 })
    }

    await query("UPDATE daily_messages SET is_read = TRUE WHERE is_read = FALSE")

    return NextResponse.json({ success: true, message: "Todos los mensajes marcados como leídos" })
  } catch (error) {
    return NextResponse.json({ error: "Error al marcar mensajes como leídos" }, { status: 500 })
  }
}
