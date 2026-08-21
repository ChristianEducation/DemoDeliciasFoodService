"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Calendar, Cookie } from "lucide-react"
import Image from "next/image"
import * as XLSX from "xlsx-js-style"

interface ColacionItem {
  id: string
  destinatario: string
  tipo_destinatario: "estudiante" | "funcionario"
  opcion: string
  cantidad: number
  fecha: string
  pedido_id: string
  curso?: string
  nivel?: string
  descripcion?: string
  estado_pago?: string
}

interface ProyeccionSemanal {
  especificacion: string
  lunes: number
  martes: number
  miercoles: number
  jueves: number
  viernes: number
  total: number
}

export default function ColacionesPage() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("")
  const [colaciones, setColaciones] = useState<ColacionItem[]>([])
  const [proyeccionSemanal, setProyeccionSemanal] = useState<ProyeccionSemanal[]>([])
  const [loading, setLoading] = useState(false)
  const [vistaActual, setVistaActual] = useState<"planilla" | "proyeccion">("planilla")

  const supabase = createClient()

  // Obtener fecha actual en formato YYYY-MM-DD
  useEffect(() => {
    const hoy = new Date()
    const fechaFormateada = hoy.toISOString().split("T")[0]
    setFechaSeleccionada(fechaFormateada)
  }, [])

  // Cargar datos cuando cambia la fecha
  useEffect(() => {
    if (fechaSeleccionada) {
      if (vistaActual === "planilla") {
        cargarColacionesDiarias()
      } else {
        cargarProyeccionSemanal()
      }
    }
  }, [fechaSeleccionada, vistaActual])

  const cargarColacionesDiarias = async () => {
    setLoading(true)
    try {
      // Query simplificada: solo JOIN con pedidos para verificar estado de pago
      const { data: colacionesData, error } = await supabase
        .from("pedidos_item")
        .select(`
          *,
          pedidos!inner(estado_pago)
        `)
        .eq("tipo", "colacion")
        .eq("fecha", fechaSeleccionada)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])

      if (error) throw error

      // Los datos ya vienen completos de pedidos_item
      const colacionesCompletas =
        colacionesData?.map((item) => ({
          ...item,
          // Usar datos directos de pedidos_item
          nivel: item.nivel || "OTROS",
          curso: item.tipo_destinatario === "estudiante" ? item.curso || "" : "",
          menu_descripcion: item.descripcion || `Opción ${item.opcion}`,
          estado_pago: item.pedidos.estado_pago,
        })) || []

      setColaciones(colacionesCompletas)
    } catch (error) {
      console.error("Error cargando colaciones:", error)
      setColaciones([])
    } finally {
      setLoading(false)
    }
  }

  const cargarProyeccionSemanal = async () => {
    setLoading(true)
    try {
      // Parsear fecha manualmente para evitar problemas de zona horaria
      const [año, mes, dia] = fechaSeleccionada.split("-")
      const fecha = new Date(Number.parseInt(año), Number.parseInt(mes) - 1, Number.parseInt(dia))
      const lunes = new Date(fecha)
      lunes.setDate(fecha.getDate() - fecha.getDay() + 1)

      const fechasSemana = []
      for (let i = 0; i < 5; i++) {
        const dia = new Date(lunes)
        dia.setDate(lunes.getDate() + i)
        const fechaFormateada = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`
        fechasSemana.push(fechaFormateada)
      }

      // Query simplificada para la semana
      const { data: colacionesData, error } = await supabase
        .from("pedidos_item")
        .select(`
          *,
          pedidos!inner(estado_pago)
        `)
        .eq("tipo", "colacion")
        .in("fecha", fechasSemana)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])

      if (error) throw error

      // Agrupar por descripción de colación
      const proyeccion: { [key: string]: ProyeccionSemanal } = {}

      colacionesData?.forEach((item) => {
        const descripcion = item.descripcion || `Opción ${item.opcion}`

        if (!proyeccion[descripcion]) {
          proyeccion[descripcion] = {
            especificacion: descripcion,
            lunes: 0,
            martes: 0,
            miercoles: 0,
            jueves: 0,
            viernes: 0,
            total: 0,
          }
        }

        // Parsear fecha manualmente para evitar problemas de zona horaria
        const [añoItem, mesItem, diaItem] = item.fecha.split("-")
        const fechaLocal = new Date(Number.parseInt(añoItem), Number.parseInt(mesItem) - 1, Number.parseInt(diaItem))
        const diaSemana = fechaLocal.getDay()

        const cantidad = item.cantidad || 1

        switch (diaSemana) {
          case 1:
            proyeccion[descripcion].lunes += cantidad
            break
          case 2:
            proyeccion[descripcion].martes += cantidad
            break
          case 3:
            proyeccion[descripcion].miercoles += cantidad
            break
          case 4:
            proyeccion[descripcion].jueves += cantidad
            break
          case 5:
            proyeccion[descripcion].viernes += cantidad
            break
        }
        proyeccion[descripcion].total += cantidad
      })

      setProyeccionSemanal(Object.values(proyeccion))
    } catch (error) {
      console.error("Error cargando proyección semanal:", error)
      setProyeccionSemanal([])
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    // Parsear fecha manualmente para evitar problemas de zona horaria
    const [año, mes, dia] = fecha.split("-")
    const date = new Date(Number.parseInt(año), Number.parseInt(mes) - 1, Number.parseInt(dia))

    const dias = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"]
    const meses = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ]

    return `${dias[date.getDay()]} ${date.getDate()} DE ${meses[date.getMonth()]} ${date.getFullYear()}`
  }

  const formatearSemana = (fecha: string) => {
    const date = new Date(fecha)
    const lunes = new Date(date)
    lunes.setDate(date.getDate() - date.getDay() + 1)
    const viernes = new Date(lunes)
    viernes.setDate(lunes.getDate() + 4)

    const meses = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ]

    return `SEMANA DEL LUNES ${lunes.getDate()} AL VIERNES ${viernes.getDate()} DE ${meses[viernes.getMonth()]}`
  }

  const agruparPorNivel = (colaciones: ColacionItem[]) => {
    const grupos: { [key: string]: ColacionItem[] } = {
      "PRE SCHOOL": [],
      "LOWER SCHOOL": [],
      "MIDDLE SCHOOL": [],
      "HIGH SCHOOL": [],
      FUNCIONARIOS: [],
      OTROS: [],
    }

    colaciones.forEach((colacion) => {
      const nivel = colacion.nivel || "OTROS"
      if (grupos[nivel]) {
        grupos[nivel].push(colacion)
      } else {
        grupos["OTROS"].push(colacion)
      }
    })

    return grupos
  }

  const exportarPlanilla = () => {
    if (vistaActual === "planilla") {
      exportarPlanillaDiaria()
    } else {
      exportarProyeccionSemanal()
    }
  }

  const exportarPlanillaDiaria = () => {
    const wb = XLSX.utils.book_new()
    const datosExcel: any[][] = []

    // Estilos
    const estiloHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4CAF50" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "center", vertical: "center" },
    }

    const estiloCelda = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    }

    const estiloTitulo = {
      font: { bold: true, size: 14 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        bottom: { style: "thick", color: { rgb: "000000" } },
        left: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thick", color: { rgb: "000000" } },
      },
    }

    // Header principal
    datosExcel.push(["PLANILLA DESPACHO SNACKS"])
    datosExcel.push([`Fecha: ${formatearFecha(fechaSeleccionada)}`])
    datosExcel.push([])

    // Headers de tabla
    datosExcel.push(["NIVEL", "NOMBRE", "CURSO O CASINO", "OPCIÓN", "CANTIDAD", "PAGO"])

    const grupos = agruparPorNivel(colaciones)
    let totalGeneral = 0

    Object.entries(grupos).forEach(([nivel, items]) => {
      if (items.length > 0) {
        items.forEach((item) => {
          const nombre = item.destinatario
          const cursoOCasino = item.tipo_destinatario === "estudiante" ? item.curso || "" : ""

          datosExcel.push([
            item.nivel || "OTROS", // ← Usar el valor real de la base de datos
            nombre,
            cursoOCasino,
            item.descripcion || `Opción ${item.opcion}`,
            item.cantidad || 1,
            item.estado_pago?.toUpperCase() || "PAGADO",
          ])
          totalGeneral += item.cantidad || 1
        })
      }
    })

    datosExcel.push([])
    datosExcel.push(["TOTAL SNACKS", totalGeneral])

    const ws = XLSX.utils.aoa_to_sheet(datosExcel)

    // Aplicar estilos
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

    // Estilo para título principal
    if (ws["A1"]) ws["A1"].s = estiloTitulo
    if (ws["A2"]) ws["A2"].s = estiloCelda

    // Aplicar estilos a headers y celdas
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) continue

        if (R === 3) {
          // Headers de tabla
          ws[cellAddress].s = estiloHeader
        } else if (R > 3) {
          // Celdas de datos
          ws[cellAddress].s = estiloCelda
        }
      }
    }

    // Ajustar anchos de columna
    ws["!cols"] = [
      { width: 15 }, // NIVEL
      { width: 25 }, // NOMBRE
      { width: 15 }, // CURSO O CASINO
      { width: 40 }, // OPCIÓN
      { width: 10 }, // CANTIDAD
      { width: 10 }, // PAGO
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Planilla Snacks")
    XLSX.writeFile(wb, `planilla_snacks_${fechaSeleccionada}.xlsx`)
  }

  const exportarProyeccionSemanal = () => {
    const wb = XLSX.utils.book_new()
    const datosExcel: any[][] = []

    // Estilos
    const estiloTitulo = {
      font: { bold: true, underline: true, size: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    }

    const estiloFecha = {
      font: { bold: false, size: 11 },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    }

    const estiloHeader = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4CAF50" } },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "center", vertical: "center" },
    }

    const estiloCelda = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "center", vertical: "center" },
    }

    const estiloCeldaTexto = {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
      alignment: { horizontal: "left", vertical: "center" },
    }

    // Fila 1 vacía
    datosExcel.push([""])

    // Fila 2: Título principal
    datosExcel.push(["PROYECCIÓN SNACKS SEMANALES", "", "", "", "", ""])

    // Fila 3: Fecha
    datosExcel.push([formatearSemana(fechaSeleccionada), "", "", "", "", ""])

    // Fila 4 vacía
    datosExcel.push([""])

    // Fila 5: Headers
    datosExcel.push(["ESPECIFICACIÓN", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "TOTAL"])

    // Datos de proyección
    proyeccionSemanal.forEach((item) => {
      datosExcel.push([
        item.especificacion,
        item.lunes,
        item.martes,
        item.miercoles,
        item.jueves,
        item.viernes,
        item.total,
      ])
    })

    // Total general
    const totalGeneral = proyeccionSemanal.reduce((sum, item) => sum + item.total, 0)
    const totalLunes = proyeccionSemanal.reduce((sum, item) => sum + item.lunes, 0)
    const totalMartes = proyeccionSemanal.reduce((sum, item) => sum + item.martes, 0)
    const totalMiercoles = proyeccionSemanal.reduce((sum, item) => sum + item.miercoles, 0)
    const totalJueves = proyeccionSemanal.reduce((sum, item) => sum + item.jueves, 0)
    const totalViernes = proyeccionSemanal.reduce((sum, item) => sum + item.viernes, 0)

    datosExcel.push(["TOTAL", totalLunes, totalMartes, totalMiercoles, totalJueves, totalViernes, totalGeneral])

    const ws = XLSX.utils.aoa_to_sheet(datosExcel)

    // Aplicar merges
    const merges = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Título principal A2:F2
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } }, // Fecha A3:F3
    ]
    ws["!merges"] = merges

    // Aplicar estilos
    const range = XLSX.utils.decode_range(ws["!ref"] || "A1")

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
        if (!ws[cellAddress]) continue

        if (R === 1) {
          // Título principal
          ws[cellAddress].s = estiloTitulo
        } else if (R === 2) {
          // Fecha
          ws[cellAddress].s = estiloFecha
        } else if (R === 4) {
          // Headers de tabla
          ws[cellAddress].s = estiloHeader
        } else if (R > 4) {
          // Celdas de datos
          if (C === 0) {
            // Columna de especificación
            ws[cellAddress].s = estiloCeldaTexto
          } else {
            // Columnas numéricas
            ws[cellAddress].s = estiloCelda
          }
        }
      }
    }

    // Configurar anchos de columna exactos
    ws["!cols"] = [
      { width: 107.56 }, // ESPECIFICACIÓN
      { width: 17.33 }, // LUNES
      { width: 15.11 }, // MARTES
      { width: 22.89 }, // MIÉRCOLES
      { width: 17.56 }, // JUEVES
      { width: 24.78 }, // VIERNES
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Proyección Semanal")
    XLSX.writeFile(wb, `proyeccion_snacks_${fechaSeleccionada}.xlsx`)
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Image
              src="/images/delicias-logo-complete.png"
              alt="Delicias Logo"
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-center">
                {vistaActual === "planilla" ? "PLANILLA DESPACHO SNACKS" : "PROYECCIÓN SNACKS SEMANALES"}
              </h1>
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-400 p-2 inline-block">
          <span className="font-semibold">Fecha: </span>
          <span className="font-bold">
            {vistaActual === "planilla" ? formatearFecha(fechaSeleccionada) : formatearSemana(fechaSeleccionada)}
          </span>
        </div>
      </div>

      {/* Controles */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Gestión de Colaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <input
                type="date"
                value={fechaSeleccionada}
                onChange={(e) => setFechaSeleccionada(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>

            <Tabs value={vistaActual} onValueChange={(value) => setVistaActual(value as "planilla" | "proyeccion")}>
              <TabsList>
                <TabsTrigger value="planilla">Planilla Diaria</TabsTrigger>
                <TabsTrigger value="proyeccion">Proyección Semanal</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={exportarPlanilla} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido */}
      {vistaActual === "planilla" ? (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <>
              {/* Tabla de colaciones */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-400">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">NIVEL</th>
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">NOMBRE</th>
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">CURSO O CASINO</th>
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">OPCIÓN</th>
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">CANTIDAD</th>
                      <th className="border border-gray-400 px-4 py-2 text-center font-bold">PAGO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(agruparPorNivel(colaciones)).map(([nivel, items]) =>
                      items.map((item, index) => {
                        const nombre = item.destinatario
                        const cursoOCasino = item.tipo_destinatario === "estudiante" ? item.curso || "" : ""

                        return (
                          <tr key={`${nivel}-${index}`} className={index % 2 === 0 ? "bg-green-50" : "bg-white"}>
                            <td className="border border-gray-400 px-4 py-2 text-center">{item.nivel || "OTROS"}</td>
                            <td className="border border-gray-400 px-4 py-2">{nombre}</td>
                            <td className="border border-gray-400 px-4 py-2 text-center">{cursoOCasino}</td>
                            <td className="border border-gray-400 px-4 py-2">
                              {item.descripcion || `Opción ${item.opcion}`}
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-center">{item.cantidad || 1}</td>
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              <Badge variant="default" className="bg-green-600">
                                {item.estado_pago?.toUpperCase() || "PAGADO"}
                              </Badge>
                            </td>
                          </tr>
                        )
                      }),
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total */}
              <div className="mt-4 bg-green-100 border-2 border-green-600 p-4 inline-block">
                <span className="font-bold text-lg">
                  TOTAL SNACKS: {colaciones.reduce((sum, item) => sum + (item.cantidad || 1), 0)}
                </span>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">ESPECIFICACIÓN</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">LUNES</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">MARTES</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">MIÉRCOLES</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">JUEVES</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">VIERNES</th>
                    <th className="border border-gray-400 px-4 py-2 text-center font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {proyeccionSemanal.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-green-50" : "bg-white"}>
                      <td className="border border-gray-400 px-4 py-2">{item.especificacion}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center">{item.lunes}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center">{item.martes}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center">{item.miercoles}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center">{item.jueves}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center">{item.viernes}</td>
                      <td className="border border-gray-400 px-4 py-2 text-center font-bold">{item.total}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-200 font-bold">
                    <td className="border border-gray-400 px-4 py-2">TOTAL</td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.lunes, 0)}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.martes, 0)}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.miercoles, 0)}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.jueves, 0)}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.viernes, 0)}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center">
                      {proyeccionSemanal.reduce((sum, item) => sum + item.total, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
