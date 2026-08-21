"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface TopProducto {
  codigo: string
  descripcion: string
  cantidad: number
  monto_total: number
  tipo: string
}

interface TopProductosProps {
  data: TopProducto[]
}

export function TopProductos({ data }: TopProductosProps) {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top 5 Productos
        </CardTitle>
        <CardDescription>Productos más solicitados del mes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((producto, index) => (
              <TableRow key={`${producto.codigo}-${index}`}>
                <TableCell>
                  <Badge variant={producto.tipo === "almuerzo" ? "default" : "secondary"} className="text-xs">
                    {producto.tipo === "almuerzo" ? "🍽️ ALM" : "🥪 COL"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{producto.codigo}</span>
                    <span className="text-sm text-muted-foreground">{producto.descripcion}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{producto.cantidad}</TableCell>
                <TableCell className="text-right font-medium">{formatPrice(producto.monto_total)}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hay datos disponibles
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
