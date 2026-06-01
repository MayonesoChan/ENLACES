"use client"

import { useState, useEffect } from "react"
import { LinksGrid } from "@/components/links-grid"
import { AddLinkDialog } from "@/components/add-link-dialog"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Pencil } from "lucide-react"
import { useSearch } from "@/components/search-context"
import { useToast } from "@/hooks/use-toast"
import { SearchInput } from "@/components/search-input"

interface Category {
  id: number
  name: string
  description?: string
  icon?: string
  created_by: number
}

interface Link {
  id: number
  title: string
  description: string
  image_url: string
  url: string
  category_id?: number
  created_by: number
}

interface DashboardClientProps {
  links: Link[]
  categories: Category[]
  userRole: string
  userName: string
  userId: number
}

export function DashboardClient({ links, categories, userRole, userName, userId }: DashboardClientProps) {
  const [showAddLinkDialog, setShowAddLinkDialog] = useState(false)
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingLink, setEditingLink] = useState<Link | null>(null)
  const [selectedCategoryForLink, setSelectedCategoryForLink] = useState<number | undefined>()
  const { searchQuery } = useSearch()
  const { toast } = useToast()

  useEffect(() => {
    const welcomeUser = sessionStorage.getItem("welcomeUser")
    if (welcomeUser) {
      try {
        const user = JSON.parse(welcomeUser)
        const now = new Date().getHours()
        let greeting = "Buen día"

        if (now >= 12 && now < 18) {
          greeting = "Buenas tardes"
        } else if (now >= 18 || now < 6) {
          greeting = "Buenas noches"
        }

        toast({
          title: `${greeting}, Agente ${userName || user.name || "Usuario"}`,
          description: "Has iniciado sesión correctamente",
          duration: 5000,
        })

        sessionStorage.removeItem("welcomeUser")
      } catch (error) {
        console.error("Error al parsear usuario:", error)
      }
    }
  }, [toast, userName])

  const filteredLinks = links.filter((link) => {
    const query = searchQuery.toLowerCase()
    return (
      link.title.toLowerCase().includes(query) ||
      link.description?.toLowerCase().includes(query) ||
      link.url.toLowerCase().includes(query)
    )
  })

  const linksByCategory = categories.map((category) => ({
    category,
    links: filteredLinks.filter((link) => link.category_id === category.id),
  }))

  const uncategorizedLinks = filteredLinks.filter((link) => !link.category_id)

  const visibleCategories = linksByCategory.filter(({ links }) => links.length > 0)

  const canManageCategory = (category: Category) => {
    return userRole === "admin" || category.created_by === userId
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría? Los enlaces no se eliminarán.")) {
      return
    }

    try {
      const res = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "Éxito",
          description: "Categoría eliminada correctamente",
        })
        window.location.reload()
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Error al eliminar la categoría",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      })
    }
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setShowAddCategoryDialog(true)
  }

  const handleLinkDeleted = () => {
    window.location.reload()
  }

  const handleEditLink = (link: Link) => {
    setEditingLink(link)
    setShowAddLinkDialog(true)
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 max-w-2xl">
        <SearchInput />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Mis aplicaciones</h1>
      </div>

      {searchQuery && filteredLinks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg">No se encontraron enlaces para "{searchQuery}"</div>
        </div>
      )}

      {visibleCategories.map(({ category, links: categoryLinks }) => (
        <div key={category.id} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
                {category.icon ? (
                  <span className="text-xs">{category.icon}</span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-muted" />
                )}
              </div>
              <h2 className="text-base font-medium text-foreground">{category.name}</h2>
              {category.description && <span className="text-sm text-muted-foreground">- {category.description}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategoryForLink(category.id)
                  setShowAddLinkDialog(true)
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar enlace
              </Button>
              {canManageCategory(category) && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(category)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <LinksGrid
            links={categoryLinks}
            user={{ id: userId, role: userRole }}
            onLinkDeleted={handleLinkDeleted}
            onLinkEdit={handleEditLink}
          />
        </div>
      ))}

      {uncategorizedLinks.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-border flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-muted" />
              </div>
              <h2 className="text-base font-medium text-foreground">Sin categoría</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategoryForLink(undefined)
                setShowAddLinkDialog(true)
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Agregar enlace
            </Button>
          </div>
          <LinksGrid
            links={uncategorizedLinks}
            user={{ id: userId, role: userRole }}
            onLinkDeleted={handleLinkDeleted}
            onLinkEdit={handleEditLink}
          />
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" onClick={() => setShowAddCategoryDialog(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Agregar categoría
        </Button>
      </div>

      {showAddLinkDialog && (
        <AddLinkDialog
          onClose={() => {
            setShowAddLinkDialog(false)
            setSelectedCategoryForLink(undefined)
            setEditingLink(null)
          }}
          preselectedCategoryId={selectedCategoryForLink}
          editingLink={editingLink || undefined}
        />
      )}

      {showAddCategoryDialog && (
        <AddCategoryDialog
          onClose={() => {
            setShowAddCategoryDialog(false)
            setEditingCategory(null)
          }}
          editingCategory={editingCategory}
        />
      )}
    </div>
  )
}
