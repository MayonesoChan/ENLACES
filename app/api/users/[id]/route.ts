import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const resolvedParams = await params

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const body = await request.json()
    const userId = Number.parseInt(resolvedParams.id)

    if (!body.email || !body.role || (!body.name && !body.apellido_paterno)) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos requeridos faltantes (email, role y nombre completo)",
        },
        { status: 400 },
      )
    }

    // Verificar si el email ya existe para otro usuario
    const existingUser = (await executeQuery("SELECT id FROM users WHERE email = ? AND id != ?", [
      body.email,
      userId,
    ])) as any[]

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "El correo ya está registrado" }, { status: 400 })
    }

    const nameParts = [body.name?.trim(), body.apellido_paterno?.trim(), body.apellido_materno?.trim()].filter(Boolean)

    const fullName = nameParts.join(" ")

    await executeQuery("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", [
      fullName,
      body.email,
      body.role,
      userId,
    ])

    const result = (await executeQuery("SELECT id, email, name, role, created_at FROM users WHERE id = ?", [
      userId,
    ])) as any[]

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    const userWithSeparatedName = {
      ...result[0],
      nombre: nameParts[0] || "",
      apellido_paterno: nameParts[1] || "",
      apellido_materno: nameParts.slice(2).join(" ") || "",
      status: "Activo",
      last_login: null,
      updated_at: result[0].created_at,
    }

    return NextResponse.json({ success: true, user: userWithSeparatedName })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al actualizar usuario" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const resolvedParams = await params

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const userId = Number.parseInt(resolvedParams.id)

    // Prevent deleting own account
    if (session.user.id === userId) {
      return NextResponse.json({ success: false, error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
    }

    const checkUser = (await executeQuery("SELECT id FROM users WHERE id = ?", [userId])) as any[]

    if (checkUser.length === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    await executeQuery("DELETE FROM users WHERE id = ?", [userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al eliminar usuario" }, { status: 500 })
  }
}
