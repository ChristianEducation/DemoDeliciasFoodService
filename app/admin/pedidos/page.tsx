"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ShoppingCart,
  Download,
  Search,
  Eye,
  Filter,
  Plus,
  Edit,
  Trash2,
  Save,
  Mail,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Calendar,
} from "lucide-react"

interface Pedido {
  id: string
  nombre_cliente: string
  email_cliente?: string
  tipo_cliente: string
  total: number
  estado_pago: string
  transaction_id?: string
  observaciones?: string
  created_at: string
  updated_at?: string
}

interface PedidoItem {
  id: string
  pedido_id: string
  destinatario: string
  tipo_destinatario: string
  nivel?: string
  curso?: string
  fecha: string
  tipo: string
  codigo: string
  descripcion: string
  categoria?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  opcion?: string
  casino?: string
  created_at: string
}

interface Estadisticas {
  total: number
  pagados: number
  fmd: number
  pgc: number
  pendientes: number
  cancelados: number
  fallidos: number
  tasaExito: number
}

interface NuevoPedido {
  nombre_cliente: string
  email_cliente: string
  tipo_cliente: string
  observaciones: string
}

export default function AdminPedidos() {
  // Estados para estadísticas
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    total: 0,
    pagados: 0,
    fmd: 0,
    pgc: 0,
    pendientes: 0,
    cancelados: 0,
    fallidos: 0,
    tasaExito: 0,
  })
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true)

  // Estados para lista de pedidos (con paginación)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPedidos, setTotalPedidos] = useState(0)
  const [registrosPorPagina] = useState(50)
  const [cargandoPedidos, setCargandoPedidos] = useState(true)

  // Estados para filtros de búsqueda
  const [filtroTexto, setFiltroTexto] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  // Estados para detalle de pedido
  const [itemsDetalle, setItemsDetalle] = useState<PedidoItem[]>([])
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [editandoPedido, setEditandoPedido] = useState(false)

  // Estados para edición de items
  const [editItemOpen, setEditItemOpen] = useState(false)
  const [itemEnEdicion, setItemEnEdicion] = useState<PedidoItem | null>(null)

  // Estados para nuevo pedido
  const [mostrarNuevoPedido, setMostrarNuevoPedido] = useState(false)
  const [nuevoPedido, setNuevoPedido] = useState<NuevoPedido>({
    nombre_cliente: "",
    email_cliente: "",
    tipo_cliente: "",
    observaciones: "",
  })

  // Estados para exportación mensual
  const [modalExportMesOpen, setModalExportMesOpen] = useState(false)
  const [mesExport, setMesExport] = useState("")
  const [anioExport, setAnioExport] = useState("")
  const [cargandoExport, setCargandoExport] = useState(false)

  const supabase = createClient()

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    setCargandoEstadisticas(true)
    try {
      // Total de pedidos
      const { count: total } = await supabase.from("pedidos").select("*", { count: "exact", head: true })

      // Pagados
      const { count: pagados } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "pagado")

      // FMD
      const { count: fmd } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "FMD")

      // PGC
      const { count: pgc } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "PGC")

      // Pendientes
      const { count: pendientes } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "pendiente")

      // Cancelados
      const { count: cancelados } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "cancelado")

      // Fallidos
      const { count: fallidos } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true })
        .eq("estado_pago", "fallido")

      // Calcular tasa de éxito
      const totalPedidos = total || 0
      const pedidosPagados = pagados || 0
      const tasaExito = totalPedidos > 0 ? (pedidosPagados / totalPedidos) * 100 : 0

      setEstadisticas({
        total: totalPedidos,
        pagados: pedidosPagados,
        fmd: fmd || 0,
        pgc: pgc || 0,
        pendientes: pendientes || 0,
        cancelados: cancelados || 0,
        fallidos: fallidos || 0,
        tasaExito,
      })
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    } finally {
      setCargandoEstadisticas(false)
    }
  }

  // Cargar pedidos con paginación y filtros
  const cargarPedidos = async (pagina = 1) => {
    setCargandoPedidos(true)
    try {
      let query = supabase.from("pedidos").select("*", { count: "exact" }).order("created_at", { ascending: false })

      // Aplicar filtros
      if (filtroTexto) {
        query = query.or(`nombre_cliente.ilike.%${filtroTexto}%,email_cliente.ilike.%${filtroTexto}%`)
      }

      if (filtroEstado !== "todos") {
        query = query.eq("estado_pago", filtroEstado)
      }

      if (filtroTipo !== "todos") {
        query = query.eq("tipo_cliente", filtroTipo)
      }

      if (fechaDesde) {
        query = query.gte("created_at", fechaDesde)
      }

      if (fechaHasta) {
        query = query.lte("created_at", fechaHasta + "T23:59:59")
      }

      // Aplicar paginación
      const desde = (pagina - 1) * registrosPorPagina
      const hasta = desde + registrosPorPagina - 1
      query = query.range(desde, hasta)

      const { data, error, count } = await query

      if (error) throw error

      setPedidos(data || [])
      setTotalPedidos(count || 0)
    } catch (error) {
      console.error("Error cargando pedidos:", error)
    } finally {
      setCargandoPedidos(false)
    }
  }

  // Cargar al montar el componente
  useEffect(() => {
    cargarEstadisticas()
    cargarPedidos(1)
  }, [])

  // Manejar aplicación de filtros
  const handleAplicarFiltros = () => {
    setPaginaActual(1)
    cargarPedidos(1)
  }

  // Limpiar filtros
  const handleLimpiarFiltros = () => {
    setFiltroTexto("")
    setFiltroEstado("todos")
    setFiltroTipo("todos")
    setFechaDesde("")
    setFechaHasta("")
    setPaginaActual(1)
    cargarPedidos(1)
  }

  // Cambiar página
  const handleCambiarPagina = (nuevaPagina: number) => {
    setPaginaActual(nuevaPagina)
    cargarPedidos(nuevaPagina)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Cargar detalle del pedido
  const cargarDetallePedido = async (pedido: Pedido) => {
    setLoadingDetalle(true)
    setPedidoSeleccionado(pedido)

    try {
      const { data, error } = await supabase
        .from("pedidos_item")
        .select("*")
        .eq("pedido_id", pedido.id)
        .order("fecha", { ascending: true })

      if (error) throw error

      setItemsDetalle(data || [])
    } catch (error) {
      console.error("Error cargando detalle:", error)
    } finally {
      setLoadingDetalle(false)
    }
  }

  // Abrir editor de item
  const abrirEditorItem = (item: PedidoItem) => {
    const precio = typeof item.precio_unitario === "number" ? item.precio_unitario : 0
    const cantidad = typeof item.cantidad === "number" ? item.cantidad : 1
    setItemEnEdicion({ ...item, precio_unitario: precio, cantidad })
    setEditItemOpen(true)
  }

  // Cambiar campo de item
  const cambiarCampoItem = (campo: keyof PedidoItem, valor: any) => {
    setItemEnEdicion((prev) => (prev ? { ...prev, [campo]: valor } : prev))
  }

  // Guardar item editado
  const guardarItemEditado = async () => {
    if (!itemEnEdicion) return

    const cantidad = Number(itemEnEdicion.cantidad || 0)
    const precio = Number(itemEnEdicion.precio_unitario || 0)
    const nuevoSubtotal = cantidad * precio

    try {
      const { data, error } = await supabase
        .from("pedidos_item")
        .update({
          destinatario: itemEnEdicion.destinatario,
          tipo_destinatario: itemEnEdicion.tipo_destinatario,
          nivel: itemEnEdicion.nivel ?? null,
          curso: itemEnEdicion.curso ?? null,
          fecha: itemEnEdicion.fecha,
          tipo: itemEnEdicion.tipo,
          codigo: itemEnEdicion.codigo,
          descripcion: itemEnEdicion.descripcion,
          categoria: itemEnEdicion.categoria ?? null,
          cantidad,
          precio_unitario: precio,
          subtotal: nuevoSubtotal,
        })
        .eq("id", itemEnEdicion.id)
        .select()
        .single()

      if (error) {
        console.error("Error actualizando item:", error)
        alert("Error al actualizar el item: " + error.message)
        return
      }

      setItemsDetalle((prev) => prev.map((it) => (it.id === itemEnEdicion.id ? (data as any) : it)))
      setEditItemOpen(false)
      setItemEnEdicion(null)
      alert("Item actualizado correctamente")
    } catch (e) {
      console.error("Error inesperado al actualizar item:", e)
      alert("Error inesperado al actualizar el item")
    }
  }

  // Eliminar item del pedido
  const eliminarItemPedido = async (itemId: string) => {
    if (!confirm("¿Estás seguro de eliminar este item? Esta acción no se puede deshacer.")) return
    try {
      const { error } = await supabase.from("pedidos_item").delete().eq("id", itemId)
      if (error) {
        console.error("Error eliminando item:", error)
        alert("Error al eliminar el item: " + error.message)
        return
      }
      setItemsDetalle((prev) => prev.filter((it) => it.id !== itemId))
      alert("Item eliminado correctamente")
    } catch (e) {
      console.error("Error inesperado al eliminar item:", e)
      alert("Error inesperado al eliminar el item")
    }
  }

  // Actualizar pedido
  const actualizarPedido = async (pedidoActualizado: Pedido) => {
    try {
      const { error } = await supabase
        .from("pedidos")
        .update({
          nombre_cliente: pedidoActualizado.nombre_cliente,
          email_cliente: pedidoActualizado.email_cliente,
          estado_pago: pedidoActualizado.estado_pago,
          observaciones: pedidoActualizado.observaciones,
        })
        .eq("id", pedidoActualizado.id)

      if (error) {
        console.error("Error de Supabase:", error)
        alert("Error al actualizar el pedido: " + error.message)
        return
      }

      // Recargar pedidos y estadísticas
      cargarPedidos(paginaActual)
      cargarEstadisticas()

      setPedidoSeleccionado(pedidoActualizado)
      setEditandoPedido(false)

      alert("Pedido actualizado correctamente")
    } catch (error) {
      console.error("Error actualizando pedido:", error)
      alert("Error inesperado al actualizar el pedido")
    }
  }

  // Eliminar pedido
  const eliminarPedido = async (pedidoId: string) => {
    if (!confirm("¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.")) {
      return
    }

    try {
      // Primero eliminar items
      await supabase.from("pedidos_item").delete().eq("pedido_id", pedidoId)

      // Luego eliminar pedido
      const { error } = await supabase.from("pedidos").delete().eq("id", pedidoId)

      if (error) throw error

      // Recargar pedidos y estadísticas
      cargarPedidos(paginaActual)
      cargarEstadisticas()

      alert("Pedido eliminado correctamente")
    } catch (error) {
      console.error("Error eliminando pedido:", error)
      alert("Error al eliminar el pedido")
    }
  }

  // Crear nuevo pedido
  const crearNuevoPedido = async () => {
    if (!nuevoPedido.nombre_cliente || !nuevoPedido.tipo_cliente) {
      alert("Por favor completa los campos obligatorios")
      return
    }

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .insert([
          {
            nombre_cliente: nuevoPedido.nombre_cliente,
            email_cliente: nuevoPedido.email_cliente,
            tipo_cliente: nuevoPedido.tipo_cliente,
            observaciones: nuevoPedido.observaciones,
            total: 0,
            estado_pago: "pendiente",
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Recargar pedidos y estadísticas
      cargarPedidos(1)
      cargarEstadisticas()
      setPaginaActual(1)

      // Limpiar formulario
      setNuevoPedido({
        nombre_cliente: "",
        email_cliente: "",
        tipo_cliente: "",
        observaciones: "",
      })

      setMostrarNuevoPedido(false)
      alert("Pedido creado correctamente")
    } catch (error) {
      console.error("Error creando pedido:", error)
      alert("Error al crear el pedido")
    }
  }

  // Exportar histórico completo
  const exportarHistoricoCompleto = async () => {
    setCargandoExport(true)
    try {
      // Importar xlsx dinámicamente
      const XLSX = await import("xlsx")

      // Obtener TODOS los items ordenados por fecha
      const { data: todosLosItems, error } = await supabase
        .from("pedidos_item")
        .select("*")
        .order("fecha", { ascending: true })

      if (error) throw error

      if (!todosLosItems || todosLosItems.length === 0) {
        alert("No hay datos para exportar")
        setCargandoExport(false)
        return
      }

      // Agrupar items por mes usando la columna 'fecha'
      const itemsPorMes = todosLosItems.reduce(
        (acc, item) => {
          const mesKey = item.fecha.substring(0, 7) // "2024-10-15" → "2024-10"
          if (!acc[mesKey]) {
            acc[mesKey] = []
          }
          acc[mesKey].push(item)
          return acc
        },
        {} as Record<string, typeof todosLosItems>,
      )

      // Crear workbook
      const wb = XLSX.utils.book_new()

      // Obtener meses ordenados
      const mesesOrdenados = Object.keys(itemsPorMes).sort()

      // Crear una hoja por cada mes
      mesesOrdenados.forEach((mesKey) => {
        const items = itemsPorMes[mesKey]
        const [anio, mes] = mesKey.split("-")

        // Formatear nombre del mes
        const nombresMeses = [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ]
        const nombreMes = nombresMeses[Number.parseInt(mes) - 1]
        const nombreHoja = `${nombreMes} ${anio}`

        // Preparar datos para la hoja
        const headers = [
          "ID",
          "Pedido ID",
          "Destinatario",
          "Tipo Destinatario",
          "Nivel",
          "Curso",
          "Fecha Entrega",
          "Tipo",
          "Código",
          "Descripción",
          "Categoría",
          "Cantidad",
          "Precio Unitario",
          "Subtotal",
          "Opción",
          "Casino",
          "Fecha Creación",
        ]

        const wsData = []
        wsData.push(headers)

        items.forEach((item) => {
          wsData.push([
            item.id,
            item.pedido_id,
            item.destinatario,
            item.tipo_destinatario,
            item.nivel || "",
            item.curso || "",
            item.fecha,
            item.tipo,
            item.codigo,
            item.descripcion,
            item.categoria || "",
            item.cantidad,
            item.precio_unitario,
            item.subtotal,
            item.opcion || "",
            item.casino || "",
            item.created_at,
          ])
        })

        // Crear worksheet
        const ws = XLSX.utils.aoa_to_sheet(wsData)

        // Aplicar filtros automáticos
        if (wsData.length > 0) {
          const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
          ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) }
        }

        // Autoajustar columnas
        const colWidths = [
          { wch: 10 }, // ID
          { wch: 12 }, // Pedido ID
          { wch: 20 }, // Destinatario
          { wch: 15 }, // Tipo Destinatario
          { wch: 12 }, // Nivel
          { wch: 10 }, // Curso
          { wch: 12 }, // Fecha Entrega
          { wch: 12 }, // Tipo
          { wch: 12 }, // Código
          { wch: 30 }, // Descripción
          { wch: 12 }, // Categoría
          { wch: 10 }, // Cantidad
          { wch: 15 }, // Precio Unitario
          { wch: 15 }, // Subtotal
          { wch: 15 }, // Opción
          { wch: 15 }, // Casino
          { wch: 20 }, // Fecha Creación
        ]
        ws["!cols"] = colWidths

        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, nombreHoja)
      })

      // Generar nombre de archivo con fecha actual
      const fechaActual = new Date().toISOString().split("T")[0]
      const nombreArchivo = `pedidos-historico-completo-${fechaActual}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo)

      alert(`Histórico exportado correctamente. Total de items: ${todosLosItems.length}`)
    } catch (error) {
      console.error("Error exportando histórico:", error)
      alert("Error al generar el archivo Excel")
    } finally {
      setCargandoExport(false)
    }
  }

  // Exportar mes específico
  const exportarMesEspecifico = async () => {
    if (!mesExport || !anioExport) {
      alert("Por favor selecciona un mes y año")
      return
    }

    setCargandoExport(true)
    try {
      // Importar xlsx dinámicamente
      const XLSX = await import("xlsx")

      // Construir fechas de inicio y fin del mes
      const mesNumero = mesExport.padStart(2, "0")
      const fechaInicio = `${anioExport}-${mesNumero}-01`

      // Calcular el último día del mes
      const ultimoDia = new Date(Number.parseInt(anioExport), Number.parseInt(mesExport), 0).getDate()
      const fechaFin = `${anioExport}-${mesNumero}-${ultimoDia}`

      // Obtener items del mes específico
      const { data: itemsDelMes, error } = await supabase
        .from("pedidos_item")
        .select("*")
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaFin)
        .order("fecha", { ascending: true })

      if (error) throw error

      if (!itemsDelMes || itemsDelMes.length === 0) {
        alert("No hay datos para exportar en el mes seleccionado")
        setCargandoExport(false)
        return
      }

      // Crear workbook
      const wb = XLSX.utils.book_new()

      // Formatear nombre del mes
      const nombresMeses = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      const nombreMes = nombresMeses[Number.parseInt(mesExport) - 1]
      const nombreHoja = `${nombreMes} ${anioExport}`

      // Preparar datos para la hoja
      const headers = [
        "ID",
        "Pedido ID",
        "Destinatario",
        "Tipo Destinatario",
        "Nivel",
        "Curso",
        "Fecha Entrega",
        "Tipo",
        "Código",
        "Descripción",
        "Categoría",
        "Cantidad",
        "Precio Unitario",
        "Subtotal",
        "Opción",
        "Casino",
        "Fecha Creación",
      ]

      const wsData = []
      wsData.push(headers)

      itemsDelMes.forEach((item) => {
        wsData.push([
          item.id,
          item.pedido_id,
          item.destinatario,
          item.tipo_destinatario,
          item.nivel || "",
          item.curso || "",
          item.fecha,
          item.tipo,
          item.codigo,
          item.descripcion,
          item.categoria || "",
          item.cantidad,
          item.precio_unitario,
          item.subtotal,
          item.opcion || "",
          item.casino || "",
          item.created_at,
        ])
      })

      // Crear worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Aplicar filtros automáticos
      if (wsData.length > 0) {
        const range = XLSX.utils.decode_range(ws["!ref"] || "A1")
        ws["!autofilter"] = { ref: XLSX.utils.encode_range(range) }
      }

      // Autoajustar columnas
      const colWidths = [
        { wch: 10 }, // ID
        { wch: 12 }, // Pedido ID
        { wch: 20 }, // Destinatario
        { wch: 15 }, // Tipo Destinatario
        { wch: 12 }, // Nivel
        { wch: 10 }, // Curso
        { wch: 12 }, // Fecha Entrega
        { wch: 12 }, // Tipo
        { wch: 12 }, // Código
        { wch: 30 }, // Descripción
        { wch: 12 }, // Categoría
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Precio Unitario
        { wch: 15 }, // Subtotal
        { wch: 15 }, // Opción
        { wch: 15 }, // Casino
        { wch: 20 }, // Fecha Creación
      ]
      ws["!cols"] = colWidths

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, nombreHoja)

      // Generar nombre de archivo
      const nombreArchivo = `pedidos-${nombreMes.toLowerCase()}-${anioExport}.xlsx`

      // Descargar archivo
      XLSX.writeFile(wb, nombreArchivo)

      // Cerrar modal y limpiar
      setModalExportMesOpen(false)
      setMesExport("")
      setAnioExport("")

      alert(`Mes exportado correctamente. Total de items: ${itemsDelMes.length}`)
    } catch (error) {
      console.error("Error exportando mes:", error)
      alert("Error al generar el archivo Excel")
    } finally {
      setCargandoExport(false)
    }
  }

  // Funciones de formato
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateOnly = (dateString: string) => {
    const [year, month, day] = dateString.split("-")
    const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

    return date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagado":
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>
      case "pendiente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      case "fallido":
        return <Badge className="bg-red-900 text-red-100">Fallido</Badge>
      case "FMD":
        return <Badge className="bg-blue-100 text-blue-800">FMD</Badge>
      case "PGC":
        return <Badge className="bg-purple-100 text-purple-800">PGC</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const getTipoClienteBadge = (tipo: string) => {
    switch (tipo) {
      case "funcionario":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Funcionario
          </Badge>
        )
      case "funcionario-con-hijos":
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            Funcionario con hijos
          </Badge>
        )
      case "apoderado":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Apoderado
          </Badge>
        )
      default:
        return <Badge variant="outline">{tipo}</Badge>
    }
  }

  const totalPaginas = Math.ceil(totalPedidos / registrosPorPagina)
  const mostrandoDesde = (paginaActual - 1) * registrosPorPagina + 1
  const mostrandoHasta = Math.min(paginaActual * registrosPorPagina, totalPedidos)

  // Obtener años disponibles para el selector
  const aniosDisponibles = ["2024", "2025", "2026"]

  // Obtener meses
  const mesesDisponibles = [
    { valor: "1", nombre: "Enero" },
    { valor: "2", nombre: "Febrero" },
    { valor: "3", nombre: "Marzo" },
    { valor: "4", nombre: "Abril" },
    { valor: "5", nombre: "Mayo" },
    { valor: "6", nombre: "Junio" },
    { valor: "7", nombre: "Julio" },
    { valor: "8", nombre: "Agosto" },
    { valor: "9", nombre: "Septiembre" },
    { valor: "10", nombre: "Octubre" },
    { valor: "11", nombre: "Noviembre" },
    { valor: "12", nombre: "Diciembre" },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Pedidos</h1>
        <p className="text-gray-600">Administra todos los pedidos del sistema</p>
      </div>

      {/* Estadísticas - Primera fila (3 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            {cargandoEstadisticas ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">{estadisticas.total.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">Total Pedidos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {cargandoEstadisticas ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-green-600">{estadisticas.pagados.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">Pagados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {cargandoEstadisticas ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">Tasa de Éxito</span>
                </div>
                <div className="text-3xl font-bold text-green-600">{estadisticas.tasaExito.toFixed(1)}%</div>
                <p className="text-sm text-gray-600 mt-1">Pedidos pagados</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas - Segunda fila (2 cards centrados) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6">
            {cargandoEstadisticas ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-blue-600">{estadisticas.fmd.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">FMD</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {cargandoEstadisticas ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold text-purple-600">{estadisticas.pgc.toLocaleString()}</div>
                <p className="text-sm text-gray-600 mt-1">PGC</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente o email..."
                  value={filtroTexto}
                  onChange={(e) => setFiltroTexto(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleAplicarFiltros()
                  }}
                />
              </div>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="pagado">Pagado</SelectItem>
                  <SelectItem value="FMD">FMD</SelectItem>
                  <SelectItem value="PGC">PGC</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="fallido">Fallido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="funcionario">Funcionario</SelectItem>
                  <SelectItem value="funcionario-con-hijos">Funcionario con hijos</SelectItem>
                  <SelectItem value="apoderado">Apoderado</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                placeholder="Fecha desde"
              />
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                placeholder="Fecha hasta"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAplicarFiltros}>Aplicar filtros</Button>
              <Button variant="outline" onClick={handleLimpiarFiltros}>
                Limpiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Pedidos
              {totalPedidos > 0 && (
                <span className="text-sm font-normal text-gray-500">
                  (mostrando {mostrandoDesde}-{mostrandoHasta} de {totalPedidos.toLocaleString()})
                </span>
              )}
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={mostrarNuevoPedido} onOpenChange={setMostrarNuevoPedido}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Pedido
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Pedido</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="nombre">Nombre Cliente *</Label>
                      <Input
                        id="nombre"
                        value={nuevoPedido.nombre_cliente}
                        onChange={(e) => setNuevoPedido((prev) => ({ ...prev, nombre_cliente: e.target.value }))}
                        placeholder="Nombre completo del cliente"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={nuevoPedido.email_cliente}
                        onChange={(e) => setNuevoPedido((prev) => ({ ...prev, email_cliente: e.target.value }))}
                        placeholder="email@ejemplo.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo de Cliente *</Label>
                      <Select
                        value={nuevoPedido.tipo_cliente}
                        onValueChange={(value) => setNuevoPedido((prev) => ({ ...prev, tipo_cliente: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcionario">Funcionario</SelectItem>
                          <SelectItem value="funcionario-con-hijos">Funcionario con hijos</SelectItem>
                          <SelectItem value="apoderado">Apoderado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="observaciones">Observaciones</Label>
                      <Textarea
                        id="observaciones"
                        value={nuevoPedido.observaciones}
                        onChange={(e) => setNuevoPedido((prev) => ({ ...prev, observaciones: e.target.value }))}
                        placeholder="Observaciones adicionales..."
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setMostrarNuevoPedido(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={crearNuevoPedido}>Crear Pedido</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={exportarHistoricoCompleto} disabled={cargandoExport}>
                <Download className="h-4 w-4 mr-2" />
                {cargandoExport ? "Exportando..." : "Exportar Histórico"}
              </Button>
              <Button variant="outline" onClick={() => setModalExportMesOpen(true)} disabled={cargandoExport}>
                <Calendar className="h-4 w-4 mr-2" />
                Exportar Mes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cargandoPedidos ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay pedidos que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pedidos.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{pedido.nombre_cliente}</h4>
                      {getTipoClienteBadge(pedido.tipo_cliente)}
                    </div>
                    <p className="text-sm text-gray-600">
                      {pedido.email_cliente && `${pedido.email_cliente} • `}
                      {formatPrice(pedido.total)}
                      {pedido.transaction_id && ` • TXN: ${pedido.transaction_id.slice(0, 10)}...`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(pedido.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getEstadoBadge(pedido.estado_pago)}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => cargarDetallePedido(pedido)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Ver detalle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Pedido #{pedido.id.slice(-8)} - {pedido.nombre_cliente}
                          </DialogTitle>
                        </DialogHeader>

                        <Tabs defaultValue="detalle" className="w-full">
                          <TabsList>
                            <TabsTrigger value="detalle">Información General</TabsTrigger>
                            <TabsTrigger value="items">Items del Pedido</TabsTrigger>
                          </TabsList>

                          <TabsContent value="detalle" className="space-y-4">
                            {editandoPedido && pedidoSeleccionado ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit-nombre">Nombre Cliente</Label>
                                    <Input
                                      id="edit-nombre"
                                      value={pedidoSeleccionado.nombre_cliente}
                                      onChange={(e) =>
                                        setPedidoSeleccionado((prev) =>
                                          prev ? { ...prev, nombre_cliente: e.target.value } : null,
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-email">Email</Label>
                                    <Input
                                      id="edit-email"
                                      value={pedidoSeleccionado.email_cliente || ""}
                                      onChange={(e) =>
                                        setPedidoSeleccionado((prev) =>
                                          prev ? { ...prev, email_cliente: e.target.value } : null,
                                        )
                                      }
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-estado">Estado</Label>
                                    <Select
                                      value={pedidoSeleccionado.estado_pago}
                                      onValueChange={(value) =>
                                        setPedidoSeleccionado((prev) => (prev ? { ...prev, estado_pago: value } : null))
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                        <SelectItem value="pagado">Pagado</SelectItem>
                                        <SelectItem value="cancelado">Cancelado</SelectItem>
                                        <SelectItem value="fallido">Fallido</SelectItem>
                                        <SelectItem value="FMD">FMD</SelectItem>
                                        <SelectItem value="PGC">PGC</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Total</Label>
                                    <div className="text-lg font-semibold">{formatPrice(pedidoSeleccionado.total)}</div>
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit-observaciones">Observaciones</Label>
                                  <Textarea
                                    id="edit-observaciones"
                                    value={pedidoSeleccionado.observaciones || ""}
                                    onChange={(e) =>
                                      setPedidoSeleccionado((prev) =>
                                        prev ? { ...prev, observaciones: e.target.value } : null,
                                      )
                                    }
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditandoPedido(false)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => pedidoSeleccionado && actualizarPedido(pedidoSeleccionado)}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Guardar Cambios
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label>Cliente</Label>
                                    <p className="text-lg">{pedidoSeleccionado?.nombre_cliente}</p>
                                  </div>
                                  <div>
                                    <Label>Email</Label>
                                    <p>{pedidoSeleccionado?.email_cliente || "No especificado"}</p>
                                  </div>
                                  <div>
                                    <Label>Tipo</Label>
                                    <div>
                                      {pedidoSeleccionado && getTipoClienteBadge(pedidoSeleccionado.tipo_cliente)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Estado</Label>
                                    <div>{pedidoSeleccionado && getEstadoBadge(pedidoSeleccionado.estado_pago)}</div>
                                  </div>
                                  <div>
                                    <Label>Total</Label>
                                    <p className="text-lg font-semibold">
                                      {pedidoSeleccionado && formatPrice(pedidoSeleccionado.total)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Transaction ID</Label>
                                    <p className="text-sm font-mono">
                                      {pedidoSeleccionado?.transaction_id || "No disponible"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label>Fecha de Creación</Label>
                                    <p>{pedidoSeleccionado && formatDate(pedidoSeleccionado.created_at)}</p>
                                  </div>
                                  <div>
                                    <Label>Última Actualización</Label>
                                    <p>
                                      {pedidoSeleccionado?.updated_at
                                        ? formatDate(pedidoSeleccionado.updated_at)
                                        : "No actualizado"}
                                    </p>
                                  </div>
                                </div>
                                {pedidoSeleccionado?.observaciones && (
                                  <div>
                                    <Label>Observaciones</Label>
                                    <p className="bg-gray-50 p-3 rounded">{pedidoSeleccionado.observaciones}</p>
                                  </div>
                                )}
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setEditandoPedido(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                  <Button variant="outline">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar Email
                                  </Button>
                                  <Button variant="outline">
                                    <Printer className="h-4 w-4 mr-2" />
                                    Imprimir
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => pedidoSeleccionado && eliminarPedido(pedidoSeleccionado.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </TabsContent>

                          <TabsContent value="items">
                            {loadingDetalle ? (
                              <div className="animate-pulse space-y-4">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                                ))}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="text-lg font-semibold">Items del Pedido ({itemsDetalle.length})</h3>
                                  <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar Item
                                  </Button>
                                </div>

                                {itemsDetalle.length === 0 ? (
                                  <div className="text-center py-8">
                                    <p className="text-gray-500">No hay items en este pedido</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {itemsDetalle.map((item) => (
                                      <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                                          <div>
                                            <span className="font-medium text-gray-600">Destinatario:</span>
                                            <p className="font-medium">{item.destinatario}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Tipo:</span>
                                            <p>{item.tipo_destinatario}</p>
                                            {item.nivel && <p className="text-xs text-gray-500">{item.nivel}</p>}
                                            {item.curso && <p className="text-xs text-gray-500">{item.curso}</p>}
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Fecha Entrega:</span>
                                            <p className="font-medium">{formatDateOnly(item.fecha)}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Item:</span>
                                            <p className="font-medium">{item.codigo}</p>
                                            <p className="text-xs text-gray-600">{item.descripcion}</p>
                                          </div>
                                          <div>
                                            <span className="font-medium text-gray-600">Cantidad:</span>
                                            <p className="font-medium">{item.cantidad}</p>
                                            <p className="text-xs text-gray-600">
                                              {formatPrice(item.precio_unitario)} c/u
                                            </p>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <div>
                                              <span className="font-medium text-gray-600">Subtotal:</span>
                                              <p className="font-bold text-green-600">{formatPrice(item.subtotal)}</p>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="outline" onClick={() => abrirEditorItem(item)}>
                                                <Edit className="h-3 w-3" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => eliminarItemPedido(item.id)}
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}

                                    <div className="border-t pt-4">
                                      <div className="flex justify-end">
                                        <div className="text-right">
                                          <p className="text-lg font-bold">
                                            Total:{" "}
                                            {formatPrice(itemsDetalle.reduce((sum, item) => sum + item.subtotal, 0))}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {totalPedidos > registrosPorPagina && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Mostrando {mostrandoDesde} - {mostrandoHasta} de {totalPedidos.toLocaleString()} pedidos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de edición de item */}
      <Dialog open={editItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Item del Pedido</DialogTitle>
          </DialogHeader>
          {itemEnEdicion && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Destinatario</Label>
                  <Input
                    value={itemEnEdicion.destinatario}
                    onChange={(e) => cambiarCampoItem("destinatario", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo Destinatario</Label>
                  <Input
                    value={itemEnEdicion.tipo_destinatario}
                    onChange={(e) => cambiarCampoItem("tipo_destinatario", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Nivel</Label>
                  <Input
                    value={itemEnEdicion.nivel || ""}
                    onChange={(e) => cambiarCampoItem("nivel", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Curso</Label>
                  <Input
                    value={itemEnEdicion.curso || ""}
                    onChange={(e) => cambiarCampoItem("curso", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Fecha Entrega</Label>
                  <Input
                    type="date"
                    value={itemEnEdicion.fecha}
                    onChange={(e) => cambiarCampoItem("fecha", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input value={itemEnEdicion.tipo} onChange={(e) => cambiarCampoItem("tipo", e.target.value)} />
                </div>
                <div>
                  <Label>Código</Label>
                  <Input value={itemEnEdicion.codigo} onChange={(e) => cambiarCampoItem("codigo", e.target.value)} />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={itemEnEdicion.categoria || ""}
                    onChange={(e) => cambiarCampoItem("categoria", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={itemEnEdicion.descripcion}
                    onChange={(e) => cambiarCampoItem("descripcion", e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={1}
                    value={itemEnEdicion.cantidad}
                    onChange={(e) => cambiarCampoItem("cantidad", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    min={0}
                    value={itemEnEdicion.precio_unitario}
                    onChange={(e) => cambiarCampoItem("precio_unitario", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Subtotal</Label>
                  <div className="text-lg font-semibold">
                    {formatPrice(
                      (Number(itemEnEdicion.cantidad || 0) * Number(itemEnEdicion.precio_unitario || 0)) as number,
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditItemOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={guardarItemEditado}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de exportación mensual */}
      <Dialog open={modalExportMesOpen} onOpenChange={setModalExportMesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Mes Específico</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📊 Selecciona el mes que deseas exportar. El archivo Excel contendrá todos los items de pedidos para ese
                período.
              </p>
            </div>

            <div>
              <Label className="text-base font-semibold mb-3 block">Selecciona el mes:</Label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mes</Label>
                  <Select value={mesExport} onValueChange={setMesExport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesDisponibles.map((mes) => (
                        <SelectItem key={mes.valor} value={mes.valor}>
                          {mes.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Año</Label>
                  <Select value={anioExport} onValueChange={setAnioExport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona año" />
                    </SelectTrigger>
                    <SelectContent>
                      {aniosDisponibles.map((anio) => (
                        <SelectItem key={anio} value={anio}>
                          {anio}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalExportMesOpen(false)
                  setMesExport("")
                  setAnioExport("")
                }}
              >
                Cancelar
              </Button>
              <Button onClick={exportarMesEspecifico} disabled={!mesExport || !anioExport || cargandoExport}>
                <Download className="h-4 w-4 mr-2" />
                {cargandoExport ? "Exportando..." : "Exportar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
