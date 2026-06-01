import { NextResponse } from "next/server"
import { getUser, createSession } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"
import { cookies } from "next/headers"

/**
 * Ruta API POST para iniciar sesión
 * Verifica las credenciales del usuario y crea una sesión
 */
export async function POST(request: Request) {
  try {
    // Extrae el email y contraseña del cuerpo de la solicitud
    const { email, password } = await request.json()

    let user
    try {
      // Busca el usuario en la base de datos por email
      user = await getUser(email)
    } catch (dbError) {
      if (dbError instanceof Error) {
        if (dbError.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            { error: "No se puede conectar a la base de datos. Verifica que MySQL esté corriendo en XAMPP." },
            { status: 503 },
          )
        }
        if (dbError.message.includes("Access denied")) {
          return NextResponse.json(
            { error: "Error de autenticación con la base de datos. Verifica las credenciales de MySQL." },
            { status: 503 },
          )
        }
        if (dbError.message.includes("Unknown database")) {
          return NextResponse.json(
            { error: "La base de datos 'sistemaEnlaces' no existe. Créala en phpMyAdmin." },
            { status: 503 },
          )
        }
      }
      return NextResponse.json({ error: "Error de conexión con la base de datos." }, { status: 503 })
    }

    if (!user) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verifica que la contraseña sea correcta comparando con el hash
    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    if (!user.activo) {
      return NextResponse.json(
        { error: "Tu cuenta ha sido deshabilitada. Contacta al administrador." },
        { status: 403 },
      )
    }

    // Crea una nueva sesión para el usuario
    const session = await createSession(user.id)

    // Establece la cookie de sesión en el navegador
    const cookieStore = await cookies()
    cookieStore.set("session", session.id, {
      httpOnly: true, // No accesible desde JavaScript del cliente (seguridad)
      secure: process.env.NODE_ENV === "production", // Solo HTTPS en producción
      sameSite: "lax", // Protección CSRF
      expires: session.expiresAt, // Cookie expira con la sesión
    })

    // Retorna los datos del usuario (sin la contraseña)
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al iniciar sesión" }, { status: 500 })
  }
}
