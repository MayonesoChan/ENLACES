import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const session = await getSession()

    console.log("[log] Toggle status - User ID:", resolvedParams.id)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { status } = await request.json()
    const userId = Number.parseInt(resolvedParams.id)

    console.log("[log] Toggle status - New status:", status)

    if (!status || (status !== "Activo" && status !== "Inactivo")) {
      return NextResponse.json({ success: false, error: "Estado inválido" }, { status: 400 })
    }

    const checkUser = (await executeQuery("SELECT id FROM users WHERE id = ?", [userId])) as any[]

    if (checkUser.length === 0) {
      console.log("[log] Toggle status - Usuario no encontrado con ID:", userId)
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    const activoValue = status === "Activo" ? 1 : 0

    console.log("[log] Toggle status - Setting activo to:", activoValue, "for user:", userId)

    try {
      const updateResult = await executeQuery("UPDATE users SET activo = ? WHERE id = ?", [activoValue, userId])
      console.log("[log] Toggle status - Update result:", updateResult)
    } catch (updateError) {
      console.error("[log] Toggle status - Update error:", updateError)
      return NextResponse.json(
        {
          success: false,
          error: "Error al actualizar usuario. Verifica que la columna 'activo' existe en la tabla.",
        },
        { status: 500 },
      )
    }

    const result = (await executeQuery(
      "SELECT id, email, name, apellido_paterno, apellido_materno, role, activo, created_at FROM users WHERE id = ?",
      [userId],
    )) as any[]

    console.log("[log] Toggle status - User after update:", result[0])

    return NextResponse.json({
      success: true,
      user: {
        ...result[0],
        status: result[0].activo ? "Activo" : "Inactivo",
      },
    })
  } catch (error) {
    console.error("[log] Error updating user status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error al actualizar estado",
      },
      { status: 500 },
    )
  }
}
