"use client"

import Image from "next/image"
import { LoginForm } from "@/components/login-form"
import { useEffect, useState } from "react"

export default function LoginPage() {
  const [loading, setLoading] = useState(true)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/settings/public")
      .then((res) => res.json())
      .then((data) => {
        if (data.company_logo) {
          setCompanyLogo(data.company_logo)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95 p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -ml-40 -mb-40 opacity-30"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with logo */}
        <div className="mb-12 text-center">
          {companyLogo && (
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  src={companyLogo || "/placeholder.svg"}
                  alt="Company Logo"
                  width={120}
                  height={120}
                  className="object-contain drop-shadow-lg relative"
                  priority
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight text-pretty leading-tight">
              Bienvenido de vuelta
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mt-3">
              Accede a tu cuenta para continuar
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
          
          <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl p-8 sm:p-10 space-y-6 backdrop-blur-sm">
            <LoginForm />
            
            {/* Divider */}
            <div className="relative pt-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
              <div className="text-center text-xs sm:text-sm text-muted-foreground pt-6">
                <p className="font-medium">Tu acceso seguro es nuestra prioridad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center mt-8 text-sm text-muted-foreground space-y-2">
          <p>¿Problemas para acceder? <a href="#" className="text-primary font-semibold hover:text-primary/80 transition-colors inline-block">Contacta soporte</a></p>
          <p className="text-xs opacity-75">Esta sesión es segura y encriptada</p>
        </div>
      </div>
    </div>
  )
}
