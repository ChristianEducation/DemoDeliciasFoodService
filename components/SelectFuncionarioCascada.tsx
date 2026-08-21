"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"

interface Funcionario {
  id: string
  nombre: string
}

interface DatosSeleccionados {
  funcionarioId: string
  funcionarioNombre: string
  lugarRetiro: string
  casino: string
  nivel: string
  curso?: string
}

interface SelectFuncionarioCascadaProps {
  onSeleccionCompleta: (datos: DatosSeleccionados) => void
}

const LUGARES_RETIRO = [
  { value: "preschool", label: "Preschool" },
  { value: "casino-basica", label: "Casino Básica" },
  { value: "casino-media", label: "Casino Media" },
]

const CURSOS_PRESCHOOL = ["PGA", "PGB", "PKA", "PKB", "PKC", "PKD", "KA", "KB", "KC", "1°A", "1°B", "1°C"]

export default function SelectFuncionarioCascada({ onSeleccionCompleta }: SelectFuncionarioCascadaProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState<string>("")
  const [lugarRetiroSeleccionado, setLugarRetiroSeleccionado] = useState<string>("")
  const [cursoSeleccionado, setCursoSeleccionado] = useState<string>("")

  const [loadingFuncionarios, setLoadingFuncionarios] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Cargar funcionarios al montar el componente
  useEffect(() => {
    async function fetchFuncionarios() {
      setLoadingFuncionarios(true)
      setError(null)

      try {
        console.log("🔍 Iniciando consulta a funcionarios...")

        // Primero, intentemos ver qué tablas existen
        const { data: tablesData, error: tablesError } = await supabase.from("funcionarios").select("*").limit(1)

        if (tablesError) {
          console.error("❌ Error consultando tabla funcionarios:", tablesError)
          throw new Error(`Error de tabla: ${tablesError.message}`)
        }

        console.log("✅ Tabla funcionarios existe, consultando datos...")

        const { data, error } = await supabase.from("funcionarios").select("id, nombre").order("nombre")

        if (error) {
          console.error("❌ Error en consulta:", error)
          throw error
        }

        console.log("📊 Datos recibidos:", data)
        console.log("📊 Cantidad de funcionarios:", data?.length || 0)

        if (data && data.length > 0) {
          setFuncionarios(data)
          console.log("✅ Funcionarios cargados exitosamente")
        } else {
          console.log("⚠️ No se encontraron funcionarios")
          setError("No se encontraron funcionarios en la base de datos")
        }
      } catch (error) {
        console.error("💥 Error completo:", error)
        const errorMessage = error instanceof Error ? error.message : "Error desconocido"
        setError(`Error cargando funcionarios: ${errorMessage}`)
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

        const datos: DatosSeleccionados = {
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

  return (
    <div className="space-y-8">
      {/* Debug Info - Solo en desarrollo */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>Loading: {loadingFuncionarios ? "Sí" : "No"}</p>
              <p>Error: {error || "Ninguno"}</p>
              <p>Funcionarios cargados: {funcionarios.length}</p>
              {funcionarios.length > 0 && <p>Primer funcionario: {funcionarios[0]?.nombre}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de Funcionario */}
      <div className="text-center">
        <h2 className="text-xl font-light text-gray-700 mb-4">Selecciona tu Nombre</h2>
        <div className="max-w-xs mx-auto">
          {error ? (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 text-sm">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="mt-2">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Select
              value={funcionarioSeleccionado}
              onValueChange={setFuncionarioSeleccionado}
              disabled={loadingFuncionarios || funcionarios.length === 0}
            >
              <SelectTrigger className="h-12">
                <SelectValue
                  placeholder={
                    loadingFuncionarios
                      ? "Cargando funcionarios..."
                      : funcionarios.length === 0
                        ? "No hay funcionarios disponibles"
                        : "Selecciona tu nombre"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {loadingFuncionarios && (
            <div className="flex justify-center mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Cargando...</span>
            </div>
          )}
        </div>
      </div>

      {/* Información del funcionario seleccionado */}
      {funcionarioSeleccionado && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            {(() => {
              const funcionario = funcionarios.find((f) => f.id === funcionarioSeleccionado)
              return funcionario ? (
                <div>
                  <p className="font-medium text-blue-800">{funcionario.nombre}</p>
                </div>
              ) : null
            })()}
          </CardContent>
        </Card>
      )}

      {/* Selector de Lugar de Retiro */}
      {funcionarioSeleccionado && (
        <div className="text-center">
          <h2 className="text-xl font-light text-gray-700 mb-4">Lugar de Retiro</h2>
          <div className="max-w-xs mx-auto">
            <Select value={lugarRetiroSeleccionado} onValueChange={setLugarRetiroSeleccionado}>
              <SelectTrigger className="h-12">
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
          <h2 className="text-xl font-light text-gray-700 mb-4">Selecciona el Curso</h2>
          <div className="max-w-xs mx-auto">
            <Select value={cursoSeleccionado} onValueChange={setCursoSeleccionado}>
              <SelectTrigger className="h-12">
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

      {/* Resumen de selección */}
      {puedesContinuar() && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <h3 className="font-medium text-green-800 mb-2">Resumen de tu selección:</h3>
            <div className="text-sm text-green-700 space-y-1">
              <p>
                <strong>Funcionario:</strong> {funcionarios.find((f) => f.id === funcionarioSeleccionado)?.nombre}
              </p>
              <p>
                <strong>Lugar de retiro:</strong>{" "}
                {LUGARES_RETIRO.find((l) => l.value === lugarRetiroSeleccionado)?.label}
              </p>
              {lugarRetiroSeleccionado === "preschool" && cursoSeleccionado && (
                <p>
                  <strong>Curso:</strong> {cursoSeleccionado}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón Continuar */}
      {puedesContinuar() && (
        <div className="text-center pt-4">
          <Button onClick={handleContinuar} size="lg" className="px-8 py-3">
            Continuar
          </Button>
        </div>
      )}
    </div>
  )
}
