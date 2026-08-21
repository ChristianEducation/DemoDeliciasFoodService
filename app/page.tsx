"use client"

import { useRouter } from "next/navigation"
import SelectUsuario from "@/components/SelectUsuario"
import { useUserSession } from "@/hooks/useUserSession"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const { setTipoUsuario } = useUserSession()

  const handleUserSelection = (tipoUsuario: string) => {
    // Usar el hook para guardar el tipo de usuario
    setTipoUsuario(tipoUsuario as any)

    // Redirigir automáticamente según el tipo de usuario
    if (tipoUsuario === "apoderado") {
      router.push("/apoderado")
    } else if (tipoUsuario === "funcionario-sin-hijos") {
      router.push("/funcionario")
    } else if (tipoUsuario === "funcionario-con-hijos") {
      router.push("/funcionario-con-hijos")
    } else {
      router.push("/destinatario")
    }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/delicias-logo.png"
              alt="Delicias Food Service"
              width={300}
              height={120}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-gray-700 text-lg">Selecciona tu tipo de usuario para continuar</p>
        </div>

        <SelectUsuario onSelect={handleUserSelection} />
      </div>
    </main>
  )
}
