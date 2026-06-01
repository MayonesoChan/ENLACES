"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SettingsClient() {
  const [companyName, setCompanyName] = useState("")
  const [companyLogo, setCompanyLogo] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.company_name || "")
        setCompanyLogo(data.company_logo || "")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive",
      })
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setCompanyLogo(result)
    }
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Error al leer el archivo",
        variant: "destructive",
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la empresa es requerido",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: companyName.trim(),
          company_logo: companyLogo,
        }),
      })

      if (response.ok) {
        toast({
          title: "Guardado exitoso",
          description: "La configuración se ha actualizado correctamente",
        })
        await loadSettings()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error al guardar")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar la configuración",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="p-6">Cargando...</div>
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración</h1>
        <p className="text-muted-foreground">Configura las opciones del sistema</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Logo de la Empresa</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                  {companyLogo ? (
                    <img
                      src={companyLogo || "/placeholder.svg"}
                      alt="Logo"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <div className="text-gray-400 text-xs text-center p-2">Sin logo</div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input type="file" accept="image/*" className="hidden" id="logo-upload" onChange={handleLogoChange} />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("logo-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Logo
                  </Button>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF hasta 5MB</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Nombre de la Empresa</label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ej: Mi Empresa"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
