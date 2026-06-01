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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/95 bg-texture p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 opacity-40"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -ml-40 -mb-40 opacity-30"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with logo */}
        <div className="mb-12 flex justify-center">
          {companyLogo ? (
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-32 w-auto object-contain drop-shadow-lg relative"
              />
            </div>
          ) : (
            <div className="flex size-24 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-3xl">
              FDX
            </div>
          )}
        </div>

        {/* Login Form Card */}
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-0 group-hover:opacity-50 transition duration-500"></div>
          
          <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl p-8 sm:p-10 space-y-6 backdrop-blur-sm">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
