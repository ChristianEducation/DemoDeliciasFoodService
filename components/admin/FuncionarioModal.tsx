"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Funcionario {
  id: string
  nombre: string
}

interface FuncionarioModalProps {
  isOpen: boolean
  onClose: () => void
  onGuardar: (nombre: string) => Promise<void>
  funcionario: Funcionario | null
}

export function FuncionarioModal({ isOpen, onClose, onGuardar, funcionario }: FuncionarioModalProps) {
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (funcionario) {
      setNombre(funcionario.nombre)
    } else {
      setNombre("")
    }
  }, [funcionario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      alert("El nombre es requerido")
      return
    }

    try {
      setLoading(true)
      await onGuardar(nombre.trim())
      setNombre("")
    } catch (error) {
      console.error("Error guardando funcionario:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setNombre("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{funcionario ? "Editar Funcionario" : "Agregar Funcionario"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="col-span-3"
                placeholder="Ingrese el nombre del funcionario"
                required
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !nombre.trim()}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
