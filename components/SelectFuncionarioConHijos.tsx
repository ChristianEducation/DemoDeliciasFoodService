"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Users, ArrowRight } from "lucide-react"
import SelectFuncionarioSolo from "./SelectFuncionarioSolo"
import SelectEstudiantesCascada from "./SelectEstudiantesCascada"

interface DatosFuncionario {
  funcionarioId: string
  funcionarioNombre: string
  lugarRetiro: string
  curso?: string
}

interface DatosCompletos {
  funcionario: DatosFuncionario
  hijosIds: string[]
}

interface SelectFuncionarioConHijosProps {
  onSeleccionCompleta: (datos: DatosCompletos) => void
}

export default function SelectFuncionarioConHijos({ onSeleccionCompleta }: SelectFuncionarioConHijosProps) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [datosFuncionario, setDatosFuncionario] = useState<DatosFuncionario | null>(null)
  const [hijosSeleccionados, setHijosSeleccionados] = useState<string[]>([])

  const handleFuncionarioCompleto = (datos: DatosFuncionario) => {
    setDatosFuncionario(datos)
    setPaso(2)
  }

  const handleHijosSeleccionados = (hijosIds: string[]) => {
    setHijosSeleccionados(hijosIds)

    if (datosFuncionario) {
      onSeleccionCompleta({
        funcionario: datosFuncionario,
        hijosIds: hijosIds,
      })
    }
  }

  const handleEditarFuncionario = () => {
    setPaso(1)
    setHijosSeleccionados([])
  }

  const getLugarRetiroLabel = (valor: string) => {
    switch (valor) {
      case "preschool":
        return "Preschool"
      case "casino-basica":
        return "Casino Básica"
      case "casino-media":
        return "Casino Media"
      default:
        return valor
    }
  }

  return (
    <div className="space-y-8">
      {/* Indicador de pasos */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${paso === 1 ? "text-blue-600" : "text-green-600"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              paso === 1 ? "bg-blue-100 border-2 border-blue-600" : "bg-green-100 border-2 border-green-600"
            }`}
          >
            <User className="h-4 w-4" />
          </div>
          <span className="font-medium">Datos Funcionario</span>
        </div>

        <ArrowRight className="h-4 w-4 text-gray-400" />

        <div className={`flex items-center space-x-2 ${paso === 2 ? "text-blue-600" : "text-gray-400"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              paso === 2 ? "bg-blue-100 border-2 border-blue-600" : "bg-gray-100 border-2 border-gray-300"
            }`}
          >
            <Users className="h-4 w-4" />
          </div>
          <span className="font-medium">Seleccionar Hijos</span>
        </div>
      </div>

      {/* Paso 1: Datos del Funcionario */}
      {paso === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-600" />
              <span>Paso 1: Tus Datos como Funcionario</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SelectFuncionarioSolo onSeleccionCompleta={handleFuncionarioCompleto} />
          </CardContent>
        </Card>
      )}

      {/* Paso 2: Selección de Hijos */}
      {paso === 2 && (
        <div className="space-y-6">
          {/* Resumen del funcionario */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-800 mb-1">✅ Datos del Funcionario</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Nombre:</strong> {datosFuncionario?.funcionarioNombre}
                    </p>
                    <p>
                      <strong>Lugar de retiro:</strong> {getLugarRetiroLabel(datosFuncionario?.lugarRetiro || "")}
                    </p>
                    {datosFuncionario?.curso && (
                      <p>
                        <strong>Curso:</strong> {datosFuncionario.curso}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleEditarFuncionario}>
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selección de hijos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Paso 2: Seleccionar tus Hijos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SelectEstudiantesCascada onEstudiantesSeleccionados={handleHijosSeleccionados} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
