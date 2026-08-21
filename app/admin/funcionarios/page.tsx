"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, Plus, Download } from "lucide-react"
import { FuncionariosTable } from "@/components/admin/FuncionariosTable"
import { FuncionarioModal } from "@/components/admin/FuncionarioModal"
import { createClient } from "@/utils/supabase/client"

interface Funcionario {
  id: string
  nombre: string
}

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<Funcionario[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    cargarFuncionarios()
  }, [])

  useEffect(() => {
    const filtered = funcionarios.filter((funcionario) =>
      funcionario.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredFuncionarios(filtered)
  }, [funcionarios, searchTerm])

  const cargarFuncionarios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from("funcionarios").select("id, nombre").order("nombre")

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error("Error cargando funcionarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgregarFuncionario = () => {
    setEditingFuncionario(null)
    setIsModalOpen(true)
  }

  const handleEditarFuncionario = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario)
    setIsModalOpen(true)
  }

  const handleEliminarFuncionario = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este funcionario?")) return

    try {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id)

      if (error) throw error
      await cargarFuncionarios()
    } catch (error) {
      console.error("Error eliminando funcionario:", error)
      alert("Error al eliminar funcionario")
    }
  }

  const handleGuardarFuncionario = async (nombre: string) => {
    try {
      if (editingFuncionario) {
        // Editar funcionario existente
        const { error } = await supabase.from("funcionarios").update({ nombre }).eq("id", editingFuncionario.id)

        if (error) throw error
      } else {
        // Agregar nuevo funcionario
        const { error } = await supabase.from("funcionarios").insert({
          nombre,
          ultimo_casino: null,
          ultimo_curso_preschool: null,
          ultimo_nivel_hijo: null,
          ultimo_curso_hijo: null,
        })

        if (error) throw error
      }

      setIsModalOpen(false)
      await cargarFuncionarios()
    } catch (error) {
      console.error("Error guardando funcionario:", error)
      alert("Error al guardar funcionario")
    }
  }

  const exportarExcel = async () => {
    try {
      const XLSX = await import("xlsx-js-style")

      // Crear datos para Excel
      const excelData = [["FUNCIONARIOS"], [""], ["NOMBRE"], ...filteredFuncionarios.map((f) => [f.nombre])]

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)

      // Estilos
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      }

      const titleStyle = {
        font: { bold: true, size: 16 },
        alignment: { horizontal: "center" },
      }

      // Aplicar estilos
      if (!ws["!merges"]) ws["!merges"] = []
      ws["!merges"].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } })

      ws["A1"] = { v: "FUNCIONARIOS", s: titleStyle }
      ws["A3"] = { v: "NOMBRE", s: headerStyle }

      // Ancho de columnas
      ws["!cols"] = [{ width: 30 }]

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, "Funcionarios")

      // Descargar archivo
      const fecha = new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `funcionarios-${fecha}.xlsx`)
    } catch (error) {
      console.error("Error exportando Excel:", error)
      // Fallback a CSV
      exportarCSV()
    }
  }

  const exportarCSV = () => {
    const csvContent = ["NOMBRE", ...filteredFuncionarios.map((f) => f.nombre)].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `funcionarios-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Funcionarios</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Funcionarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar funcionario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={exportarExcel} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button onClick={handleAgregarFuncionario}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Funcionario
              </Button>
            </div>
          </div>

          <FuncionariosTable
            funcionarios={filteredFuncionarios}
            loading={loading}
            onEditar={handleEditarFuncionario}
            onEliminar={handleEliminarFuncionario}
          />
        </CardContent>
      </Card>

      <FuncionarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGuardar={handleGuardarFuncionario}
        funcionario={editingFuncionario}
      />
    </div>
  )
}
