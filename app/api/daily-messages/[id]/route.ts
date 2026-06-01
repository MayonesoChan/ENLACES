import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/db"
import { cookies } from "next/headers"

// PUT - Actualizar mensaje (solo administrador)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await getSession(sessionCookie.value)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden editar mensajes" }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 })
    }

    await query("UPDATE daily_messages SET message = ?, is_read = FALSE WHERE id = ?", [message.trim(), id])

    return NextResponse.json({ success: true, message: "Mensaje actualizado exitosamente" })
  } catch (error) {
    console.error("Error updating daily message:", error)
    return NextResponse.json({ error: "Error al actualizar mensaje" }, { status: 500 })
  }
}

// DELETE - Eliminar mensaje (solo administrador)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const session = await getSession(sessionCookie.value)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores pueden eliminar mensajes" }, { status: 403 })
    }

    await query("DELETE FROM daily_messages WHERE id = ?", [id])

    return NextResponse.json({ success: true, message: "Mensaje eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting daily message:", error)
    return NextResponse.json({ error: "Error al eliminar mensaje" }, { status: 500 })
  }
}
