"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSearch } from "@/components/search-context"

export function SearchInput() {
  const { searchQuery, setSearchQuery } = useSearch()

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Busque sus aplicaciones"
        className="pl-10 bg-background border-input"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  )
}
