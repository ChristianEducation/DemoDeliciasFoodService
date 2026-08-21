"use client"

import { useRouter } from "next/navigation"
import SelectFuncionarioCascada from "@/components/SelectFuncionarioCascada"
import LogoHeader from "@/components/LogoHeader"

export default function FuncionarioPage() {
  const router = useRouter()

  const handleSeleccionCompleta = (funcionarioData: any) => {
    console.log("Funcionario seleccionado:", funcionarioData)
    // Guardar en localStorage
    localStorage.setItem("funcionarioSeleccionado", JSON.stringify(funcionarioData))
    // Redirigir a almuerzos
    router.push("/almuerzos")
  }

  return (
    <div className="min-h-screen relative">
      <LogoHeader />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Selección de Funcionario</h1>
            <p className="text-gray-600">Selecciona tu información para continuar</p>
          </div>

          <SelectFuncionarioCascada onSeleccionCompleta={handleSeleccionCompleta} />
        </div>
      </main>
    </div>
  )
}
