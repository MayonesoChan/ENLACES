import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { executeQuery } from "@/lib/db"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    try {
      const tableCheck = (await executeQuery(
        `SELECT COUNT(*) as count 
         FROM information_schema.tables 
         WHERE table_schema = DATABASE() 
         AND table_name = 'notifications'`,
      )) as any[]

      if (tableCheck[0].count === 0) {
        return NextResponse.json([])
      }
    } catch (checkError) {
      return NextResponse.json([])
    }

    try {
      const notifications = (await executeQuery(
        `SELECT 
          n.id,
          n.message,
          n.is_read,
          n.created_at,
          n.link_id,
          n.category_id,
          l.title as link_title,
          l.url as link_url,
          c.name as category_name,
          c.icon as category_icon,
          u.name as creator_name
        FROM notifications n
        LEFT JOIN links l ON n.link_id = l.id
        LEFT JOIN categories c ON n.category_id = c.id
        LEFT JOIN users u ON COALESCE(l.created_by, c.created_by) = u.id
        WHERE n.user_id = ?
        ORDER BY n.created_at DESC
        LIMIT 20`,
        [userId],
      )) as any[]

      return NextResponse.json(notifications)
    } catch (dbError: any) {
      return NextResponse.json([])
    }
  } catch (error) {
    return NextResponse.json([])
  }
}

export async function PATCH() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userId = session.user.id

    try {
      await executeQuery("UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false", [userId])

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      if (dbError?.errno === 1146) {
        return NextResponse.json({ success: true })
      }
      throw dbError
    }
  } catch (error) {
    return NextResponse.json({ error: "Error al marcar todas como leídas" }, { status: 500 })
  }
}
