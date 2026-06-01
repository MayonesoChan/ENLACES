import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getSession, updateLink, deleteLink } from "@/lib/db"
import { executeQuery } from "@/lib/db"

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

    const linkResult = (await executeQuery("SELECT created_by FROM links WHERE id = ?", [Number.parseInt(id)])) as any[]

    if (!linkResult || linkResult.length === 0) {
      return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 })
    }

    const link = linkResult[0]

    // Si no es admin, solo puede editar sus propios enlaces
    if (session.role !== "admin" && link.created_by !== session.user_id) {
      return NextResponse.json(
        {
          error: "No tienes permisos para editar este enlace",
        },
        { status: 403 },
      )
    }

    const { title, description, imageUrl, url, categoryId } = await request.json()

    const updatedLink = await updateLink(Number.parseInt(id), {
      title,
      description,
      imageUrl,
      url,
      categoryId,
    })

    return NextResponse.json(updatedLink)
  } catch (error) {
    console.error("[log] Update link error:", error)
    return NextResponse.json({ error: "Error al actualizar el enlace" }, { status: 500 })
  }
}

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

    const linkResult = (await executeQuery("SELECT created_by FROM links WHERE id = ?", [Number.parseInt(id)])) as any[]

    if (!linkResult || linkResult.length === 0) {
      return NextResponse.json({ error: "Enlace no encontrado" }, { status: 404 })
    }

    const link = linkResult[0]

    // Si no es admin, solo puede eliminar sus propios enlaces
    if (session.role !== "admin" && link.created_by !== session.user_id) {
      return NextResponse.json(
        {
          error: "No tienes permisos para eliminar este enlace",
        },
        { status: 403 },
      )
    }

    await deleteLink(Number.parseInt(id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[log] Delete link error:", error)
    return NextResponse.json({ error: "Error al eliminar el enlace" }, { status: 500 })
  }
}
