"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Funcionario {
  id: string
  nombre: string
}

interface DatosFuncionario {
  funcionarioId: string
  funcionarioNombre: string
  lugarRetiro: string
  casino: string
  nivel: string
  curso?: string
}

interface SelectFuncionarioSoloProps {
  onSeleccionCompleta: (datos: DatosFuncionario) => void
  showContinueButton?: boolean
}

const LUGARES_RETIRO = [
  { value: "preschool", label: "Preschool" },
  { value: "casino-basica", label: "Casino Básica" },
  { value: "casino-media", label: "Casino Media" },
]

const CURSOS_PRESCHOOL = ["PGA", "PGB", "PKA", "PKB", "PKC", "PKD", "KA", "KB", "KC", "1°A", "1°B", "1°C"]

export default function SelectFuncionarioSolo({
  onSeleccionCompleta,
  showContinueButton = true,
}: SelectFuncionarioSoloProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState<string>("")
  const [lugarRetiroSeleccionado, setLugarRetiroSeleccionado] = useState<string>("")
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("")

  const [loadingFuncionarios, setLoadingFuncionarios] = useState(true)

  const supabase = createClient()

  // Cargar funcionarios al montar el componente
  useEffect(() => {
    async function fetchFuncionarios() {
      setLoadingFuncionarios(true)
      try {
        const { data, error } = await supabase.from("funcionarios").select("id, nombre").order("nombre")

        if (error) throw error

        setFuncionarios(data || [])
      } catch (error) {
        console.error("Error cargando funcionarios:", error)
      } finally {
        setLoadingFuncionarios(false)
      }
    }

    fetchFuncionarios()
  }, [])

  // Limpiar curso cuando cambia el lugar de retiro
  useEffect(() => {
    if (lugarRetiroSeleccionado !== "preschool") {
      setCursoSeleccionado("")
    }
  }, [lugarRetiroSeleccionado])

  const handleContinuar = () => {
    if (funcionarioSeleccionado && lugarRetiroSeleccionado) {
      const funcionario = funcionarios.find((f) => f.id === funcionarioSeleccionado)
      if (funcionario) {
        // Mapear lugarRetiro a casino y nivel
        let casino: string
        let nivel: string

        switch (lugarRetiroSeleccionado) {
          case "preschool":
            casino = "preschool"
            nivel = "preschool"
            break
          case "casino-basica":
            casino = "casino"
            nivel = "basica"
            break
          case "casino-media":
            casino = "casino"
            nivel = "media"
            break
          default:
            casino = lugarRetiroSeleccionado
            nivel = lugarRetiroSeleccionado
        }

        const datos: DatosFuncionario = {
          funcionarioId: funcionario.id,
          funcionarioNombre: funcionario.nombre,
          lugarRetiro: lugarRetiroSeleccionado,
          casino,
          nivel,
          ...(lugarRetiroSeleccionado === "preschool" && cursoSeleccionado && { curso: cursoSeleccionado }),
        }
        onSeleccionCompleta(datos)
      }
    }
  }

  const puedesContinuar = () => {
    if (!funcionarioSeleccionado || !lugarRetiroSeleccionado) return false
    if (lugarRetiroSeleccionado === "preschool" && !cursoSeleccionado) return false
    return true
  }

  // Auto-continuar si no se muestra el botón
  useEffect(() => {
    if (!showContinueButton && puedesContinuar()) {
      handleContinuar()
    }
  }, [funcionarioSeleccionado, lugarRetiroSeleccionado, cursoSeleccionado, showContinueButton])

  return (
    <div className="space-y-6">
      {/* Selector de Funcionario */}
      <div className="text-center">
        <h3 className="text-lg font-light text-gray-700 mb-3">Selecciona tu Nombre</h3>
        <div className="max-w-xs mx-auto">
          <Select
            value={funcionarioSeleccionado}
            onValueChange={setFuncionarioSeleccionado}
            disabled={loadingFuncionarios}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={loadingFuncionarios ? "Cargando..." : "Tu nombre"} />
            </SelectTrigger>
            <SelectContent>
              {funcionarios.map((funcionario) => (
                <SelectItem key={funcionario.id} value={funcionario.id}>
                  {funcionario.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loadingFuncionarios && (
            <div className="flex justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Selector de Lugar de Retiro */}
      {funcionarioSeleccionado && (
        <div className="text-center">
          <h3 className="text-lg font-light text-gray-700 mb-3">Lugar de Retiro</h3>
          <div className="max-w-xs mx-auto">
            <Select value={lugarRetiroSeleccionado} onValueChange={setLugarRetiroSeleccionado}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Selecciona lugar" />
              </SelectTrigger>
              <SelectContent>
                {LUGARES_RETIRO.map((lugar) => (
                  <SelectItem key={lugar.value} value={lugar.value}>
                    {lugar.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Selector de Curso (solo para Preschool) */}
      {lugarRetiroSeleccionado === "preschool" && (
        <div className="text-center">
          <h3 className="text-lg font-light text-gray-700 mb-3">Selecciona el Curso</h3>
          <div className="max-w-xs mx-auto">
            <Select value={cursoSeleccionado} onValueChange={setCursoSeleccionado}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Curso" />
              </SelectTrigger>
              <SelectContent>
                {CURSOS_PRESCHOOL.map((curso) => (
                  <SelectItem key={curso} value={curso}>
                    {curso}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Botón Continuar */}
      {showContinueButton && puedesContinuar() && (
        <div className="text-center pt-4">
          <Button onClick={handleContinuar} size="lg" className="px-8 py-3">
            Continuar
          </Button>
        </div>
      )}
    </div>
  )
}
