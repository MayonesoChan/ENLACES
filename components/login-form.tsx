"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Error al iniciar sesión")
        return
      }

      if (data.user) {
        sessionStorage.setItem("welcomeUser", JSON.stringify(data.user))
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-2.5">
        <Label htmlFor="email" className="text-sm font-semibold text-foreground block">
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 text-base rounded-lg border border-border bg-background/50 hover:bg-background/70 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="nombre@empresa.com"
          disabled={loading}
        />
      </div>

      {/* Password Field */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-foreground">
            Contraseña
          </Label>
          <a href="#" className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
            ¿Olvidaste?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="h-11 text-base rounded-lg border border-border bg-background/50 hover:bg-background/70 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-colors"
          placeholder="••••••••"
          disabled={loading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-in fade-in-50">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-sm text-destructive font-medium">{error}</span>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full h-11 mt-6 text-base font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Iniciando sesión...
          </span>
        ) : (
          "Iniciar sesión"
        )}
      </Button>

      {/* Security Note */}
      <div className="text-center text-xs text-muted-foreground pt-2">
        <p>Usamos encriptación de extremo a extremo para proteger tus datos</p>
      </div>
    </form>
  )
}
