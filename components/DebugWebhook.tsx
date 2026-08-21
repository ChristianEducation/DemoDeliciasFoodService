"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Webhook, ExternalLink, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"

export default function DebugWebhook() {
  const [transactionId, setTransactionId] = useState("ORDER-1752883314340-XDT6AL")
  const [status, setStatus] = useState("approved")
  const [loading, setLoading] = useState(false)
  const [consultaLoading, setConsultaLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [consultaResult, setConsultaResult] = useState<any>(null)

  const simularWebhook = async () => {
    if (!transactionId.trim()) {
      alert("Por favor ingresa un Transaction ID")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      console.log("🧪 Simulando webhook para:", { transactionId, status })

      const response = await fetch("/api/payment/test-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: transactionId.trim(),
          status: status,
        }),
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        console.log("✅ Webhook simulado exitosamente:", data)
      } else {
        console.error("❌ Error en webhook:", data)
      }
    } catch (error) {
      console.error("💥 Error simulando webhook:", error)
      setResult({ error: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  const consultarEstado = async () => {
    if (!transactionId.trim()) {
      alert("Por favor ingresa un Transaction ID")
      return
    }

    setConsultaLoading(true)
    setConsultaResult(null)

    try {
      console.log("🔍 Consultando estado para:", transactionId)

      const response = await fetch(`/api/payment/status/${transactionId.trim()}`)
      const data = await response.json()
      setConsultaResult(data)

      if (data.success) {
        console.log("✅ Estado consultado:", data)
      } else {
        console.error("❌ Error consultando estado:", data)
      }
    } catch (error) {
      console.error("💥 Error consultando estado:", error)
      setConsultaResult({ error: "Error de conexión" })
    } finally {
      setConsultaLoading(false)
    }
  }

  const abrirPaginaGracias = () => {
    if (!transactionId.trim()) {
      alert("Por favor ingresa un Transaction ID")
      return
    }
    const url = `/gracias?reference=${transactionId.trim()}`
    console.log("🔗 Abriendo URL:", url)
    window.open(url, "_blank")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "rejected":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Simulador de Webhook */}
      <Card className="border-2 border-dashed border-purple-300 bg-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-800">
            <Webhook className="h-5 w-5" />
            <span>🧪 Simulador de Webhook</span>
          </CardTitle>
          <p className="text-sm text-purple-600">Simula las notificaciones que enviaría GetNet en producción</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID</Label>
              <Input
                id="transaction-id"
                placeholder="ORDER-1752883314340-XDT6AL"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Nuevo Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon("approved")}
                      <span>✅ Pago Exitoso (PAGADO)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon("rejected")}
                      <span>❌ Pago Rechazado</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pending">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon("pending")}
                      <span>⏳ Pago Pendiente</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={simularWebhook}
              disabled={loading || !transactionId.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Webhook className="h-4 w-4 mr-2" />
              {loading ? "Simulando..." : "Simular Webhook"}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Resultado Webhook:</span>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "✅ Éxito" : "❌ Error"}
                </Badge>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultor de Estado */}
      <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <RefreshCw className="h-5 w-5" />
            <span>🔍 Consultor de Estado</span>
          </CardTitle>
          <p className="text-sm text-blue-600">Consulta el estado actual del pedido</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={consultarEstado}
              disabled={consultaLoading || !transactionId.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${consultaLoading ? "animate-spin" : ""}`} />
              {consultaLoading ? "Consultando..." : "Consultar Estado"}
            </Button>
            <Button
              onClick={abrirPaginaGracias}
              variant="outline"
              disabled={!transactionId.trim()}
              className="flex-1 bg-transparent"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver Página Gracias
            </Button>
          </div>

          {consultaResult && (
            <div className="mt-4 p-3 bg-white rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Estado Actual:</span>
                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      consultaResult.estado === "pagado"
                        ? "default"
                        : consultaResult.estado === "fallido"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {consultaResult.estado || "Error"}
                  </Badge>
                  {consultaResult.source && <span className="text-xs text-gray-500">({consultaResult.source})</span>}
                </div>
              </div>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(consultaResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Named export for compatibility
export { DebugWebhook }
