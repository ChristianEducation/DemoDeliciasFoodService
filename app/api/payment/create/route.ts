import { type NextRequest, NextResponse } from "next/server"
import type { GetNetPaymentRequest, GetNetPaymentResponse } from "@/lib/types-pedidos"
import * as crypto from "crypto"

// Configuración de GetNet
const GETNET_CONFIG = {
  apiUrl: process.env.GETNET_BASE_URL || "https://checkout.getnet.cl",
  testApiUrl: "https://checkout.test.getnet.cl",
  login: process.env.GETNET_LOGIN || "",
  secret: process.env.GETNET_SECRET || "",
  environment: process.env.GETNET_ENVIRONMENT || "test",
}

// Interface para la autenticación de GetNet
interface GetNetAuth {
  login: string
  tranKey: string
  nonce: string
  seed: string
}

// Interface para el request completo de GetNet
interface GetNetWebCheckoutRequest {
  auth: GetNetAuth
  locale: string
  buyer: {
    name: string
    surname: string
    email: string
    document: string
    documentType: string
    mobile: string
  }
  payment: {
    reference: string
    description: string
    amount: {
      currency: string
      total: number
    }
  }
  expiration: string
  ipAddress: string
  userAgent: string
  returnUrl: string
  cancelUrl: string
  notifyUrl: string
}

// Interface para la respuesta de GetNet
interface GetNetSessionResponse {
  status: {
    status: string
    message: string
    reason?: string | number
    date?: string
  }
  requestId?: string
  processUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GetNetPaymentRequest = await request.json()

    console.log("🔄 Creating GetNet Web Checkout session:", body)

    // Validar datos requeridos
    if (!body.amount || !body.orderId || !body.customerEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Datos incompletos: amount, orderId y customerEmail son requeridos",
        },
        { status: 400 },
      )
    }

    // Validar configuración de GetNet
    if (!GETNET_CONFIG.login || !GETNET_CONFIG.secret) {
      console.error("❌ GetNet configuration missing")
      return NextResponse.json(
        {
          success: false,
          error: "Configuración de pago no disponible",
        },
        { status: 500 },
      )
    }

    // Limpiar y validar orderId para GetNet
    let cleanOrderId = body.orderId.replace(/[^a-zA-Z0-9\-_]/g, "").substring(0, 50)
    if (cleanOrderId.length < 5) {
      cleanOrderId = `ORDER-${Date.now()}`
    }

    console.log("🔧 OrderId limpiado:", {
      original: body.orderId,
      clean: cleanOrderId,
      length: cleanOrderId.length,
    })

    // Determinar URL de API según el ambiente
    const baseUrl = GETNET_CONFIG.environment === "production" ? GETNET_CONFIG.apiUrl : GETNET_CONFIG.testApiUrl

    // Extraer nombre y apellido del customerName
    const fullName = body.customerName || body.customerEmail.split("@")[0]
    const nameParts = fullName.split(" ")
    const firstName = nameParts[0] || "Cliente"
    const lastName = nameParts.slice(1).join(" ") || "Usuario"

    // Generar fecha de expiración (15 minutos desde ahora, recomendado por el manual de GetNet)
    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 15)
    const expiration = expirationDate.toISOString()

    // Obtener IP del cliente
    let clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    if (clientIP === "::1" || clientIP === "::ffff:127.0.0.1") {
      clientIP = "127.0.0.1"
    }
    if (clientIP.includes(",")) {
      clientIP = clientIP.split(",")[0].trim()
    }

    // Obtener User Agent
    const userAgent = request.headers.get("user-agent") || "CasinoEscolar/1.0"

    // Generar autenticación
    const auth = generateGetNetAuth(GETNET_CONFIG.login, GETNET_CONFIG.secret)

    // Preparar URLs de retorno
    // Se usa el objeto URL para agregar los parámetros de forma segura, ya que
    // body.returnUrl puede venir con su propio "?" (por ejemplo desde /resumen)
    const baseReturnUrl = body.returnUrl || `${request.nextUrl.origin}/gracias`
    const returnUrlObj = new URL(baseReturnUrl)
    returnUrlObj.searchParams.set("reference", cleanOrderId)
    returnUrlObj.searchParams.set("orderId", cleanOrderId)
    const returnUrlWithParams = returnUrlObj.toString()
    const cancelUrlWithParams = `${request.nextUrl.origin}/resumen?cancelled=true&reference=${cleanOrderId}`

    // Preparar request completo según manual oficial de GetNet
    const checkoutRequest: GetNetWebCheckoutRequest = {
      auth: auth,
      locale: "es_CL",
      buyer: {
        name: firstName,
        surname: lastName,
        email: body.customerEmail,
        document: "11111111-9", // RUT por defecto para testing
        documentType: "CLRUT",
        mobile: "56999999999", // Teléfono por defecto para testing
      },
      payment: {
        reference: cleanOrderId, // Usar orderId limpio
        description: body.description || `Pedido Casino Escolar #${cleanOrderId}`,
        amount: {
          currency: "CLP",
          total: Math.round(body.amount),
        },
      },
      expiration: expiration,
      ipAddress: clientIP,
      userAgent: userAgent,
      returnUrl: returnUrlWithParams,
      cancelUrl: cancelUrlWithParams,
      notifyUrl: body.notifyUrl || `${request.nextUrl.origin}/api/payment/notify`,
    }

    console.log("📤 GetNet Web Checkout request prepared:", {
      ...checkoutRequest,
      auth: {
        login: auth.login,
        tranKey: auth.tranKey.substring(0, 10) + "...",
        nonce: auth.nonce.substring(0, 10) + "...",
        seed: auth.seed,
      },
      endpoint: `${baseUrl}/api/session/`,
    })

    // Llamar a la API de GetNet Web Checkout
    const getNetResponse = await fetch(`${baseUrl}/api/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "CasinoEscolar/1.0",
      },
      body: JSON.stringify(checkoutRequest),
    })

    let getNetData: GetNetSessionResponse
    try {
      getNetData = await getNetResponse.json()
    } catch (parseError) {
      console.error("❌ Error parsing GetNet response:", parseError)
      const responseText = await getNetResponse.text()
      console.error("Raw GetNet response:", responseText)

      return NextResponse.json(
        {
          success: false,
          error: `Error en la respuesta del proveedor de pagos (${getNetResponse.status})`,
        },
        { status: 500 },
      )
    }

    console.log("📥 GetNet Web Checkout API response:", {
      status: getNetResponse.status,
      statusText: getNetResponse.statusText,
      data: getNetData,
    })

    if (!getNetResponse.ok) {
      let errorMessage = "Error del proveedor de pagos"

      if (getNetResponse.status === 404) {
        errorMessage = "Servicio de pagos no disponible temporalmente"
      } else if (getNetResponse.status === 401) {
        const authError = getNetData?.status?.message || "Error de autenticación"
        console.error("❌ GetNet authentication failed:", authError)
        errorMessage = `Error de autenticación: ${authError}`
      } else if (getNetResponse.status === 400) {
        errorMessage = getNetData?.status?.message || "Datos de pago inválidos"
      } else if (getNetData?.status?.message) {
        errorMessage = getNetData.status.message
      }

      throw new Error(`${errorMessage} (${getNetResponse.status})`)
    }

    // Procesar respuesta exitosa de GetNet Web Checkout
    if (getNetData.status?.status === "OK" && getNetData.processUrl) {
      const response: GetNetPaymentResponse = {
        success: true,
        paymentId: getNetData.requestId || cleanOrderId,
        redirectUrl: getNetData.processUrl,
        transactionId: getNetData.requestId,
      }

      console.log("✅ GetNet Web Checkout session created successfully:", response)
      return NextResponse.json(response)
    } else {
      const errorMsg = getNetData.status?.message || "Respuesta inesperada del proveedor de pagos"
      console.error("❌ GetNet Web Checkout failed:", getNetData)
      throw new Error(errorMsg)
    }
  } catch (error) {
    console.error("❌ Error creating GetNet Web Checkout session:", error)

    let errorMessage = "Error interno del servidor"

    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        errorMessage = "No se pudo conectar con el proveedor de pagos"
      } else if (error.message.includes("ENOTFOUND")) {
        errorMessage = "Servicio de pagos no disponible. Verificando configuración..."
      } else if (error.message.includes("404")) {
        errorMessage = "Servicio de pagos no disponible. Por favor, intenta más tarde."
      } else if (error.message.includes("401") || error.message.includes("autenticación")) {
        errorMessage = "Error de configuración del sistema de pagos"
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}

// Generar autenticación según manual de GetNet
function generateGetNetAuth(login: string, secretKey: string): GetNetAuth {
  try {
    // 1. Generar nonce (16 bytes aleatorios)
    const nonceBytes = crypto.randomBytes(16)
    const nonce = nonceBytes.toString("base64")

    // 2. Generar seed (timestamp actual en formato ISO8601)
    const seed = new Date().toISOString()

    // 3. Crear tranKey según documentación de GetNet/PlacetoPay
    const tranKeyInput = Buffer.concat([
      nonceBytes, // nonce como bytes originales (no base64)
      Buffer.from(seed, "utf8"),
      Buffer.from(secretKey, "utf8"),
    ])

    const tranKeyHash = crypto.createHash("sha256").update(tranKeyInput).digest()
    const tranKey = tranKeyHash.toString("base64")

    return {
      login,
      tranKey,
      nonce,
      seed,
    }
  } catch (error) {
    console.error("❌ Error generating GetNet auth:", error)
    throw new Error("Error al generar autenticación de seguridad")
  }
}

// Manejar otros métodos HTTP
export async function GET() {
  return NextResponse.json({ error: "Método no permitido" }, { status: 405 })
}
