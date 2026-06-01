import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combina nombres de clases CSS usando clsx y tailwind-merge
 * Útil para manejar clases condicionales de Tailwind CSS
 * @param inputs - Array de nombres de clases o condiciones
 * @returns String con las clases combinadas y sin duplicados
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte una fecha en un string relativo legible en español
 * Ejemplo: "hace 5 minutos", "hace 2 horas", "hace 3 días"
 * @param date - Fecha en formato string ISO
 * @returns String con el tiempo transcurrido en español
 */
export function timeAgo(date: string): string {
  const now = new Date()
  const past = new Date(date)
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000)

  // Menos de 1 minuto
  if (seconds < 60) return "hace unos segundos"

  // Minutos
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} minuto${minutes !== 1 ? "s" : ""}`

  // Horas
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} hora${hours !== 1 ? "s" : ""}`

  // Días
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} día${days !== 1 ? "s" : ""}`

  // Semanas
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `hace ${weeks} semana${weeks !== 1 ? "s" : ""}`

  // Meses
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months !== 1 ? "es" : ""}`

  // Años
  const years = Math.floor(days / 365)
  return `hace ${years} año${years !== 1 ? "s" : ""}`
}
