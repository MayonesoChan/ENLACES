"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Filter, Search, RefreshCw, Eye, Edit, Trash2, UserCheck, UserX, AlertCircle, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
  id: number
  email: string
  name: string
  apellido_paterno?: string
  apellido_materno?: string
  role: "admin" | "user"
  status: "Activo" | "Inactivo"
  created_at: string
  last_login?: string
}

interface UsersManagementClientProps {
  user: {
    id: number
    email: string
    role: string
  }
}

export function UsersManagementClient({ user }: UsersManagementClientProps) {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogState, setDialogState] = useState<{
    userForm: boolean
    userDetails: boolean
    deleteDialog: boolean
    resetPassword: boolean
  }>({
    userForm: false,
    userDetails: false,
    deleteDialog: false,
    resetPassword: false,
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")

  // Filter states
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Pagination
  const [usersPerPage, setUsersPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user",
    status: "Activo" as "Activo" | "Inactivo",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al cargar usuarios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[log] Error loading users:", error)
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUser = async () => {
    setFormErrors({})

    if (
      !formData.name ||
      !formData.apellido_paterno ||
      !formData.apellido_materno ||
      !formData.email ||
      !formData.role
    ) {
      setFormErrors({ general: "Por favor complete los campos requeridos" })
      return
    }

    if (!editingUser && !formData.password) {
      setFormErrors({ password: "La contraseña es obligatoria para nuevos usuarios" })
      return
    }

    if (!editingUser && formData.password.length < 6) {
      setFormErrors({ password: "La contraseña debe tener al menos 6 caracteres" })
      return
    }

    try {
      setLoading(true)
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users"
      const method = editingUser ? "PUT" : "POST"

      const payload = {
        name: formData.name,
        apellido_paterno: formData.apellido_paterno,
        apellido_materno: formData.apellido_materno,
        email: formData.email,
        role: formData.role,
        ...(formData.password && { password: formData.password }),
      }

      console.log("[v0] Saving user:", method, url, payload)

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      console.log("[v0] Save user response:", data)

      if (data.success) {
        toast({
          title: "Éxito",
          description: editingUser ? "Usuario actualizado correctamente" : "Usuario creado correctamente",
        })
        setDialogState((prev) => ({ ...prev, userForm: false }))
        setEditingUser(null)
        setFormData({
          name: "",
          apellido_paterno: "",
          apellido_materno: "",
          email: "",
          password: "",
          role: "user",
          status: "Activo",
        })
        await loadUsers()
      } else {
        setFormErrors({ general: data.error || "Error al guardar usuario" })
      }
    } catch (error) {
      console.error("[v0] Error saving user:", error)
      setFormErrors({ general: "Error al guardar usuario" })
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "Activo" ? "Inactivo" : "Activo"

    console.log("[v0] Toggle status - userId:", userId, "current:", currentStatus, "new:", newStatus)

    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      console.log("[v0] Toggle status - Response status:", response.status)
      const data = await response.json()
      console.log("[v0] Toggle status - Response data:", data)

      if (data.success) {
        toast({
          title: "Éxito",
          description: `Usuario marcado como ${newStatus}`,
        })
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al actualizar estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error toggling status:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar estado",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Usuario eliminado correctamente",
        })
        setDialogState((prev) => ({ ...prev, deleteDialog: false }))
        setSelectedUser(null)
        await loadUsers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al eliminar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      toast({
        title: "Error",
        description: "Error al eliminar usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUser) return

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden")
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${selectedUser.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Éxito",
          description: "Contraseña restablecida correctamente",
        })
        setDialogState((prev) => ({ ...prev, resetPassword: false }))
        setSelectedUser(null)
        setNewPassword("")
        setConfirmPassword("")
        setPasswordError("")
      } else {
        setPasswordError(data.error || "Error al restablecer contraseña")
      }
    } catch (error) {
      console.error("[v0] Error resetting password:", error)
      setPasswordError("Error al restablecer contraseña")
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter
    const matchStatus = statusFilter === "all" || u.status === statusFilter
    return matchRole && matchStatus
  })

  // Pagination
  const totalUsers = filteredUsers.length
  const totalPages = Math.ceil(totalUsers / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = Math.min(startIndex + usersPerPage, totalUsers)
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <Button
            onClick={() => {
              setEditingUser(null)
              setFormData({
                name: "",
                apellido_paterno: "",
                apellido_materno: "",
                email: "",
                password: "",
                role: "user",
                status: "Activo",
              })
              setDialogState((prev) => ({ ...prev, userForm: true }))
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRoleFilter("all")
                  setStatusFilter("all")
                }}
              >
                <Search className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Mostrar</span>
                <Select
                  value={usersPerPage.toString()}
                  onValueChange={(value) => {
                    setUsersPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">registros</span>
              </div>
            </div>

            {/* Users Table */}
            {loading && !users.length ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-muted-foreground">Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">Nombre Completo</th>
                      <th className="text-left p-3 font-medium">Correo</th>
                      <th className="text-left p-3 font-medium">Rol</th>
                      <th className="text-left p-3 font-medium">Estado</th>
                      <th className="text-left p-3 font-medium">Fecha Creación</th>
                      <th className="text-left p-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/30">
                        <td className="p-3 text-sm">{u.id}</td>
                        <td className="p-3 text-sm font-medium">
                          {u.name} {u.apellido_paterno} {u.apellido_materno}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{u.email}</td>
                        <td className="p-3 text-sm">
                          <Badge
                            className={`rounded-md px-2 py-1 ${
                              u.role === "admin" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {u.role === "admin" ? "Administrador" : "Usuario"}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Badge
                            className={`rounded-md px-2 py-1 ${
                              u.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {u.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(u.created_at)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u)
                                setDialogState((prev) => ({ ...prev, userDetails: true }))
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const nameParts = u.name.trim().split(/\s+/)
                                const nombre = nameParts[0] || ""
                                const apellido_paterno = nameParts[1] || ""
                                const apellido_materno = nameParts.slice(2).join(" ") || ""

                                setEditingUser(u)
                                setFormData({
                                  name: nombre,
                                  apellido_paterno: apellido_paterno,
                                  apellido_materno: apellido_materno,
                                  email: u.email,
                                  password: "",
                                  role: u.role,
                                  status: u.status,
                                })
                                setDialogState((prev) => ({ ...prev, userForm: true }))
                              }}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={
                                u.status === "Activo"
                                  ? "text-orange-600 hover:text-orange-700"
                                  : "text-green-600 hover:text-green-700"
                              }
                              title={u.status === "Activo" ? "Inhabilitar usuario" : "Habilitar usuario"}
                            >
                              {u.status === "Activo" ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u)
                                setDialogState((prev) => ({ ...prev, deleteDialog: true }))
                              }}
                              className="text-red-600 hover:text-red-700"
                              disabled={u.id === user.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <span className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {endIndex} de {totalUsers} registros
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={pageNum === currentPage ? "bg-blue-600 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Form Dialog */}
        <Dialog
          open={dialogState.userForm}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, userForm: open }))}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    setFormErrors({})
                  }}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
                <Input
                  id="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={(e) => {
                    setFormData({ ...formData, apellido_paterno: e.target.value })
                    setFormErrors({})
                  }}
                  placeholder="Pérez"
                />
              </div>
              <div>
                <Label htmlFor="apellido_materno">Apellido Materno *</Label>
                <Input
                  id="apellido_materno"
                  value={formData.apellido_materno}
                  onChange={(e) => {
                    setFormData({ ...formData, apellido_materno: e.target.value })
                    setFormErrors({})
                  }}
                  placeholder="García"
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value })
                    setFormErrors({})
                  }}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña {editingUser ? "(dejar vacío para mantener)" : "*"}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    setFormErrors({})
                  }}
                  placeholder="********"
                />
                {formErrors.password && <p className="text-sm text-red-600 mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formErrors.general && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formErrors.general}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogState((prev) => ({ ...prev, userForm: false }))}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUser} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingUser ? "Actualizar" : "Crear"} Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog
          open={dialogState.userDetails}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, userDetails: open }))}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">ID</Label>
                  <p className="font-medium">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Nombre Completo</Label>
                  <p className="font-medium">
                    {selectedUser.name} {selectedUser.apellido_paterno} {selectedUser.apellido_materno}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-600">Correo Electrónico</Label>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Rol</Label>
                  <p className="font-medium">{selectedUser.role === "admin" ? "Administrador" : "Usuario"}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Estado</Label>
                  <Badge
                    className={`rounded-md px-2 py-1 ${
                      selectedUser.status === "Activo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedUser.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-gray-600">Fecha de Creación</Label>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogState((prev) => ({ ...prev, userDetails: false }))}>
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  setDialogState((prev) => ({ ...prev, userDetails: false, resetPassword: true }))
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                Cambiar Contraseña
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={dialogState.deleteDialog}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, deleteDialog: open }))}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminación</DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar al usuario <strong>{selectedUser?.name}</strong>? Esta acción no se
                puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogState((prev) => ({ ...prev, deleteDialog: false }))
                  setSelectedUser(null)
                }}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={loading}>
                {loading ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog
          open={dialogState.resetPassword}
          onOpenChange={(open) => setDialogState((prev) => ({ ...prev, resetPassword: open }))}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Restablecer Contraseña</DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Usuario: <span className="font-medium">{selectedUser?.name}</span>
              </p>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setPasswordError("")
                  }}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setPasswordError("")
                  }}
                  placeholder="Repita la contraseña"
                />
              </div>
              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogState((prev) => ({ ...prev, resetPassword: false }))
                  setSelectedUser(null)
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordError("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} disabled={loading}>
                {loading ? "Restableciendo..." : "Restablecer Contraseña"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

