"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUserSession } from "@/hooks/useUserSession"
import SelectHijo from "@/components/SelectHijo"
import TabsDestinatarios from "@/components/TabsDestinatarios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function DestinatarioPage() {
  const { session, setDestinatarios } = useUserSession()
  const [destinatariosSeleccionados, setDestinatariosSeleccionados] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // Redirigir si no hay tipo de usuario seleccionado
    if (!session.tipoUsuario) {
      router.push("/")
    }
  }, [session.tipoUsuario, router])

  const handleSelectionChange = (selectedIds: string[]) => {
    setDestinatariosSeleccionados(selectedIds)
  }

  const handleContinuar = () => {
    if (destinatariosSeleccionados.length > 0) {
      setDestinatarios(destinatariosSeleccionados)
      router.push("/almuerzos")
    }
  }

  const handleVolver = () => {
    router.push("/")
  }

  if (!session.tipoUsuario) {
    return <div>Cargando...</div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleVolver} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Seleccionar Destinatario</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tipo de Usuario Seleccionado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {session.tipoUsuario === "apoderado" && "Apoderado - Realizando pedidos para hijos"}
              {session.tipoUsuario === "funcionario-sin-hijos" && "Funcionario - Pedido personal"}
              {session.tipoUsuario === "funcionario-con-hijos" &&
                "Funcionario con Hijos - Pedidos personales y para hijos"}
            </p>
          </CardContent>
        </Card>

        {session.tipoUsuario === "apoderado" && <SelectHijo onSelectionChange={handleSelectionChange} />}

        {session.tipoUsuario === "funcionario-con-hijos" && (
          <TabsDestinatarios onSelectionChange={handleSelectionChange} />
        )}

        {session.tipoUsuario === "funcionario-sin-hijos" && (
          <Card>
            <CardHeader>
              <CardTitle>Pedido Personal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Realizarás un pedido personal como funcionario del colegio.</p>
              <Button
                onClick={() => {
                  setDestinatarios(["personal"])
                  router.push("/almuerzos")
                }}
                className="w-full"
              >
                Continuar con Pedido Personal
              </Button>
            </CardContent>
          </Card>
        )}

        {(session.tipoUsuario === "apoderado" || session.tipoUsuario === "funcionario-con-hijos") && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={handleContinuar}
              disabled={destinatariosSeleccionados.length === 0}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              Continuar ({destinatariosSeleccionados.length} seleccionado
              {destinatariosSeleccionados.length !== 1 ? "s" : ""})
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
