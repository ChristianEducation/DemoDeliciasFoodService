"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, ArrowLeft, RefreshCw, User, Mail, Calendar, DollarSign } from "lucide-react"
import { usePaymentStatus } from "@/hooks/usePaymentStatus"
import { formatCurrency } from "@/utils/formatters"

function GraciasContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const orderId = searchParams.get("orderId") || reference // Fallback para URLs antiguas

  const { estado, pedido, loading, error, refetch } = usePaymentStatus(orderId, true)

  const getStatusConfig = (estado: string) => {
    switch (estado) {
      case "pagado":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Pago Exitoso",
          message: "Tu pago ha sido procesado correctamente. Te enviaremos un email de confirmación.",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          textColor: "text-green-800",
          badgeVariant: "default" as const,
        }
      case "fallido":
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
          title: "Pago Rechazado",
          message: "Tu pago no pudo ser procesado. Por favor, intenta nuevamente o contacta a tu banco.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          badgeVariant: "destructive" as const,
        }
      default:
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Pago Pendiente",
          message: "Tu pago está siendo procesado. Te notificaremos cuando esté confirmado.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          badgeVariant: "secondary" as const,
        }
    }
  }

  const statusConfig = getStatusConfig(estado)

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-red-800 mb-2">Error</h1>
            <p className="text-red-600 mb-6">No se encontró el pedido</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Inicio
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Estado del Pago */}
        <Card className={`${statusConfig.borderColor} ${statusConfig.bgColor}`}>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            {statusConfig.icon}
            <h1 className={`text-2xl font-bold ${statusConfig.textColor} mt-4 mb-2`}>{statusConfig.title}</h1>
            <p className={`${statusConfig.textColor} mb-6`}>{statusConfig.message}</p>

            {estado === "pendiente" && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600 mb-4">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span>Consultando estado automáticamente...</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Pedido */}
        {pedido && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Información del Pedido</span>
                <Badge variant={statusConfig.badgeVariant}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">{pedido.nombre_cliente}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{pedido.email_cliente}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha</p>
                    <p className="font-medium">
                      {new Date(pedido.fecha).toLocaleDateString("es-CL", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-medium">{formatCurrency(pedido.total)}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Estado del Pago:</span>
                  <Badge variant={statusConfig.badgeVariant}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>
                </div>
                <div className="flex justify-between items-center text-sm mt-2">
                  <span className="text-gray-500">ID de Transacción:</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{pedido.transaction_id}</code>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1">
            <a href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </a>
          </Button>

          <Button onClick={refetch} variant="outline" disabled={loading} className="flex-1 bg-transparent">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Consultando..." : "Actualizar Estado"}
          </Button>
        </div>

        {/* Próximos pasos */}
        {estado === "pagado" && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <div className="font-medium mb-1">📧 Próximos pasos:</div>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Recibirás un email de confirmación en {pedido?.email_cliente}</li>
                    <li>Los almuerzos se entregarán en las fechas programadas</li>
                    <li>Puedes contactarnos si tienes alguna consulta</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="text-sm text-red-800">
                <div className="font-medium mb-1">⚠️ Error:</div>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function GraciasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <GraciasContent />
    </Suspense>
  )
}
