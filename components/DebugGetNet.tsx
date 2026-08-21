"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Settings, AlertTriangle } from "lucide-react"

export default function DebugGetNet() {
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [authTests, setAuthTests] = useState<any[]>([])

  if (process.env.NODE_ENV !== "development") return null

  const testGetNetConnection = async () => {
    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: `test-${Date.now()}`,
          customerEmail: "test@example.com",
          customerName: "Usuario Test",
          amount: 1000,
          description: "Test de conexión GetNet",
          returnUrl: `${window.location.origin}/gracias`,
          notifyUrl: `${window.location.origin}/api/payment/notify`,
        }),
      })

      const data = await response.json()
      setTestResult({
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setLoading(false)
    }
  }

  const testAuthMethods = async () => {
    setLoading(true)
    setAuthTests([])

    // Simular diferentes métodos de autenticación
    const methods = [
      { name: "Método 1: nonce_bytes + seed + secret", id: "method1" },
      { name: "Método 2: nonce_string + seed + secret", id: "method2" },
      { name: "Método 3: seed + nonce + secret", id: "method3" },
    ]

    const results = []
    for (const method of methods) {
      try {
        const response = await fetch("/api/payment/test-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: method.id,
            orderId: `auth-test-${Date.now()}`,
          }),
        })

        const data = await response.json()
        results.push({
          method: method.name,
          success: response.ok,
          data,
        })
      } catch (error) {
        results.push({
          method: method.name,
          success: false,
          error: error instanceof Error ? error.message : "Error",
        })
      }
    }

    setAuthTests(results)
    setLoading(false)
  }

  return (
    <Card className="mb-6 bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <Settings className="h-5 w-5" />
          <span>Debug GetNet - Autenticación</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-yellow-700">
          <p className="mb-2">
            <strong>Estado actual:</strong>
          </p>
          <ul className="space-y-1 text-xs">
            <li>• Login: integraciones</li>
            <li>• Secret: ****</li>
            <li>• Environment: test</li>
            <li>• URL: https://checkout.test.getnet.cl</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={testGetNetConnection} disabled={loading} size="sm" variant="outline">
            {loading ? "Probando..." : "Probar Conexión"}
          </Button>
          <Button onClick={testAuthMethods} disabled={loading} size="sm" variant="outline">
            {loading ? "Probando..." : "Probar Métodos Auth"}
          </Button>
        </div>

        {testResult && (
          <div className="mt-4 p-3 rounded-lg bg-white border">
            <div className="flex items-center space-x-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? "Éxito" : "Error"}
              </Badge>
              <span className="text-xs text-gray-500">Status: {testResult.status}</span>
            </div>

            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(testResult, null, 2)}
            </pre>

            {testResult.success && testResult.data?.redirectUrl && (
              <div className="mt-2">
                <p className="text-xs text-green-700 mb-1">✅ URL de pago generada correctamente</p>
                <a
                  href={testResult.data.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline break-all"
                >
                  {testResult.data.redirectUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {authTests.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium text-yellow-800">Resultados de Métodos de Autenticación:</h4>
            {authTests.map((test, index) => (
              <div key={index} className="p-2 bg-white rounded border text-xs">
                <div className="flex items-center space-x-2 mb-1">
                  {test.success ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-600" />
                  )}
                  <span className="font-medium">{test.method}</span>
                </div>
                <pre className="text-xs bg-gray-50 p-1 rounded overflow-auto max-h-20">
                  {JSON.stringify(test.success ? test.data : test.error, null, 1)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
            <div className="text-xs text-orange-700">
              <p className="font-medium mb-1">Posibles causas del error 401:</p>
              <ul className="space-y-1">
                <li>• Formato incorrecto del tranKey</li>
                <li>• Orden incorrecto en la concatenación</li>
                <li>• Codificación incorrecta del nonce</li>
                <li>• Formato de fecha/seed incorrecto</li>
                <li>• Credenciales incorrectas</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
