"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function TestFuncionarios() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [funcionarios, setFuncionarios] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<any>(null)

  const supabase = createClient()

  const testConnection = async () => {
    setStatus("loading")
    setError(null)

    try {
      console.log("🔍 Probando conexión con tabla funcionarios...")

      // Probar consulta básica
      const { data, error, count } = await supabase.from("funcionarios").select("*", { count: "exact" }).limit(5)

      console.log("📊 Respuesta completa:", { data, error, count })

      if (error) {
        throw error
      }

      setRawData({ data, count })
      setFuncionarios(data || [])
      setStatus("success")
    } catch (err) {
      console.error("❌ Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
      setStatus("error")
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Test Tabla Funcionarios
          <Badge variant={status === "success" ? "default" : status === "error" ? "destructive" : "secondary"}>
            {status === "loading" && "Cargando..."}
            {status === "success" && "Conectado"}
            {status === "error" && "Error"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && <p className="text-blue-600">🔄 Probando conexión con tabla funcionarios...</p>}

        {status === "success" && (
          <div className="space-y-3">
            <p className="text-green-600">✅ Conexión exitosa con tabla funcionarios</p>
            <div className="text-sm space-y-1">
              <p>
                <strong>Total de registros:</strong> {rawData?.count || 0}
              </p>
              <p>
                <strong>Registros obtenidos:</strong> {funcionarios.length}
              </p>
              {funcionarios.length > 0 && (
                <div>
                  <p>
                    <strong>Estructura del primer registro:</strong>
                  </p>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(funcionarios[0], null, 2)}
                  </pre>
                </div>
              )}
              {funcionarios.length > 0 && (
                <div>
                  <p>
                    <strong>Nombres encontrados:</strong>
                  </p>
                  <ul className="list-disc list-inside">
                    {funcionarios.slice(0, 3).map((f, i) => (
                      <li key={i}>{f.nombre || f.name || "Sin nombre"}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-red-600">❌ Error de conexión</p>
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={testConnection} size="sm" variant="outline">
              Reintentar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
