import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { password } = await request.json()
    const { id } = await params
    const userId = Number.parseInt(id)

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 },
      )
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 10)

    const checkUser = (await executeQuery("SELECT id FROM users WHERE id = ?", [userId])) as any[]

    if (checkUser.length === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    await executeQuery("UPDATE users SET password_hash = ? WHERE id = ?", [password_hash, userId])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[log] Error resetting password:", error)
    return NextResponse.json({ success: false, error: "Error al restablecer contraseña" }, { status: 500 })
  }
}
