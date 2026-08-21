"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PasarelaPago() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Método de Pago</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-500 text-center py-8">Integración con pasarela de pago</p>
        <Button className="w-full">Pagar Ahora</Button>
      </CardContent>
    </Card>
  )
}
