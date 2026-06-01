"use client"

import { Home, Plus, Users, Settings } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

interface AppSidebarProps {
  userRole: "admin" | "user"
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const pathname = usePathname()
  const [companyName, setCompanyName] = useState("FDX GLOBAL")
  const [companyLogo, setCompanyLogo] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setCompanyName(data.company_name || "FDX GLOBAL")
        setCompanyLogo(data.company_logo || "")
      }
    } catch (error) {
      console.error("Error al cargar configuración:", error)
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2 px-2">
          {companyLogo ? (
            <div className="flex size-8 items-center justify-center rounded-lg overflow-hidden">
              <img src={companyLogo || "/Logo-01.jpg"} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              {companyName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <span className="font-semibold text-foreground group-data-[collapsible=icon]:hidden">
            {mounted ? companyName : "FDX GLOBAL"}
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"} tooltip="Mis aplicaciones">
                  <Link href="/dashboard">
                    <Home />
                    <span>Mis aplicaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {userRole === "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/admin"} size="sm" tooltip="Administrar enlaces">
                      <Link href="/admin">
                        <Plus />
                        <span>Administrar enlaces</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/users"} size="sm" tooltip="Gestión de usuarios">
                      <Link href="/users">
                        <Users />
                        <span>Gestión Agentes FDX</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/settings"} size="sm" tooltip="Configuración">
                      <Link href="/settings">
                        <Settings />
                        <span>Configuración</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
