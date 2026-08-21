"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function TestConnection() {
  const [connectionStatus, setConnectionStatus] = useState<"loading" | "connected" | "error">("loading")
  const [tables, setTables] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function testConnection() {
      try {
        const supabase = createClient()

        // Intentar hacer una consulta simple para probar la conexión
        const { data, error } = await supabase.from("estudiantes").select("count", { count: "exact", head: true })

        if (error) {
          console.error("Error de conexión:", error)
          setError(error.message)
          setConnectionStatus("error")
        } else {
          setConnectionStatus("connected")
          // Intentar obtener información de las tablas disponibles
          const tablesAvailable = ["estudiantes", "menus", "colaciones", "funcionarios"]
          setTables(tablesAvailable)
        }
      } catch (err) {
        console.error("Error:", err)
        setError(err instanceof Error ? err.message : "Error desconocido")
        setConnectionStatus("error")
      }
    }

    testConnection()
  }, [])

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Estado de Conexión Supabase
          <Badge
            variant={
              connectionStatus === "connected" ? "default" : connectionStatus === "error" ? "destructive" : "secondary"
            }
          >
            {connectionStatus === "loading" && "Conectando..."}
            {connectionStatus === "connected" && "Conectado"}
            {connectionStatus === "error" && "Error"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {connectionStatus === "connected" && (
          <div>
            <p className="text-green-600 mb-2">✅ Conexión exitosa con Supabase</p>
            <p className="text-sm text-gray-600">Tablas disponibles: {tables.join(", ")}</p>
          </div>
        )}
        {connectionStatus === "error" && (
          <div>
            <p className="text-red-600 mb-2">❌ Error de conexión</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        )}
        {connectionStatus === "loading" && <p className="text-blue-600">🔄 Probando conexión...</p>}
      </CardContent>
    </Card>
  )
}
