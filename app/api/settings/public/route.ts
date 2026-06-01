import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const settings = await query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('company_name', 'company_logo')`,
    )

    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.setting_key] = setting.setting_value
      return acc
    }, {})

    // Valores por defecto si no existen en la base de datos
    return NextResponse.json({
      company_name: settingsObject.company_name || "FDX GLOBAL",
      company_logo: settingsObject.company_logo || null,
    })
  } catch (error) {
    console.error("Error al obtener configuración pública:", error)
    // Retornar valores por defecto en caso de error
    return NextResponse.json({
      company_name: "FDX GLOBAL",
      company_logo: null,
    })
  }
}
