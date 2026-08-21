"use client"

import { useRouter } from "next/navigation"
import SelectFuncionarioConHijos from "@/components/SelectFuncionarioConHijos"
import LogoHeader from "@/components/LogoHeader"

export default function FuncionarioConHijosPage() {
  const router = useRouter()

  const handleSeleccionCompleta = (funcionarioData: any) => {
    console.log("Funcionario con hijos seleccionado:", funcionarioData)
    // Guardar en localStorage
    localStorage.setItem("funcionarioConHijosSeleccionado", JSON.stringify(funcionarioData))
    // Redirigir a almuerzos
    router.push("/almuerzos")
  }

  return (
    <div className="min-h-screen relative">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Funcionario con Hijos</h1>
            <p className="text-gray-600">Selecciona tu información y la de tus hijos</p>
          </div>

          <SelectFuncionarioConHijos onSeleccionCompleta={handleSeleccionCompleta} />
        </div>
      </main>
    </div>
  )
}
