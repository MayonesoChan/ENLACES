import mysql from "mysql2/promise"
import crypto from "crypto"
import { initializeDatabase } from "./db-init" // Importar el script de inicialización

/**
 * Creates and exports a MySQL connection pool
 * The pool manages multiple database connections for better performance
 */
let pool: mysql.Pool | null = null
let isInitializing = false // Evitar múltiples llamadas simultáneas

export function getPool() {
  if (!pool) {
    const connectionUri = process.env.MYSQL_URL || process.env.DATABASE_URL

    if (connectionUri) {
      pool = mysql.createPool(connectionUri)
    } else {
      pool = mysql.createPool({
        host: process.env.MYSQLHOST || process.env.MYSQL_HOST || "127.0.0.1",
        port: Number.parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || "3306"),
        user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
        password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
        database: process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || "sistemaEnlaces",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
      })
    }

    if (!isInitializing) {
      isInitializing = true
      initializeDatabase(pool)
        .catch((err) => console.error("[log] Error en la inicialización asíncrona:", err))
        .finally(() => {
          isInitializing = false
        })
    }
  }
  return pool
}

/**
 * Obtiene un usuario por su correo electrónico
 * @param email - Correo electrónico del usuario
 * @returns Promise con el usuario o null si no existe
 */
export async function getUser(email: string) {
  const pool = getPool()
  const [rows] = await pool.execute(
    "SELECT id, email, password_hash, role, name, activo, created_at FROM users WHERE email = ?",
    [email],
  )
  const users = rows as any[]
  return users[0] || null
}

/**
 * Obtiene un usuario por su ID
 * @param id - ID del usuario
 * @returns Promise con el usuario o null si no existe
 */
export async function getUserById(id: number) {
  const pool = getPool()
  const [rows] = await pool.execute("SELECT id, email, role, name, created_at FROM users WHERE id = ?", [id])
  const users = rows as any[]
  return users[0] || null
}

/**
 * Crea una nueva sesión para un usuario
 * @param userId - ID del usuario para quien crear la sesión
 * @returns Promise con el ID de sesión y fecha de expiración
 */
export async function createSession(userId: number) {
  const pool = getPool()
  // Genera un ID único para la sesión
  const sessionId = crypto.randomUUID()
  // La sesión expira en 7 días
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  // Inserta la sesión en la base de datos
  await pool.execute("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [sessionId, userId, expiresAt])

  return { id: sessionId, expiresAt }
}

/**
 * Obtiene una sesión por su ID
 * @param sessionId - ID de la sesión
 * @returns Promise con la sesión y datos del usuario o null si no existe/expiró
 */
export async function getSession(sessionId: string) {
  const pool = getPool()
  const [rows] = await pool.execute(
    `SELECT s.id, s.user_id, s.expires_at, u.email, u.role, u.name
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ? AND s.expires_at > NOW()`,
    [sessionId],
  )
  const sessions = rows as any[]
  return sessions[0] || null
}

/**
 * Elimina una sesión (cierre de sesión)
 * @param sessionId - ID de la sesión a eliminar
 * @returns Promise que se resuelve cuando se elimina
 */
export async function deleteSession(sessionId: string) {
  const pool = getPool()
  await pool.execute("DELETE FROM sessions WHERE id = ?", [sessionId])
}

/**
 * Obtiene todos los enlaces ordenados por fecha de creación
 * Filtra por usuario: usuarios regulares ven sus enlaces + enlaces del admin
 * Admins ven todos los enlaces
 * @param userId - ID del usuario actual
 * @param userRole - Rol del usuario actual (admin o user)
 * @returns Promise con array de enlaces
 */
export async function getAllLinks(userId?: number, userRole?: string) {
  const pool = getPool()
  
  // Si es admin, ver todos los enlaces
  if (userRole === "admin") {
    const [rows] = await pool.execute(
      `SELECT id, title, description, image_url, url, category_id, created_by, created_at, updated_at
       FROM links
       ORDER BY created_at DESC`,
    )
    return rows as any[]
  }
  
  // Si es usuario regular, ver: sus enlaces + enlaces del admin (created_by = NULL)
  if (userId && userRole === "user") {
    const [rows] = await pool.execute(
      `SELECT id, title, description, image_url, url, category_id, created_by, created_at, updated_at
       FROM links
       WHERE created_by = ? OR created_by IS NULL
       ORDER BY created_at DESC`,
      [userId],
    )
    return rows as any[]
  }
  
  // Fallback: retornar todos (por compatibilidad)
  const [rows] = await pool.execute(
    `SELECT id, title, description, image_url, url, category_id, created_by, created_at, updated_at
     FROM links
     ORDER BY created_at DESC`,
  )
  return rows as any[]
}

/**
 * Crea un nuevo enlace en la base de datos
 * @param data - Datos del enlace a crear
 * @returns Promise con el enlace creado
 */
export async function createLink(data: {
  title: string
  description: string
  imageUrl: string
  url: string
  createdBy: number | null
  categoryId?: number
}) {
  const pool = getPool()
  const [result] = await pool.execute(
    "INSERT INTO links (title, description, image_url, url, created_by, category_id) VALUES (?, ?, ?, ?, ?, ?)",
    [data.title, data.description, data.imageUrl, data.url, data.createdBy, data.categoryId || null],
  )
  const insertResult = result as mysql.ResultSetHeader

  // Get the created link
  const [rows] = await pool.execute("SELECT * FROM links WHERE id = ?", [insertResult.insertId])
  const links = rows as any[]
  return links[0]
}

/**
 * Actualiza un enlace existente
 * @param id - ID del enlace a actualizar
 * @param data - Nuevos datos del enlace
 * @returns Promise con el enlace actualizado
 */
export async function updateLink(
  id: number,
  data: {
    title: string
    description: string
    imageUrl: string
    url: string
    categoryId?: number
  },
) {
  const pool = getPool()
  await pool.execute(
    `UPDATE links 
     SET title = ?, description = ?, image_url = ?, url = ?, category_id = ?, updated_at = NOW()
     WHERE id = ?`,
    [data.title, data.description, data.imageUrl, data.url, data.categoryId || null, id],
  )

  // Get the updated link
  const [rows] = await pool.execute("SELECT * FROM links WHERE id = ?", [id])
  const links = rows as any[]
  return links[0]
}

/**
 * Elimina un enlace de la base de datos
 * @param id - ID del enlace a eliminar
 * @returns Promise que se resuelve cuando se elimina
 */
export async function deleteLink(id: number) {
  const pool = getPool()
  await pool.execute("DELETE FROM links WHERE id = ?", [id])
}

/**
 * Utility function to execute raw SQL queries
 * Useful for migrations and complex queries
 */
export async function executeQuery(query: string, params: any[] = []) {
  const pool = getPool()
  const [rows] = await pool.execute(query, params)
  return rows
}

export const query = executeQuery
