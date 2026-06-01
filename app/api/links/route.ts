import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, createLink } from "@/lib/db"
import { executeQuery } from "@/lib/db"

/**
 * Ruta API POST para crear un nuevo enlace
 * Verifica autenticación y crea notificaciones para otros usuarios
 */
export async function POST(request: Request) {
  try {
    // Verifica que el usuario esté autenticado
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtiene la sesión del usuario
    const session = await getSession(sessionCookie.value)

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { title, description, imageUrl, url, categoryId } = await request.json()

    // Si es admin, el enlace se crea con created_by = NULL (visible para todos)
    // Si es usuario regular, el enlace se crea con su ID (visible solo para él + admin)
    const createdBy = session.role === "admin" ? null : session.user_id

    const link = await createLink({
      title,
      description,
      imageUrl,
      url,
      createdBy,
      categoryId,
    })

    try {
      const allUsers = (await executeQuery("SELECT id FROM users", [])) as any[]

      // Crea una notificación para cada usuario
      for (const user of allUsers) {
        const message =
          user.id === session.user_id ? `Has agregado el enlace: ${title}` : `Nuevo enlace agregado: ${title}`

        await executeQuery("INSERT INTO notifications (user_id, link_id, message) VALUES (?, ?, ?)", [
          user.id,
          link.id,
          message,
        ])
      }
    } catch (notifError: any) {
      if (notifError?.errno === 1146) {
        // Table doesn't exist, skip silently
      }
    }

    return NextResponse.json(link)
  } catch (error) {
    return NextResponse.json({ error: "Error al crear el enlace" }, { status: 500 })
  }
}
