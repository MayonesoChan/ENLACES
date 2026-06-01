import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const users = (await executeQuery(
      `SELECT id, email, name, apellido_paterno, apellido_materno, role, activo, created_at
       FROM users
       ORDER BY created_at DESC`,
    )) as any[]

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: user.activo ? "Activo" : "Inactivo",
      last_login: null,
      updated_at: user.created_at,
    }))

    return NextResponse.json({ success: true, users: usersWithStatus })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 })
    }

    const { name, apellido_paterno, apellido_materno, email, password, role } = await request.json()

    if (!name || !apellido_paterno || !apellido_materno || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "Campos requeridos faltantes" }, { status: 400 })
    }

    const existingUser = (await executeQuery("SELECT id FROM users WHERE email = ?", [email])) as any[]

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, error: "El correo ya está registrado" }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(password, 10)

    const fullName = `${name} ${apellido_paterno} ${apellido_materno}`.trim()

    await executeQuery("INSERT INTO users (email, password_hash, name, role, activo) VALUES (?, ?, ?, ?, TRUE)", [
      email,
      password_hash,
      fullName,
      role,
    ])

    const result = (await executeQuery("SELECT id, email, name, role, activo, created_at FROM users WHERE email = ?", [
      email,
    ])) as any[]

    const nameParts = result[0].name.split(" ")
    const userWithDefaults = {
      ...result[0],
      apellido_paterno: nameParts[1] || "",
      apellido_materno: nameParts[2] || "",
      status: result[0].activo ? "Activo" : "Inactivo",
      last_login: null,
      updated_at: result[0].created_at,
    }

    return NextResponse.json({ success: true, user: userWithDefaults })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error al crear usuario" }, { status: 500 })
  }
}

