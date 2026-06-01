import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { executeQuery } from "@/lib/db"

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano a hashear
 * @returns Promise con el hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  // Genera un hash con 10 rondas de salt
  return bcrypt.hash(password, 10)
}

/**
 * Verifica si una contraseña coincide con un hash
 * @param password - Contraseña en texto plano a verificar
 * @param hash - Hash almacenado en la base de datos
 * @returns Promise con true si coincide, false si no
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  console.log("[log] Verifying password...")
  console.log("[log] Password to verify:", password)
  console.log("[log] Hash to compare against:", hash)
  console.log("[log] Password length:", password?.length)
  console.log("[log] Hash length:", hash?.length)

  // Compara la contraseña con el hash usando bcrypt
  const result = await bcrypt.compare(password, hash)
  console.log("[log] bcrypt.compare result:", result)

  const testHash = await bcrypt.hash(password, 10)
  console.log("[log] Test hash generated from password:", testHash)

  return result
}

/**
 * Obtiene la sesión actual del usuario desde las cookies
 * Verifica que la sesión no haya expirado
 * @returns Promise con la información de la sesión o null si no existe/expiró
 */
export async function getSession() {
  // Obtiene el store de cookies
  const cookieStore = await cookies()
  const sessionId = cookieStore.get("session")?.value

  // Si no hay sesión en las cookies, retorna null
  if (!sessionId) {
    return null
  }

  try {
    const sessions = (await executeQuery(
      `SELECT s.id, s.user_id, s.expires_at, u.id as user_id, u.email, u.name, u.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ? AND s.expires_at > NOW()`,
      [sessionId],
    )) as any[]

    // Si no se encuentra la sesión o está expirada, retorna null
    if (sessions.length === 0) {
      return null
    }

    const session = sessions[0]

    // Retorna la información del usuario y la sesión
    return {
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        role: session.role,
      },
      sessionId: session.id,
      expiresAt: session.expires_at,
    }
  } catch (error) {
    console.error("Error obteniendo sesión:", error)
    return null
  }
}
