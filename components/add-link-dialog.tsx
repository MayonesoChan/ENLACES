"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload } from "lucide-react"
import Image from "next/image"

interface Link {
  id: number
  title: string
  description: string
  image_url: string
  url: string
  category_id?: number
  created_by: number
}

interface AddLinkDialogProps {
  onClose: () => void
  preselectedCategoryId?: number
  editingLink?: Link
}

interface Category {
  id: number
  name: string
  icon?: string
}

export function AddLinkDialog({ onClose, preselectedCategoryId, editingLink }: AddLinkDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [imagePreview, setImagePreview] = useState<string>("")
  const [uploadMethod, setUploadMethod] = useState<"url" | "upload">("url")
  const [formData, setFormData] = useState({
    title: editingLink?.title || "",
    description: editingLink?.description || "",
    imageUrl: editingLink?.image_url || "",
    url: editingLink?.url || "",
    categoryId: editingLink?.category_id?.toString() || preselectedCategoryId?.toString() || "none",
  })

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) {
          const data = await res.json()
          setCategories(data)
        }
      } catch (error) {
        // Silently fail
      }
    }
    fetchCategories()

    if (editingLink?.image_url) {
      setImagePreview(editingLink.image_url)
    }
  }, [editingLink])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo de imagen válido.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen debe ser menor a 2MB.",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, imageUrl: base64String })
    }
    reader.readAsDataURL(file)
  }

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url })
    setImagePreview(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const method = editingLink ? "PUT" : "POST"
    const url = editingLink ? `/api/links/${editingLink.id}` : "/api/links"
    const action = editingLink ? "actualizado" : "agregado"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          categoryId: formData.categoryId === "none" ? null : Number.parseInt(formData.categoryId),
        }),
      })

      if (res.ok) {
        toast({
          title: "¡Éxito!",
          description: `El enlace "${formData.title}" se ha ${action} correctamente.`,
        })
        router.refresh()
        onClose()
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description:
            data.error || `No se pudo ${editingLink ? "actualizar" : "agregar"} el enlace. Intenta nuevamente.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingLink ? "Editar Enlace" : "Agregar Nuevo Enlace"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="Ej: Gmail"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Breve descripción del enlace"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.icon && `${category.icon} `}
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Imagen del Enlace *</Label>
            <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "url" | "upload")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL de Imagen</TabsTrigger>
                <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-2">
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  required={uploadMethod === "url"}
                  placeholder="https://ejemplo.com/logo.png"
                />
                <p className="text-xs text-slate-500">
                  Usa https://logo.clearbit.com/dominio.com para logos automáticos
                </p>
              </TabsContent>

              <TabsContent value="upload" className="space-y-2">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  <input
                    type="file"
                    id="imageFile"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    required={uploadMethod === "upload" && !formData.imageUrl}
                  />
                  <label htmlFor="imageFile" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-600">Haz clic para subir una imagen</p>
                    <p className="text-xs text-slate-500 mt-1">PNG, JPG, GIF hasta 2MB</p>
                  </label>
                </div>
              </TabsContent>
            </Tabs>

            {imagePreview && (
              <div className="mt-3 p-3 border rounded-lg bg-slate-50">
                <p className="text-xs text-slate-600 mb-2">Vista previa:</p>
                <div className="flex justify-center">
                  <div className="w-16 h-16 relative bg-white rounded-lg p-2">
                    <Image
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      width={48}
                      height={48}
                      className="object-contain"
                      onError={() => setImagePreview("")}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL del Enlace *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              required
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editingLink ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
