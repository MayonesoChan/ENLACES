"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Pencil, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { timeAgo } from "@/lib/utils"

interface DailyMessage {
  id: number
  message: string
  created_by: number
  creator_name: string
  created_at: string
  updated_at: string
  is_read: boolean
  user_has_read?: boolean
}

interface DailyMessagesPopoverProps {
  userRole: string
  userId?: number
}

export function DailyMessagesPopover({ userRole, userId }: DailyMessagesPopoverProps) {
  const [messages, setMessages] = useState<DailyMessage[]>([])
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMessage, setEditingMessage] = useState<DailyMessage | null>(null)
  const [messageText, setMessageText] = useState("")
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const [readingMessageId, setReadingMessageId] = useState<number | null>(null)
  const { toast } = useToast()
  const isAdmin = userRole === "admin"

  const unreadCount = messages.filter((m) => !m.user_has_read).length

  useEffect(() => {
    loadMessages()
  }, [])

  useEffect(() => {
    if (open) {
      loadMessages()
    }
  }, [open])

  const loadMessages = async () => {
    try {
      const res = await fetch("/api/daily-messages")
      if (res.ok) {
        const data = await res.json()
        setMessages(data)
      }
    } catch (error) {
      // Silently fail
    }
  }

  const markMessageAsRead = async (messageId: number) => {
    setReadingMessageId(messageId)
    try {
      const res = await fetch(`/api/daily-messages/${messageId}/read`, {
        method: "PATCH",
      })

      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, user_has_read: true } : m)))
      } else {
        toast({
          title: "Error",
          description: "Error al marcar como leída",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al marcar como leída",
        variant: "destructive",
      })
    } finally {
      setReadingMessageId(null)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    try {
      const url = editingMessage ? `/api/daily-messages/${editingMessage.id}` : "/api/daily-messages"
      const method = editingMessage ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText }),
      })

      if (res.ok) {
        toast({
          title: "¡Éxito!",
          description: editingMessage ? "Mensaje actualizado exitosamente" : "Mensaje creado exitosamente",
        })
        setDialogOpen(false)
        setMessageText("")
        setEditingMessage(null)
        await loadMessages()
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Error al guardar mensaje",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar mensaje",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este mensaje?")) return

    try {
      const res = await fetch(`/api/daily-messages/${id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          title: "¡Éxito!",
          description: "Mensaje eliminado exitosamente",
        })
        await loadMessages()
      } else {
        toast({
          title: "Error",
          description: "Error al eliminar mensaje",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar mensaje",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (message: DailyMessage) => {
    setEditingMessage(message)
    setMessageText(message.message)
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingMessage(null)
    setMessageText("")
    setDialogOpen(true)
  }

  const handleMarkAllAsRead = async () => {
    setMarkingAsRead(true)
    try {
      const res = await fetch("/api/daily-messages", {
        method: "PATCH",
      })

      if (res.ok) {
        toast({
          title: "¡Éxito!",
          description: "Todos los mensajes marcados como leídos",
        })
        await loadMessages()
      } else {
        toast({
          title: "Error",
          description: "Error al marcar mensajes como leídos",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al marcar mensajes como leídos",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Calendar className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="border-b p-4 flex items-center justify-between">
            <h3 className="font-semibold">Mensajes de Hoy</h3>
            {isAdmin && (
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Nuevo
              </Button>
            )}
          </div>
          <ScrollArea className="h-[400px]">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay mensajes del día</div>
            ) : (
              <div className="divide-y">
                {messages.map((message) => (
                  <div key={message.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          {!message.user_has_read && (
                            <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Por {message.creator_name}</span>
                          <span>•</span>
                          <span>{timeAgo(message.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!message.user_has_read && !isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => markMessageAsRead(message.id)}
                            disabled={readingMessageId === message.id}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(message)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(message.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {isAdmin && unreadCount > 0 && (
            <div className="border-t p-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent"
                onClick={handleMarkAllAsRead}
                disabled={markingAsRead}
              >
                {markingAsRead ? "Marcando..." : "Marcar todos como leídos"}
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMessage ? "Editar Mensaje" : "Nuevo Mensaje del Día"}</DialogTitle>
            <DialogDescription>
              {editingMessage
                ? "Modifica el mensaje que verán todos los usuarios"
                : "Crea un mensaje que verán todos los usuarios"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Mensaje</Label>
              <Textarea
                id="message"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={5}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateOrUpdate}>{editingMessage ? "Guardar Cambios" : "Crear Mensaje"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
