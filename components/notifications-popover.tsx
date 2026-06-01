"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { timeAgo } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Notification {
  id: number
  message: string
  is_read: boolean
  created_at: string
  link_id?: number
  link_title?: string
  link_url?: string
  category_id?: number
  category_name?: string
  category_icon?: string
  creator_name: string
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")

      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length)
      }
    } catch (error) {
      // Silently fail
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      })
      await loadNotifications()
    } catch (error) {
      // Silently fail
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      })
      await loadNotifications()
    } catch (error) {
      // Silently fail
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id)
    setOpen(false)
    if (notification.link_url) {
      // Si hay un enlace, abrirlo en una nueva pestaña
      window.open(notification.link_url, "_blank")
    } else {
      // Si es una categoría o solo notificación general, ir al dashboard
      router.push("/dashboard")
    }
    router.refresh()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b p-4">
          <h3 className="font-semibold">Notificaciones</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? "bg-accent/50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {notification.category_icon && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {notification.category_icon}
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.link_title || notification.category_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      {notification.creator_name && (
                        <p className="text-xs text-muted-foreground">Por {notification.creator_name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{timeAgo(notification.created_at)}</p>
                    </div>
                    {!notification.is_read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        {unreadCount > 0 && (
          <div className="border-t p-3">
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
