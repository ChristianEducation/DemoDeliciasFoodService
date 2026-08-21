"use client"

import { useRouter } from "next/navigation"
import SelectEstudiantesCascada from "@/components/SelectEstudiantesCascada"
import LogoHeader from "@/components/LogoHeader"

export default function ApoderadoPage() {
  const router = useRouter()

  const handleEstudiantesSeleccionados = (estudiantesData: any) => {
    console.log("Estudiantes seleccionados:", estudiantesData)
    // Guardar en localStorage
    localStorage.setItem("estudiantesSeleccionados", JSON.stringify(estudiantesData))
    // Redirigir a almuerzos
    router.push("/almuerzos")
  }

  return (
    <div className="min-h-screen relative">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Selección de Estudiantes</h1>
            <p className="text-gray-600">Selecciona los estudiantes para realizar pedidos</p>
          </div>

          <SelectEstudiantesCascada onEstudiantesSeleccionados={handleEstudiantesSeleccionados} />
        </div>
      </main>
    </div>
  )
}
