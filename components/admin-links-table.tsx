"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { EditLinkDialog } from "@/components/edit-link-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Link {
  id: number
  title: string
  description: string
  image_url: string
  url: string
}

interface AdminLinksTableProps {
  links: Link[]
}

export function AdminLinksTable({ links }: AdminLinksTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLinkToDelete, setSelectedLinkToDelete] = useState<Link | null>(null)

  const handleDelete = async () => {
    if (!selectedLinkToDelete) return

    setDeletingId(selectedLinkToDelete.id)
    try {
      const res = await fetch(`/api/links/${selectedLinkToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Enlace eliminado",
          description: "El enlace ha sido eliminado exitosamente",
        })
        setShowDeleteDialog(false)
        setSelectedLinkToDelete(null)
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error al eliminar",
          description: "No se pudo eliminar el enlace",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (links.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-muted-foreground text-lg">No hay enlaces disponibles</div>
      </Card>
    )
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Imagen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((link) => (
                <tr key={link.id} className="hover:bg-muted/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-10 h-10 relative flex items-center justify-center bg-muted rounded">
                      <Image
                        src={link.image_url || "/placeholder.svg"}
                        alt={link.title}
                        width={32}
                        height={32}
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = "/generic-icon.png"
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{link.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-muted-foreground max-w-md truncate">{link.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline max-w-xs truncate block"
                    >
                      {link.url}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setEditingLink(link)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedLinkToDelete(link)
                        setShowDeleteDialog(true)
                      }}
                      disabled={deletingId === link.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === link.id ? "Eliminando..." : "Eliminar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {editingLink && <EditLinkDialog link={editingLink} onClose={() => setEditingLink(null)} />}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro de que desea eliminar el enlace <strong>{selectedLinkToDelete?.title}</strong>? Esta acción
              no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedLinkToDelete(null)
              }}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deletingId !== null}>
              {deletingId !== null ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
