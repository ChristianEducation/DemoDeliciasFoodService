"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PedidoResumen() {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Resumen del Pedido</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-500 text-center py-4">No hay items seleccionados</p>
          <div className="border-t pt-4">
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>$0</span>
            </div>
          </div>
          <Button className="w-full" disabled>
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
