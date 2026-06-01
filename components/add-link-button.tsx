"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AddLinkDialog } from "@/components/add-link-dialog"
import { Plus } from "lucide-react"

export function AddLinkButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Agregar Enlace
      </Button>

      {isOpen && <AddLinkDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}
