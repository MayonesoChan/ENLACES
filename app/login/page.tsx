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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Welcome Text */}
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Inicie sesión con su cuenta</h1>
          <p className="text-base text-muted-foreground">para acceder al sistema</p>
        </div>

        {/* Logo - displayed below text */}
        {companyLogo && (
          <div className="mb-12">
            <Image
              src={companyLogo || "/placeholder.svg"}
              alt="Company Logo"
              width={140}
              height={140}
              className="object-contain drop-shadow-sm"
              priority
            />
          </div>
        )}

        {/* Login Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-8 w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
