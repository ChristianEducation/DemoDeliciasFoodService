"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { useResumenPedido } from "@/hooks/useResumenPedido"
import { usePedidosSupabase } from "@/hooks/usePedidosSupabase"
import { useUserSession } from "@/hooks/useUserSession"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, User, Calendar, Package, CreditCard, AlertTriangle } from "lucide-react"
import { formatCurrency } from "@/utils/formatters"
import DebugSession from "@/components/DebugSession"

// Función helper para obtener el nombre del día desde una fecha string
const getNombreDia = (fechaString: string): string => {
  const fecha = new Date(fechaString + "T12:00:00") // Agregar hora para evitar problemas de zona horaria
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
  return diasSemana[fecha.getDay()]
}

// Función para formatear fecha correctamente sin problemas de zona horaria
const formatDateCorrect = (fechaString: string): string => {
  const fecha = new Date(fechaString + "T12:00:00") // Agregar hora para evitar problemas de zona horaria
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ]

  const dia = fecha.getDate()
  const mes = meses[fecha.getMonth()]
  const año = fecha.getFullYear()

  return `${dia} de ${mes} de ${año}`
}

export default function ResumenPage() {
  const router = useRouter()
  const { session } = useUserSession()
  const { resumen, loading, error, refetch } = useResumenPedido()
  const { crearPedido, loading: creandoPedido, error: errorPedido } = usePedidosSupabase()

  const [email, setEmail] = useState("")
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [redirigiendoPago, setRedirigiendoPago] = useState(false)

  // Descuento de créditos
  const [creditosDisponibles, setCreditosDisponibles] = useState(0)
  const [estudianteCreditoId, setEstudianteCreditoId] = useState<string | null>(null)
  const [precioUnitarioAlmuerzo, setPrecioUnitarioAlmuerzo] = useState(0)

  useEffect(() => {
    // Si no hay datos, redirigir al inicio
    if (!loading && !resumen && !error) {
      router.push("/")
    }
  }, [loading, resumen, error, router])

  useEffect(() => {
    async function loadCreditos() {
      if (!resumen || !resumen.destinatarios || resumen.destinatarios.length === 0) return

      const primerEstudiante = resumen.destinatarios.find((d) => d.tipo === "estudiante")
      if (!primerEstudiante) return

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("estudiantes")
          .select("id, creditos_disponibles")
          .eq("id", primerEstudiante.id)
          .single()

        if (!error && data) {
          setCreditosDisponibles(data.creditos_disponibles ?? 0)
          setEstudianteCreditoId(data.id)
        }
      } catch (err) {
        console.error("Error loading student credits", err)
      }

      // Calcular precio unitario del primer almuerzo
      let foundPrice = 0
      for (const dest of resumen.destinatarios) {
        for (const dia of dest.dias) {
          for (const item of dia.items) {
            if (item.tipo === "almuerzo") {
              foundPrice = item.precioUnitario
              break
            }
          }
          if (foundPrice) break
        }
        if (foundPrice) break
      }
      setPrecioUnitarioAlmuerzo(foundPrice)
    }

    loadCreditos()
  }, [resumen])

  // Cálculos de descuento
  const cantidadAlmuerzos = resumen?.totales?.almuerzos ?? 0
  const creditosAUsar = Math.min(creditosDisponibles, cantidadAlmuerzos)
  const descuentoTotal = creditosAUsar * precioUnitarioAlmuerzo
  const totalConDescuento = (resumen?.totales?.totalPrecio ?? 0) - descuentoTotal

  const handleVolver = () => {
    router.push("/colaciones")
  }

  // Función para determinar el tipo específico de cliente y obtener datos
  const obtenerDatosCliente = () => {
    // Leer datos específicos del localStorage
    const funcionarioSeleccionado = localStorage.getItem("funcionarioSeleccionado")
    const funcionarioConHijosSeleccionado = localStorage.getItem("funcionarioConHijosSeleccionado")
    const destinatariosSeleccionados = localStorage.getItem("destinatariosSeleccionados")

    let tipoCliente: "apoderado" | "funcionario-sin-hijos" | "funcionario-con-hijos" = "apoderado"
    let datosEspecificos = null

    if (funcionarioSeleccionado) {
      tipoCliente = "funcionario-sin-hijos"
      datosEspecificos = JSON.parse(funcionarioSeleccionado)
    } else if (funcionarioConHijosSeleccionado) {
      tipoCliente = "funcionario-con-hijos"
      datosEspecificos = JSON.parse(funcionarioConHijosSeleccionado)
    } else if (destinatariosSeleccionados) {
      tipoCliente = "apoderado"
      datosEspecificos = JSON.parse(destinatariosSeleccionados)
    }

    return { tipoCliente, datosEspecificos }
  }

  // Función principal de GetNet
  const handleProcederPagoGetNet = async () => {
    if (!resumen || !email.trim()) {
      alert("Por favor ingresa tu email")
      return
    }

    // Validar que hay al menos algo seleccionado
    if (resumen.totales.totalItems === 0) {
      alert("Debes seleccionar al menos un almuerzo o colación para continuar")
      return
    }

    setProcesandoPago(true)

    try {
      console.log("🚀 Iniciando proceso de pago GetNet...")
      console.log("📊 Resumen a enviar:", resumen)
      console.log("📧 Email:", email.trim())

      // Obtener datos específicos del cliente
      const { tipoCliente, datosEspecificos } = obtenerDatosCliente()

      console.log("👤 Tipo cliente determinado:", tipoCliente)
      console.log("📋 Datos específicos:", datosEspecificos)

      // 1. Crear pedido en Supabase con datos específicos
      const orderId = await crearPedido(
        resumen,
        email.trim(),
        tipoCliente,
        datosEspecificos,
        descuentoTotal,
        creditosAUsar,
        estudianteCreditoId,
      )

      if (!orderId) {
        const errorMsg = errorPedido || "No se pudo crear el pedido"
        console.error("❌ Error creando pedido:", errorMsg)
        throw new Error(errorMsg)
      }

      console.log("✅ Pedido creado con ID:", orderId)

      // 2. Crear sesión de pago con GetNet
      const paymentResponse = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          customerEmail: email.trim(),
          customerName: resumen.destinatarios[0]?.nombre || "Cliente",
          amount: totalConDescuento,
          description: `Pedido Casino Escolar - ${resumen.totales.totalItems} items`,
          returnUrl: `${window.location.origin}/gracias?reference=${orderId}`,
          notifyUrl: `${window.location.origin}/api/payment/notify`,
        }),
      })

      const paymentData = await paymentResponse.json()

      if (paymentData.success && paymentData.redirectUrl) {
        console.log("✅ Redirigiendo a GetNet:", paymentData.redirectUrl)

        // Avisar al apoderado antes de salir de la página para que no cierre
        // ni reintente pensando que no funcionó
        setRedirigiendoPago(true)

        // Limpiar localStorage antes de ir al pago
        localStorage.removeItem("carritoAlmuerzos")
        localStorage.removeItem("carritoColaciones")
        localStorage.removeItem("funcionarioSeleccionado")
        localStorage.removeItem("funcionarioConHijosSeleccionado")
        localStorage.removeItem("destinatariosSeleccionados")

        // Redirigir a GetNet
        window.location.href = paymentData.redirectUrl
      } else {
        throw new Error(paymentData.error || "Error creando sesión de pago")
      }
    } catch (error) {
      console.error("❌ Error en proceso de pago:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setProcesandoPago(false)
    }
  }

  // Función alternativa de WebPay
  const handlePagoWebPay = async () => {
    if (!resumen || !email.trim()) {
      alert("Por favor ingresa tu email")
      return
    }

    // Validar que hay al menos algo seleccionado
    if (resumen.totales.totalItems === 0) {
      alert("Debes seleccionar al menos un almuerzo o colación para continuar")
      return
    }

    setProcesandoPago(true)

    try {
      console.log("🚀 Iniciando proceso de pago WebPay...")
      console.log("📊 Resumen a enviar:", resumen)
      console.log("📧 Email:", email.trim())
      console.log("💰 Monto:", totalConDescuento)

      // Obtener datos específicos del cliente
      const { tipoCliente, datosEspecificos } = obtenerDatosCliente()

      console.log("👤 Tipo cliente determinado:", tipoCliente)

      // 1. Crear pedido en Supabase (igual que GetNet)
      const orderId = await crearPedido(
        resumen,
        email.trim(),
        tipoCliente,
        datosEspecificos,
        descuentoTotal,
        creditosAUsar,
        estudianteCreditoId,
      )

      if (!orderId) {
        const errorMsg = errorPedido || "No se pudo crear el pedido"
        console.error("❌ Error creando pedido:", errorMsg)
        throw new Error(errorMsg)
      }

      console.log("✅ Pedido creado con ID:", orderId)

      // 2. Limpiar localStorage antes de ir al pago
      localStorage.removeItem("carritoAlmuerzos")
      localStorage.removeItem("carritoColaciones")
      localStorage.removeItem("funcionarioSeleccionado")
      localStorage.removeItem("funcionarioConHijosSeleccionado")
      localStorage.removeItem("destinatariosSeleccionados")

      // 3. Crear formulario WebPay dinámicamente
      const form = document.createElement("form")
      form.name = "webpay_form"
      form.method = "post"
      form.action = "https://www.webpay.cl/backpub/external/form-pay"

      // Campo idFormulario (fijo)
      const idFormularioInput = document.createElement("input")
      idFormularioInput.type = "hidden"
      idFormularioInput.name = "idFormulario"
      idFormularioInput.value = "281171"

      // Campo monto (dinámico)
      const montoInput = document.createElement("input")
      montoInput.type = "hidden"
      montoInput.name = "monto"
      montoInput.value = totalConDescuento.toString()

      // Agregar campos al formulario
      form.appendChild(idFormularioInput)
      form.appendChild(montoInput)

      // Agregar formulario al DOM temporalmente
      document.body.appendChild(form)

      console.log("✅ Redirigiendo a WebPay con monto:", totalConDescuento)

      // Submit automático
      form.submit()

      // Remover formulario del DOM
      document.body.removeChild(form)
    } catch (error) {
      console.error("❌ Error en proceso de pago WebPay:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setProcesandoPago(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resumen del pedido...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <AlertTriangle className="text-amber-500 text-6xl mb-4" />
            <h1 className="text-xl font-bold text-amber-600 mb-2">Sin selecciones</h1>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleVolver} variant="outline">
                Volver
              </Button>
              <Button onClick={() => router.push("/almuerzos")}>Seleccionar Almuerzos</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!resumen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-red-600 mb-2">Error</h1>
            <p className="text-gray-600 text-center mb-4">No se pudo cargar el resumen</p>
            <Button onClick={handleVolver}>Volver</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6 sm:mb-8">
            <Button variant="ghost" onClick={handleVolver} className="mr-4 text-gray-600">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Resumen del Pedido</h1>
              <p className="text-gray-600 mt-1">Revisa tu pedido antes de proceder al pago</p>
            </div>
          </div>

          {/* Debug Session */}
          <DebugSession />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Contenido principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Destinatarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Destinatarios ({resumen.destinatarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {resumen.destinatarios.map((destinatario) => (
                      <div
                        key={destinatario.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{destinatario.nombre}</p>
                            <p className="text-sm text-gray-500 capitalize">{destinatario.tipo}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-600">{formatCurrency(destinatario.totalDestinatario)}</p>
                          <p className="text-xs text-gray-500">
                            {destinatario.dias.reduce((total, dia) => total + dia.items.length, 0)} items
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detalle por días */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Detalle por Días
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resumen.destinatarios.map((destinatario) =>
                      destinatario.dias.map((dia) => (
                        <div key={`${destinatario.id}-${dia.fecha}`} className="border-l-4 border-blue-500 pl-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{destinatario.nombre}</h4>
                              <p className="text-sm text-gray-500">
                                {getNombreDia(dia.fecha)}, {formatDateCorrect(dia.fecha)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-600">{formatCurrency(dia.totalDia)}</p>
                              <p className="text-xs text-gray-500">{dia.items.length} items</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            {dia.items.map((item, index) => (
                              <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.tipo}
                                  </Badge>
                                  <span>{item.codigo}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">{item.cantidad}x</span>
                                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resumen de totales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Resumen
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Almuerzos:</span>
                      <span>{resumen.totales.almuerzos}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Colaciones:</span>
                      <span>{resumen.totales.colaciones}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total items:</span>
                      <span>{resumen.totales.totalItems}</span>
                    </div>
                    <Separator />
                    {descuentoTotal > 0 && (
                      <div className="flex justify-between font-bold text-md text-amber-600">
                        <span>Crédito ({creditosAUsar} almuerzo{creditosAUsar !== 1 ? "s" : ""}):</span>
                        <span>-{formatCurrency(descuentoTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total a pagar:</span>
                      <span className="text-green-600">{formatCurrency(totalConDescuento)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulario de pago */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Información de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email para confirmación *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Botón principal GetNet */}
                  <Button
                    onClick={handleProcederPagoGetNet}
                    disabled={
                      !email.trim() ||
                      procesandoPago ||
                      creandoPedido ||
                      redirigiendoPago ||
                      resumen.totales.totalItems === 0
                    }
                    className="w-full"
                    size="lg"
                  >
                    {redirigiendoPago ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Abriendo pasarela de pago...
                      </div>
                    ) : procesandoPago || creandoPedido ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {creandoPedido ? "Creando pedido..." : "Procesando..."}
                      </div>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar con GetNet - {formatCurrency(totalConDescuento)}
                      </>
                    )}
                  </Button>

                  {redirigiendoPago && (
                    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-center">
                      Te estamos llevando a la pasarela de pago de GetNet. Esto puede demorar unos segundos —
                      no cierres ni recargues esta pantalla.
                    </p>
                  )}

                  {resumen.totales.totalItems === 0 && (
                    <p className="text-xs text-amber-600 text-center">
                      Debes seleccionar al menos un item para continuar
                    </p>
                  )}

                  <p className="text-xs text-gray-500 text-center">
                    Serás redirigido a GetNet para completar el pago seguro
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
