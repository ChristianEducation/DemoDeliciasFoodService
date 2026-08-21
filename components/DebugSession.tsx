"use client"

import { useUserSession } from "@/hooks/useUserSession"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugSession() {
  const { session } = useUserSession()

  if (process.env.NODE_ENV !== "development") return null

  const getLocalStorageData = () => {
    if (typeof window === "undefined") return {}

    return {
      tipoUsuario: localStorage.getItem("tipoUsuario"),
      estudiantesSeleccionados: localStorage.getItem("estudiantesSeleccionados"),
      funcionarioSeleccionado: localStorage.getItem("funcionarioSeleccionado"),
      funcionarioConHijosSeleccionado: localStorage.getItem("funcionarioConHijosSeleccionado"),
    }
  }

  const lsData = getLocalStorageData()

  return (
    <Card className="mb-4 bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">Debug - Estado de Sesión</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-yellow-700 space-y-2">
        <div>
          <strong>Tipo Usuario (Hook):</strong> {session.tipoUsuario || "No definido"}
        </div>
        <div>
          <strong>Destinatarios (Hook):</strong> {session.destinatariosSeleccionados.length}
        </div>
        <div>
          <strong>LocalStorage tipoUsuario:</strong> {lsData.tipoUsuario || "N/A"}
        </div>
        {lsData.estudiantesSeleccionados && (
          <div>
            <strong>LocalStorage estudiantes:</strong>
            <pre className="text-xs bg-yellow-100 p-1 rounded mt-1 overflow-auto max-h-20">
              {lsData.estudiantesSeleccionados}
            </pre>
          </div>
        )}
        {lsData.funcionarioSeleccionado && (
          <div>
            <strong>LocalStorage funcionario:</strong>
            <pre className="text-xs bg-yellow-100 p-1 rounded mt-1 overflow-auto max-h-20">
              {lsData.funcionarioSeleccionado}
            </pre>
          </div>
        )}
        {lsData.funcionarioConHijosSeleccionado && (
          <div>
            <strong>LocalStorage funcionario con hijos:</strong>
            <pre className="text-xs bg-yellow-100 p-1 rounded mt-1 overflow-auto max-h-20">
              {lsData.funcionarioConHijosSeleccionado}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
