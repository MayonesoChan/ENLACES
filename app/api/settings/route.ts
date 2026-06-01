import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const settings = await query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('company_name', 'company_logo')`,
    )

    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {})

    return NextResponse.json({
      company_name: settingsObject.company_name || "",
      company_logo: settingsObject.company_logo || "",
    })
  } catch (error) {
    console.error("Error al obtener configuración:", error)
    return NextResponse.json({ error: "Error al obtener configuración" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { company_name, company_logo } = body

    if (company_name !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value, updated_by, updated_at) 
         VALUES ('company_name', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?, updated_at = NOW()`,
        [company_name, session.user.id, company_name, session.user.id],
      )
    }

    if (company_logo !== undefined) {
      await query(
        `INSERT INTO settings (setting_key, setting_value, updated_by, updated_at) 
         VALUES ('company_logo', ?, ?, NOW())
         ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?, updated_at = NOW()`,
        [company_logo, session.user.id, company_logo, session.user.id],
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error al actualizar configuración:", error)
    return NextResponse.json({ error: "Error al actualizar configuración" }, { status: 500 })
  }
}
