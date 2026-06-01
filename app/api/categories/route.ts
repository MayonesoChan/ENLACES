import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, executeQuery } from "@/lib/db"

/**
 * Ruta API GET para obtener todas las categorías
 */
export async function GET() {
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

    const categories = await executeQuery(
      `SELECT id, name, description, icon, created_by, created_at 
       FROM categories 
       ORDER BY name ASC`,
    )

    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener las categorías" }, { status: 500 })
  }
}

/**
 * Ruta API POST para crear una nueva categoría
 */
export async function POST(request: Request) {
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

    const { name, description, icon } = await request.json()

    const result = (await executeQuery(
      "INSERT INTO categories (name, description, icon, created_by) VALUES (?, ?, ?, ?)",
      [name, description || null, icon || null, session.user_id],
    )) as any

    const newCategory = {
      id: result.insertId,
      name,
      description,
      icon,
      created_by: session.user_id,
    }

    try {
      const allUsers = (await executeQuery("SELECT id FROM users", [])) as any[]

      for (const user of allUsers) {
        const message =
          user.id === session.user_id ? `Has creado la categoría: ${name}` : `Nueva categoría creada: ${name}`

        await executeQuery("INSERT INTO notifications (user_id, category_id, message) VALUES (?, ?, ?)", [
          user.id,
          newCategory.id,
          message,
        ])
      }
    } catch (notifError: any) {
      if (notifError?.errno === 1146 || notifError?.errno === 1054) {
        // Table doesn't exist, skip silently
      }
    }

    return NextResponse.json(newCategory)
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la categoría" }, { status: 500 })
  }
}
