"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function ConfirmacionPedido() {
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Número de pedido: #12345</p>
          <p className="text-gray-500">Fecha: {new Date().toLocaleDateString()}</p>
        </CardContent>
      </Card>

      <Button className="w-full">Realizar Nuevo Pedido</Button>
    </div>
  )
}
