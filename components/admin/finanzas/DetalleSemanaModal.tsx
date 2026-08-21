"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileDown, Search } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface PedidoFinanzas {
  id: number
  created_at: string
  total: number
  estado_pago: string
  email_usuario?: string
  nombre_funcionario?: string
  transaction_id?: string
}

interface Totales {
  pagado: { monto: number; cantidad: number }
  fmd: { monto: number; cantidad: number }
  pgc: { monto: number; cantidad: number }
  total: { monto: number; cantidad: number }
}

interface DetalleSemanaModalProps {
  abierto: boolean
  onCerrar: () => void
  nombreSemana: string
  pedidos: PedidoFinanzas[]
  totales: Totales
  onExportar: () => void
}

export function DetalleSemanaModal({
  abierto,
  onCerrar,
  nombreSemana,
  pedidos,
  totales,
  onExportar,
}: DetalleSemanaModalProps) {
  const [busqueda, setBusqueda] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos")

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const cumpleBusqueda =
      pedido.nombre_funcionario?.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.email_usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.id.toString().includes(busqueda)

    const cumpleEstado = estadoFiltro === "todos" || pedido.estado_pago.toLowerCase() === estadoFiltro.toLowerCase()

    return cumpleBusqueda && cumpleEstado
  })

  const formatearMonto = (monto: number) => {
    return `$${monto.toLocaleString("es-CL")}`
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
    })
  }

  return (
    <Dialog open={abierto} onOpenChange={onCerrar}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detalle: {nombreSemana}</DialogTitle>
          <DialogDescription>
            Total: {formatearMonto(totales.total.monto)} ({totales.total.cantidad} pedidos)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o ID..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <label className="text-sm font-medium mb-2 block">Estado</label>
              <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="fmd">FMD</SelectItem>
                  <SelectItem value="pgc">PGC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={onExportar} variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar semana
            </Button>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No se encontraron pedidos
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidosFiltrados.map((pedido) => (
                    <TableRow key={pedido.id}>
                      <TableCell>{formatearFecha(pedido.created_at)}</TableCell>
                      <TableCell className="font-medium">{pedido.nombre_funcionario || "N/A"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pedido.email_usuario || "N/A"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            pedido.estado_pago === "pagado"
                              ? "bg-green-100 text-green-700"
                              : pedido.estado_pago === "FMD"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {pedido.estado_pago}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatearMonto(pedido.total)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{pedido.transaction_id || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Resumen:</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Pagado:</span>
                <p className="font-medium">
                  {formatearMonto(totales.pagado.monto)} ({totales.pagado.cantidad} pedidos)
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">FMD:</span>
                <p className="font-medium">
                  {formatearMonto(totales.fmd.monto)} ({totales.fmd.cantidad} pedidos)
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">PGC:</span>
                <p className="font-medium">
                  {formatearMonto(totales.pgc.monto)} ({totales.pgc.cantidad} pedidos)
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={onCerrar} variant="outline">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
