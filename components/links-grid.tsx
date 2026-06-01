"use client"

import type React from "react"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface Link {
  id: number
  title: string
  description: string
  image_url: string
  url: string
  created_by: number
}

interface User {
  id: number
  role: string
}

interface LinksGridProps {
  links: Link[]
  user: User
  onLinkDeleted?: () => void
  onLinkEdit?: (link: Link) => void
}

export function LinksGrid({ links, user, onLinkDeleted, onLinkEdit }: LinksGridProps) {
  const [linkToDelete, setLinkToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleLinkClick = (url: string, e: React.MouseEvent) => {
    // Evitar que el click se propague si se hace en un botón
    if ((e.target as HTMLElement).closest("button")) {
      return
    }
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const canEditLink = (link: Link) => {
    console.log(
      "[log] Checking permissions - user.id:",
      user.id,
      "user.role:",
      user.role,
      "link.created_by:",
      link.created_by,
      "types:",
      typeof user.id,
      typeof link.created_by,
    )
    const canEdit = user.role === "admin" || Number(link.created_by) === Number(user.id)
    console.log("[log] Can edit:", canEdit)
    return canEdit
  }

  const handleDeleteLink = async () => {
    if (!linkToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/links/${linkToDelete}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "No se pudo eliminar el enlace",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Enlace eliminado",
        description: "El enlace se ha eliminado correctamente",
      })

      onLinkDeleted?.()
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el enlace",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setLinkToDelete(null)
    }
  }

  if (links.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">No hay enlaces disponibles</div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {links.map((link) => (
          <Card
            key={link.id}
            className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-card border-border overflow-hidden relative"
            onClick={(e) => handleLinkClick(link.url, e)}
          >
            {canEditLink(link) && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-card/90 hover:bg-card shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLinkEdit?.(link)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-card/90 hover:bg-card shadow-sm hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLinkToDelete(link.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 relative flex items-center justify-center bg-muted rounded-xl group-hover:bg-muted/80 transition-colors">
                <Image
                  src={link.image_url || "/placeholder.svg"}
                  alt={link.title}
                  width={48}
                  height={48}
                  className="object-contain"
                  unoptimized={link.image_url?.startsWith("data:")}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = "/placeholder.svg?height=48&width=48"
                  }}
                />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{link.title}</h3>
                  {!link.created_by && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                </div>
              </div>

              {link.description && <p className="text-sm text-muted-foreground line-clamp-2">{link.description}</p>}
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={linkToDelete !== null} onOpenChange={() => setLinkToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El enlace será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLink} disabled={isDeleting}>
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
