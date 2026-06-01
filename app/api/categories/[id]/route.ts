import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, executeQuery } from "@/lib/db"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const categories = (await executeQuery("SELECT id, created_by FROM categories WHERE id = ?", [id])) as any[]

    if (categories.length === 0) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    const category = categories[0]

    if (category.created_by !== session.user_id && session.role !== "admin") {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta categoría" }, { status: 403 })
    }

    await executeQuery("DELETE FROM categories WHERE id = ?", [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al eliminar categoría:", error)
    return NextResponse.json({ error: "Error al eliminar la categoría" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { name, description, icon } = await request.json()

    const categories = (await executeQuery("SELECT id, created_by FROM categories WHERE id = ?", [id])) as any[]

    if (categories.length === 0) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 })
    }

    const category = categories[0]

    if (category.created_by !== session.user_id && session.role !== "admin") {
      return NextResponse.json({ error: "No tienes permiso para editar esta categoría" }, { status: 403 })
    }

    await executeQuery("UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?", [
      name,
      description || null,
      icon || null,
      id,
    ])

    const updatedCategories = (await executeQuery("SELECT * FROM categories WHERE id = ?", [id])) as any[]

    return NextResponse.json({ success: true, category: updatedCategories[0] })
  } catch (error) {
    console.error("Error al actualizar categoría:", error)
    return NextResponse.json({ error: "Error al actualizar la categoría" }, { status: 500 })
  }
}
