import { type NextRequest, NextResponse } from "next/server"
import * as crypto from "crypto"

const GETNET_CONFIG = {
  testApiUrl: "https://checkout.test.getnet.cl",
  login: process.env.GETNET_LOGIN || "",
  secret: process.env.GETNET_SECRET || "",
}

interface GetNetAuth {
  login: string
  tranKey: string
  nonce: string
  seed: string
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 })
  }

  try {
    const { method, orderId } = await request.json()

    console.log(`🧪 Testing auth method: ${method}`)

    let auth: GetNetAuth

    switch (method) {
      case "method1":
        auth = generateAuthMethod1(GETNET_CONFIG.login, GETNET_CONFIG.secret)
        break
      case "method2":
        auth = generateAuthMethod2(GETNET_CONFIG.login, GETNET_CONFIG.secret)
        break
      case "method3":
        auth = generateAuthMethod3(GETNET_CONFIG.login, GETNET_CONFIG.secret)
        break
      default:
        auth = generateAuthMethod1(GETNET_CONFIG.login, GETNET_CONFIG.secret)
    }

    // Crear un request mínimo para probar solo la autenticación
    const testRequest = {
      auth: auth,
      locale: "es_CL",
      buyer: {
        name: "Test",
        surname: "User",
        email: "test@example.com",
        document: "11111111-9",
        documentType: "CLRUT",
        mobile: "56999999999",
      },
      payment: {
        reference: orderId,
        description: `Test auth ${method}`,
        amount: {
          currency: "CLP",
          total: 1000,
        },
      },
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      ipAddress: "127.0.0.1",
      userAgent: "TestAgent/1.0",
      returnUrl: "https://example.com/return",
      cancelUrl: "https://example.com/cancel",
      notifyUrl: "https://example.com/notify",
    }

    console.log(`📤 Testing ${method} with auth:`, {
      login: auth.login,
      nonce: auth.nonce.substring(0, 10) + "...",
      seed: auth.seed,
      tranKey: auth.tranKey.substring(0, 10) + "...",
    })

    const response = await fetch(`${GETNET_CONFIG.testApiUrl}/api/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(testRequest),
    })

    const data = await response.json()

    return NextResponse.json({
      method,
      success: response.ok,
      status: response.status,
      auth: {
        login: auth.login,
        nonceLength: auth.nonce.length,
        seedFormat: auth.seed,
        tranKeyLength: auth.tranKey.length,
      },
      response: data,
    })
  } catch (error) {
    console.error(`❌ Error testing auth method:`, error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Método 1: nonce_bytes + seed + secret
function generateAuthMethod1(login: string, secretKey: string): GetNetAuth {
  const nonceBytes = crypto.randomBytes(16)
  const nonce = nonceBytes.toString("base64")
  const seed = new Date().toISOString()

  const tranKeyInput = Buffer.concat([nonceBytes, Buffer.from(seed, "utf8"), Buffer.from(secretKey, "utf8")])

  const tranKeyHash = crypto.createHash("sha256").update(tranKeyInput).digest()
  const tranKey = tranKeyHash.toString("base64")

  return { login, tranKey, nonce, seed }
}

// Método 2: nonce_string + seed + secret
function generateAuthMethod2(login: string, secretKey: string): GetNetAuth {
  const nonceBytes = crypto.randomBytes(16)
  const nonce = nonceBytes.toString("base64")
  const seed = new Date().toISOString()

  const tranKeyString = nonce + seed + secretKey
  const tranKeyHash = crypto.createHash("sha256").update(tranKeyString, "utf8").digest()
  const tranKey = tranKeyHash.toString("base64")

  return { login, tranKey, nonce, seed }
}

// Método 3: seed + nonce + secret (orden diferente)
function generateAuthMethod3(login: string, secretKey: string): GetNetAuth {
  const nonceBytes = crypto.randomBytes(16)
  const nonce = nonceBytes.toString("base64")
  const seed = new Date().toISOString()

  const tranKeyString = seed + nonce + secretKey
  const tranKeyHash = crypto.createHash("sha256").update(tranKeyString, "utf8").digest()
  const tranKey = tranKeyHash.toString("base64")

  return { login, tranKey, nonce, seed }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
