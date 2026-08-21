"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, ChefHat, Users, GraduationCap, CalendarDays, FileText } from "lucide-react"
import { exportarResumenPDF } from "./exportar-pdf"
import { useAvisoActualizacion } from "@/hooks/useAvisoActualizacion"
import AvisoNuevosPedidos from "@/components/admin/AvisoNuevosPedidos"

interface ResumenCocina {
  fecha: string
  dia_semana: string
  niveles: {
    [nivel: string]: {
      [codigo: string]: {
        descripcion: string
        cantidad: number
      }
    }
  }
  funcionarios: {
    [codigo: string]: {
      descripcion: string
      cantidad: number
    }
  }
  // Nueva estructura combinada
  funcionariosYHighschool: {
    [codigo: string]: {
      descripcion: string
      cantidad: number
    }
  }
}

interface ProyeccionSemanal {
  semana: string
  fechas: string[]
  niveles: {
    [nivel: string]: {
      [codigo: string]: {
        descripcion: string
        cantidad: number
      }
    }
  }
  funcionarios: {
    [codigo: string]: {
      descripcion: string
      cantidad: number
    }
  }
  datosPorDia: {
    [dia: string]: {
      [opcion: string]: number
    }
  }
  // Nueva estructura para el formato requerido
  resumenPorDia: {
    [fecha: string]: {
      nombreDia: string
      opciones: {
        [codigo: string]: number
      }
      total: number
    }
  }
}

const NIVELES_ORDEN = ["PRESCHOOL", "LOWERSCHOOL", "MIDDLESCHOOL"]

// Función para formatear fecha sin problemas de timezone
function formatearFecha(fechaStr: string) {
  const [y, m, d] = fechaStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

function formatearFechaCorta(fechaStr: string) {
  const [y, m, d] = fechaStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
  })
}

function formatearFechaCompleta(fechaStr: string) {
  const [y, m, d] = fechaStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date
    .toLocaleDateString("es-CL", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    })
    .toUpperCase()
}

export default function AdminCocina() {
  const [resumenDiario, setResumenDiario] = useState<ResumenCocina | null>(null)
  const [proyeccionSemanal, setProyeccionSemanal] = useState<ProyeccionSemanal | null>(null)
  const [loading, setLoading] = useState(true)
  const [fechaSeleccionada, setFechaSeleccionada] = useState("")
  const [fechasDisponibles, setFechasDisponibles] = useState<string[]>([])
  const [tipoVista, setTipoVista] = useState<"dia" | "proyeccion">("dia")
  const [actualizando, setActualizando] = useState(false)

  const resumenDiarioRef = useRef<ResumenCocina | null>(null)
  const proyeccionSemanalRef = useRef<ProyeccionSemanal | null>(null)

  const supabase = createClient()
  const { hayNuevos, limpiarAviso } = useAvisoActualizacion(supabase)

  const actualizarAhora = async () => {
    setActualizando(true)
    try {
      if (tipoVista === "dia") {
        await cargarResumenDiario()
      } else {
        await cargarProyeccionSemanal()
      }
      limpiarAviso()
    } finally {
      setActualizando(false)
    }
  }

  useEffect(() => {
    cargarFechasDisponibles()
  }, [])

  useEffect(() => {
    if (fechaSeleccionada) {
      if (tipoVista === "dia") {
        cargarResumenDiario()
      } else {
        cargarProyeccionSemanal()
      }
    }
  }, [fechaSeleccionada, tipoVista])

  const cargarFechasDisponibles = async () => {
    try {
      console.log("🔍 Cargando fechas disponibles...")

      // Modificar query para incluir solo pedidos pagados
      const { data, error } = await supabase
        .from("pedidos_item")
        .select(`
          fecha,
          pedidos!inner(estado_pago)
        `)
        .eq("tipo", "almuerzo")
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .order("fecha", { ascending: false })

      if (error) throw error

      console.log("📅 Fechas encontradas (solo pagados):", data)

      const fechasUnicas = [...new Set(data?.map((item) => item.fecha) || [])].sort().reverse()
      console.log("📊 Fechas únicas:", fechasUnicas)

      setFechasDisponibles(fechasUnicas)

      if (fechasUnicas.length > 0 && !fechaSeleccionada) {
        setFechaSeleccionada(fechasUnicas[0])
      }
    } catch (error) {
      console.error("❌ Error cargando fechas:", error)
    }
  }

  const cargarResumenDiario = async () => {
    if (!fechaSeleccionada) return

    setLoading(true)
    try {
      console.log("🔍 Cargando resumen para fecha:", fechaSeleccionada)

      // Modificar query para incluir solo pedidos pagados
      const { data: datosAlmuerzos, error } = await supabase
        .from("pedidos_item")
        .select(`
          fecha, 
          tipo_destinatario, 
          nivel, 
          codigo, 
          descripcion, 
          cantidad,
          pedidos!inner(estado_pago)
        `)
        .eq("tipo", "almuerzo")
        .eq("fecha", fechaSeleccionada)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .order("codigo")

      if (error) throw error

      console.log("📊 Datos cargados (solo pagados):", datosAlmuerzos)
      console.log("📈 Cantidad de registros:", datosAlmuerzos?.length || 0)

      const resumen: ResumenCocina = {
        fecha: fechaSeleccionada,
        dia_semana: formatearFecha(fechaSeleccionada),
        niveles: {},
        funcionarios: {},
        funcionariosYHighschool: {},
      }

      datosAlmuerzos?.forEach((item) => {
        if (item.tipo_destinatario === "funcionario") {
          // Agregar a funcionarios (para mantener compatibilidad)
          if (!resumen.funcionarios[item.codigo]) {
            resumen.funcionarios[item.codigo] = {
              descripcion: item.descripcion,
              cantidad: 0,
            }
          }
          resumen.funcionarios[item.codigo].cantidad += item.cantidad

          // Agregar a la nueva estructura combinada
          if (!resumen.funcionariosYHighschool[item.codigo]) {
            resumen.funcionariosYHighschool[item.codigo] = {
              descripcion: item.descripcion,
              cantidad: 0,
            }
          }
          resumen.funcionariosYHighschool[item.codigo].cantidad += item.cantidad
        } else {
          const nivel = item.nivel || "SIN_NIVEL"

          if (nivel === "HIGHSCHOOL") {
            // HIGHSCHOOL se combina con funcionarios
            if (!resumen.funcionariosYHighschool[item.codigo]) {
              resumen.funcionariosYHighschool[item.codigo] = {
                descripcion: item.descripcion,
                cantidad: 0,
              }
            }
            resumen.funcionariosYHighschool[item.codigo].cantidad += item.cantidad
          } else {
            // Otros niveles se mantienen separados
            if (!resumen.niveles[nivel]) {
              resumen.niveles[nivel] = {}
            }
            if (!resumen.niveles[nivel][item.codigo]) {
              resumen.niveles[nivel][item.codigo] = {
                descripcion: item.descripcion,
                cantidad: 0,
              }
            }
            resumen.niveles[nivel][item.codigo].cantidad += item.cantidad
          }
        }
      })

      console.log("🍽️ Resumen procesado:", resumen)
      resumenDiarioRef.current = resumen
      setResumenDiario(resumen)
    } catch (error) {
      console.error("❌ Error cargando resumen diario:", error)
    } finally {
      setLoading(false)
    }
  }

  const cargarProyeccionSemanal = async () => {
    if (!fechaSeleccionada) return

    setLoading(true)
    try {
      // Calcular el lunes de la semana de la fecha seleccionada
      const [y, m, d] = fechaSeleccionada.split("-")
      const fechaBase = new Date(Number(y), Number(m) - 1, Number(d))
      const diaSemana = fechaBase.getDay()
      const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana

      const lunes = new Date(fechaBase)
      lunes.setDate(fechaBase.getDate() + diasHastaLunes)

      // Generar fechas de lunes a viernes
      const fechasSemana: string[] = []
      const nombresDias = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"]
      for (let i = 0; i < 5; i++) {
        const fecha = new Date(lunes)
        fecha.setDate(lunes.getDate() + i)
        const fechaStr = fecha.toISOString().split("T")[0]
        fechasSemana.push(fechaStr)
      }

      console.log("📅 Proyección semanal para fechas:", fechasSemana)

      // Modificar query para incluir solo pedidos pagados
      const { data: datosAlmuerzos, error } = await supabase
        .from("pedidos_item")
        .select(`
          fecha, 
          tipo_destinatario, 
          nivel, 
          codigo, 
          descripcion, 
          cantidad,
          pedidos!inner(estado_pago)
        `)
        .eq("tipo", "almuerzo")
        .in("fecha", fechasSemana)
        .in("pedidos.estado_pago", ["pagado", "FMD", "PGC"])
        .order("descripcion")

      if (error) throw error

      console.log("📊 Datos proyección semanal (solo pagados):", datosAlmuerzos)

      // Estructura para mantener datos por día
      const proyeccion: ProyeccionSemanal = {
        semana: `${formatearFechaCorta(fechasSemana[0])} - ${formatearFechaCorta(fechasSemana[4])}`,
        fechas: fechasSemana,
        niveles: {},
        funcionarios: {},
        datosPorDia: {},
        // Nueva estructura para el formato requerido
        resumenPorDia: {},
      }

      // Inicializar estructura por días
      fechasSemana.forEach((fecha, index) => {
        proyeccion.datosPorDia[nombresDias[index]] = {}
        proyeccion.resumenPorDia[fecha] = {
          nombreDia: formatearFechaCompleta(fecha),
          opciones: {},
          total: 0,
        }
      })

      // Procesar datos manteniendo información por día
      datosAlmuerzos?.forEach((item) => {
        const diaIndex = fechasSemana.indexOf(item.fecha)
        if (diaIndex >= 0) {
          const nombreDia = nombresDias[diaIndex]
          const clave = `${item.descripcion}`

          if (!proyeccion.datosPorDia[nombreDia][clave]) {
            proyeccion.datosPorDia[nombreDia][clave] = 0
          }
          proyeccion.datosPorDia[nombreDia][clave] += item.cantidad

          // Nueva estructura: agrupar por código de opción
          const fecha = item.fecha
          if (!proyeccion.resumenPorDia[fecha].opciones[item.codigo]) {
            proyeccion.resumenPorDia[fecha].opciones[item.codigo] = 0
          }
          proyeccion.resumenPorDia[fecha].opciones[item.codigo] += item.cantidad
          proyeccion.resumenPorDia[fecha].total += item.cantidad
        }

        // Mantener estructura original para compatibilidad con frontend
        if (item.tipo_destinatario === "funcionario") {
          if (!proyeccion.funcionarios[item.codigo]) {
            proyeccion.funcionarios[item.codigo] = {
              descripcion: item.descripcion,
              cantidad: 0,
            }
          }
          proyeccion.funcionarios[item.codigo].cantidad += item.cantidad
        } else {
          const nivel = item.nivel || "SIN_NIVEL"
          if (!proyeccion.niveles[nivel]) {
            proyeccion.niveles[nivel] = {}
          }
          if (!proyeccion.niveles[nivel][item.codigo]) {
            proyeccion.niveles[nivel][item.codigo] = {
              descripcion: item.descripcion,
              cantidad: 0,
            }
          }
          proyeccion.niveles[nivel][item.codigo].cantidad += item.cantidad
        }
      })

      console.log("📈 Proyección procesada:", proyeccion)
      proyeccionSemanalRef.current = proyeccion
      setProyeccionSemanal(proyeccion)
    } catch (error) {
      console.error("❌ Error cargando proyección semanal:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportarResumen = async () => {
    setActualizando(true)
    try {
      if (tipoVista === "dia") {
        await cargarResumenDiario()
        if (resumenDiarioRef.current) await exportarResumenDiario()
      } else {
        await cargarProyeccionSemanal()
        if (proyeccionSemanalRef.current) await exportarProyeccionSemanal()
      }
    } finally {
      setActualizando(false)
    }
  }

  const exportarResumenDiario = async () => {
    // Se lee del ref (siempre al día) en vez del estado del componente,
    // para garantizar que lo exportado sea justo lo que se acaba de refrescar.
    const resumenDiario = resumenDiarioRef.current
    if (!resumenDiario) return

    try {
      // Importar dinámicamente la librería
      const XLSX = await import("xlsx-js-style")

      // Definir colores para cada nivel (mismos que casinos)
      const colores = {
        titulo: {
          fill: { fgColor: { rgb: "4F46E5" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        fecha: {
          fill: { fgColor: { rgb: "E5E7EB" } },
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        preschool: {
          fill: { fgColor: { rgb: "DCFCE7" } },
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        lowerschool: {
          fill: { fgColor: { rgb: "FEF3C7" } },
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        middleschool: {
          fill: { fgColor: { rgb: "FEE2E2" } },
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        funcionarios: {
          fill: { fgColor: { rgb: "DBEAFE" } },
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        opcion: {
          alignment: { horizontal: "left", vertical: "center" },
          font: { sz: 10 },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        cantidad: {
          alignment: { horizontal: "center", vertical: "center" },
          font: { sz: 10 },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        totalBloque: {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "000000" } },
            bottom: { style: "thick", color: { rgb: "000000" } },
            left: { style: "thick", color: { rgb: "000000" } },
            right: { style: "thick", color: { rgb: "000000" } },
          },
        },
        especiales: {
          fill: { fgColor: { rgb: "FB923C" } }, // Color naranja
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
      }

      // Crear datos en formato de matriz
      const datosExcel: any[][] = []
      const merges: any[] = []
      const estilos: any = {}

      let filaActual = 0

      // Título principal
      datosExcel.push(["", "RESUMEN PEDIDOS", "", "", "EXTRAS", "", "", "RESUMEN PEDIDOS", "", "", "ESPECIALES"])
      merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 2 } }) // RESUMEN PEDIDOS 1
      merges.push({ s: { r: filaActual, c: 4 }, e: { r: filaActual, c: 5 } }) // EXTRAS
      merges.push({ s: { r: filaActual, c: 7 }, e: { r: filaActual, c: 8 } }) // RESUMEN PEDIDOS 2
      estilos[`B${filaActual + 1}`] = colores.titulo
      estilos[`E${filaActual + 1}`] = colores.titulo
      estilos[`H${filaActual + 1}`] = colores.titulo
      estilos[`K${filaActual + 1}`] = colores.especiales
      filaActual++

      // Fecha
      datosExcel.push(["", resumenDiario.dia_semana.toUpperCase(), "", "", "", "", "", "", "", "", ""])
      merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 9 } })
      estilos[`B${filaActual + 1}`] = colores.fecha
      filaActual++

      // Fila vacía
      datosExcel.push(["", "", "", "", "", "", "", "", "", "", ""])
      filaActual++

      // Definir niveles en orden
      const nivelesOrden = [
        { nombre: "PRESCHOOL", datos: resumenDiario.niveles["PRESCHOOL"] || {}, color: colores.preschool },
        { nombre: "LOWERSCHOOL", datos: resumenDiario.niveles["LOWERSCHOOL"] || {}, color: colores.lowerschool },
        { nombre: "MIDDLESCHOOL", datos: resumenDiario.niveles["MIDDLESCHOOL"] || {}, color: colores.middleschool },
        {
          nombre: "FUNCIONARIO Y HIGH SCHOOL",
          datos: resumenDiario.funcionariosYHighschool || {},
          color: colores.funcionarios,
        },
      ]

      // Procesar cada nivel
      nivelesOrden.forEach((nivel) => {
        // Título del nivel (combinado en cada sección)
        datosExcel.push(["", nivel.nombre, "", "", nivel.nombre, "", "", nivel.nombre, "", "", ""])
        merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 2 } })
        merges.push({ s: { r: filaActual, c: 4 }, e: { r: filaActual, c: 5 } })
        merges.push({ s: { r: filaActual, c: 7 }, e: { r: filaActual, c: 8 } })
        estilos[`B${filaActual + 1}`] = nivel.color
        estilos[`E${filaActual + 1}`] = nivel.color
        estilos[`H${filaActual + 1}`] = nivel.color
        filaActual++

        let totalNivel = 0

        // Opciones 1-4
        for (let i = 1; i <= 4; i++) {
          const cantidad = nivel.datos[i.toString()]?.cantidad || 0
          totalNivel += cantidad

          datosExcel.push([
            "",
            `OPC ${i}`,
            cantidad,
            "",
            `OPC ${i}`,
            0, // Extras editables manualmente
            "",
            `OPC ${i}`,
            { f: `C${filaActual + 1}+F${filaActual + 1}` }, // Suma automática
            "",
            "",
          ])

          // Estilos para opciones
          estilos[`B${filaActual + 1}`] = colores.opcion
          estilos[`C${filaActual + 1}`] = colores.cantidad
          estilos[`E${filaActual + 1}`] = colores.opcion
          estilos[`F${filaActual + 1}`] = colores.cantidad
          estilos[`H${filaActual + 1}`] = colores.opcion
          estilos[`I${filaActual + 1}`] = colores.cantidad

          filaActual++
        }

        // ESPECIAL
        const cantidadEspecial = nivel.datos["ESPECIAL"]?.cantidad || 0
        totalNivel += cantidadEspecial

        datosExcel.push([
          "",
          "ESPECIAL",
          cantidadEspecial,
          "",
          "ESPECIAL",
          0, // Extras editables manualmente
          "",
          "ESPECIAL",
          { f: `C${filaActual + 1}+F${filaActual + 1}` }, // Suma automática
          "",
          "",
        ])

        estilos[`B${filaActual + 1}`] = colores.opcion
        estilos[`C${filaActual + 1}`] = colores.cantidad
        estilos[`E${filaActual + 1}`] = colores.opcion
        estilos[`F${filaActual + 1}`] = colores.cantidad
        estilos[`H${filaActual + 1}`] = colores.opcion
        estilos[`I${filaActual + 1}`] = colores.cantidad

        filaActual++

        // TOTAL del nivel (combinado en cada sección)
        const filaInicioNivel = filaActual - 5 // 4 opciones + especial
        datosExcel.push([
          "",
          "TOTAL",
          { f: `SUM(C${filaInicioNivel + 1}:C${filaInicioNivel + 4})` },
          "",
          "TOTAL",
          { f: `SUM(F${filaInicioNivel + 1}:F${filaInicioNivel + 4})` },
          "",
          "TOTAL",
          { f: `SUM(I${filaInicioNivel + 1}:I${filaInicioNivel + 4})` },
          "",
          "",
        ])

        estilos[`C${filaActual + 1}`] = colores.totalBloque
        estilos[`F${filaActual + 1}`] = colores.totalBloque
        estilos[`I${filaActual + 1}`] = colores.totalBloque

        filaActual++

        // Fila vacía entre niveles
        datosExcel.push(["", "", "", "", "", "", "", "", "", "", ""])
        filaActual++
      })

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()

      // Crear hoja de trabajo
      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel)

      // Configurar anchos de columna
      const columnWidths = [
        { wch: 0.75 }, // A: margen
        { wch: 18.29 }, // B
        { wch: 15.86 }, // C
        { wch: 7.86 }, // D
        { wch: 18.29 }, // E
        { wch: 15.43 }, // F
        { wch: 8.14 }, // G
        { wch: 24.71 }, // H
        { wch: 27.14 }, // I
        { wch: 6 }, // J
        { wch: 145.71 }, // K
      ]
      worksheet["!cols"] = columnWidths

      // Aplicar estilos
      Object.keys(estilos).forEach((cellAddress) => {
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = estilos[cellAddress]
        }
      })

      // Aplicar merges
      worksheet["!merges"] = merges

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen Cocina")

      // Generar nombre de archivo
      const nombreArchivo = `resumen-cocina-${fechaSeleccionada}.xlsx`

      // Descargar archivo
      XLSX.writeFile(workbook, nombreArchivo)
    } catch (error) {
      console.error("Error exportando Excel:", error)
      // Fallback a CSV si falla Excel
      exportarCSVDiario()
    }
  }

  const exportarProyeccionSemanal = async () => {
    const proyeccionSemanal = proyeccionSemanalRef.current
    if (!proyeccionSemanal) return

    try {
      // Importar dinámicamente la librería
      const XLSX = await import("xlsx-js-style")

      // Definir colores (mismos que la vista diaria)
      const colores = {
        titulo: {
          fill: { fgColor: { rgb: "4F46E5" } },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        fecha: {
          fill: { fgColor: { rgb: "E5E7EB" } },
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        opcion: {
          alignment: { horizontal: "left", vertical: "center" },
          font: { sz: 10 },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        cantidad: {
          alignment: { horizontal: "center", vertical: "center" },
          font: { sz: 10 },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
        totalBloque: {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: "thick", color: { rgb: "000000" } },
            bottom: { style: "thick", color: { rgb: "000000" } },
            left: { style: "thick", color: { rgb: "000000" } },
            right: { style: "thick", color: { rgb: "000000" } },
          },
        },
      }

      // Crear datos en formato de matriz
      const datosExcel: any[][] = []
      const merges: any[] = []
      const estilos: any = {}

      let filaActual = 0

      // Título principal
      datosExcel.push(["", "PROYECCIÓN PEDIDOS PARA LA SEMANA", "", "", "", "", "", "", "", "", ""])
      merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 9 } })
      estilos[`B${filaActual + 1}`] = colores.titulo
      filaActual++

      // Fila vacía
      datosExcel.push(["", "", "", "", "", "", "", "", "", "", ""])
      filaActual++

      // Procesar cada día de la semana
      Object.entries(proyeccionSemanal.resumenPorDia)
        .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
        .forEach(([fecha, datosDelDia]) => {
          // Títulos de las 3 secciones
          datosExcel.push([
            "",
            "DISTRIBUCIÓN ALMUERZOS",
            "",
            "",
            "EXTRAS",
            "",
            "",
            "DISTRIBUCIÓN ALMUERZOS",
            "",
            "",
            "",
          ])
          merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 2 } })
          merges.push({ s: { r: filaActual, c: 4 }, e: { r: filaActual, c: 5 } })
          merges.push({ s: { r: filaActual, c: 7 }, e: { r: filaActual, c: 8 } })
          estilos[`B${filaActual + 1}`] = colores.titulo
          estilos[`E${filaActual + 1}`] = colores.titulo
          estilos[`H${filaActual + 1}`] = colores.titulo
          filaActual++

          // Fecha del día
          datosExcel.push([
            "",
            datosDelDia.nombreDia,
            "",
            "",
            datosDelDia.nombreDia,
            "",
            "",
            datosDelDia.nombreDia,
            "",
            "",
            "",
          ])
          merges.push({ s: { r: filaActual, c: 1 }, e: { r: filaActual, c: 2 } })
          merges.push({ s: { r: filaActual, c: 4 }, e: { r: filaActual, c: 5 } })
          merges.push({ s: { r: filaActual, c: 7 }, e: { r: filaActual, c: 8 } })
          estilos[`B${filaActual + 1}`] = colores.fecha
          estilos[`E${filaActual + 1}`] = colores.fecha
          estilos[`H${filaActual + 1}`] = colores.fecha
          filaActual++

          // Headers de especificación
          datosExcel.push([
            "",
            "ESPECIFICACIÓN",
            "TOTAL",
            "",
            "ESPECIFICACIÓN",
            "TOTAL",
            "",
            "ESPECIFICACIÓN",
            "TOTAL",
            "",
            "",
          ])
          estilos[`B${filaActual + 1}`] = colores.opcion
          estilos[`C${filaActual + 1}`] = colores.cantidad
          estilos[`E${filaActual + 1}`] = colores.opcion
          estilos[`F${filaActual + 1}`] = colores.cantidad
          estilos[`H${filaActual + 1}`] = colores.opcion
          estilos[`I${filaActual + 1}`] = colores.cantidad
          filaActual++

          // Opciones 1-4
          for (let i = 1; i <= 4; i++) {
            const cantidad = datosDelDia.opciones[i.toString()] || 0

            datosExcel.push([
              "",
              `OPC ${i}`,
              cantidad,
              "",
              `OPC ${i}`,
              0, // Extras editables manualmente
              "",
              `OPC ${i}`,
              { f: `C${filaActual + 1}+F${filaActual + 1}` }, // Suma automática
              "",
              "",
            ])

            // Estilos para opciones
            estilos[`B${filaActual + 1}`] = colores.opcion
            estilos[`C${filaActual + 1}`] = colores.cantidad
            estilos[`E${filaActual + 1}`] = colores.opcion
            estilos[`F${filaActual + 1}`] = colores.cantidad
            estilos[`H${filaActual + 1}`] = colores.opcion
            estilos[`I${filaActual + 1}`] = colores.cantidad

            filaActual++
          }

          // TOTAL del día (solo suma las 4 opciones)
          const filaInicioOpciones = filaActual - 4
          datosExcel.push([
            "",
            "TOTAL",
            { f: `SUM(C${filaInicioOpciones + 1}:C${filaInicioOpciones + 4})` },
            "",
            "TOTAL",
            { f: `SUM(F${filaInicioOpciones + 1}:F${filaInicioOpciones + 4})` },
            "",
            "TOTAL",
            { f: `SUM(I${filaInicioOpciones + 1}:I${filaInicioOpciones + 4})` },
            "",
            "",
          ])

          estilos[`C${filaActual + 1}`] = colores.totalBloque
          estilos[`F${filaActual + 1}`] = colores.totalBloque
          estilos[`I${filaActual + 1}`] = colores.totalBloque

          filaActual++

          // Fila vacía entre días
          datosExcel.push(["", "", "", "", "", "", "", "", "", "", ""])
          filaActual++
        })

      // Crear libro de trabajo
      const workbook = XLSX.utils.book_new()

      // Crear hoja de trabajo
      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel)

      // Configurar anchos de columna (mismos que vista diaria)
      const columnWidths = [
        { wch: 0.75 }, // A: margen
        { wch: 18.29 }, // B
        { wch: 15.86 }, // C
        { wch: 7.86 }, // D
        { wch: 18.29 }, // E
        { wch: 15.43 }, // F
        { wch: 8.14 }, // G
        { wch: 24.71 }, // H
        { wch: 27.14 }, // I
        { wch: 6 }, // J
        { wch: 145.71 }, // K
      ]
      worksheet["!cols"] = columnWidths

      // Aplicar estilos
      Object.keys(estilos).forEach((cellAddress) => {
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = estilos[cellAddress]
        }
      })

      // Aplicar merges
      worksheet["!merges"] = merges

      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(workbook, worksheet, "Proyección Semanal")

      // Generar nombre de archivo
      const nombreArchivo = `proyeccion-semanal-${fechaSeleccionada}.xlsx`

      // Descargar archivo
      XLSX.writeFile(workbook, nombreArchivo)
    } catch (error) {
      console.error("Error exportando Excel:", error)
      // Fallback a CSV si falla Excel
      exportarCSVSemanal()
    }
  }

  const exportarCSVDiario = () => {
    const resumenDiario = resumenDiarioRef.current
    if (!resumenDiario) return

    const headers = ["Fecha", "Día", "Nivel", "Código", "Descripción", "Cantidad", "Tipo"]
    const filas: string[] = []

    // Estudiantes por nivel (sin HIGHSCHOOL)
    NIVELES_ORDEN.forEach((nivel) => {
      if (resumenDiario.niveles[nivel]) {
        Object.entries(resumenDiario.niveles[nivel]).forEach(([codigo, opcion]) => {
          filas.push(
            [
              resumenDiario.fecha,
              resumenDiario.dia_semana,
              nivel,
              codigo,
              `"${opcion.descripcion}"`,
              opcion.cantidad.toString(),
              "Estudiante",
            ].join(","),
          )
        })
      }
    })

    // Funcionarios y Highschool combinados
    Object.entries(resumenDiario.funcionariosYHighschool).forEach(([codigo, opcion]) => {
      filas.push(
        [
          resumenDiario.fecha,
          resumenDiario.dia_semana,
          "FUNCIONARIO Y HIGH SCHOOL",
          codigo,
          `"${opcion.descripcion}"`,
          opcion.cantidad.toString(),
          "Combinado",
        ].join(","),
      )
    })

    const csvCompleto = [headers.join(","), ...filas].join("\n")
    descargarArchivo(csvCompleto, `resumen-cocina-${fechaSeleccionada}.csv`, "text/csv")
  }

  const exportarCSVSemanal = () => {
    const proyeccionSemanal = proyeccionSemanalRef.current
    if (!proyeccionSemanal) return

    const headers = ["Día", "Fecha", "Opción", "Cantidad"]
    const filas: string[] = []

    // Procesar cada día
    Object.entries(proyeccionSemanal.resumenPorDia)
      .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
      .forEach(([fecha, datosDelDia]) => {
        const opcionesDisponibles = ["1", "2", "3", "4"]

        opcionesDisponibles.forEach((codigo) => {
          const cantidad = datosDelDia.opciones[codigo] || 0
          filas.push([`"${datosDelDia.nombreDia}"`, fecha, `OPC. ${codigo}`, cantidad.toString()].join(","))
        })
      })

    const csvCompleto = [headers.join(","), ...filas].join("\n")
    descargarArchivo(csvCompleto, `proyeccion-semanal-${fechaSeleccionada}.csv`, "text/csv")
  }

  const descargarArchivo = (contenido: string, nombreArchivo: string, tipo: string) => {
    const blob = new Blob([contenido], { type: `${tipo};charset=utf-8;` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = nombreArchivo
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <AvisoNuevosPedidos visible={hayNuevos} onActualizar={actualizarAhora} actualizando={actualizando} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resumen para Cocina</h1>
          <p className="text-gray-600 mt-2">
            {tipoVista === "dia"
              ? "Cantidades por nivel y funcionarios para preparación diaria (solo pedidos pagados)"
              : "Proyección semanal de cantidades - Lunes a Viernes (solo pedidos pagados)"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={tipoVista} onValueChange={(value: "dia" | "proyeccion") => setTipoVista(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dia">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Vista Diaria
                </div>
              </SelectItem>
              <SelectItem value="proyeccion">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Proyección Semanal
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={fechaSeleccionada} onValueChange={setFechaSeleccionada}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar fecha" />
            </SelectTrigger>
            <SelectContent>
              {fechasDisponibles.map((fecha) => (
                <SelectItem key={fecha} value={fecha}>
                  {formatearFecha(fecha)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={exportarResumen} disabled={!resumenDiario && !proyeccionSemanal}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              setActualizando(true)
              try {
                await cargarResumenDiario()
                if (resumenDiarioRef.current) exportarResumenPDF(resumenDiarioRef.current)
              } finally {
                setActualizando(false)
              }
            }}
            disabled={!resumenDiario}
          >
           <FileText className="h-4 w-4 mr-2" />
           Exportar PDF
          </Button>
        </div>
      </div>

      {/* Vista Diaria */}
      {tipoVista === "dia" && (
        <div className="space-y-6">
          {!resumenDiario ? (
            <Card>
              <CardContent className="text-center py-12">
                <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay datos de cocina para la fecha seleccionada</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {resumenDiario.dia_semana}
                  <Badge variant="outline" className="ml-2">
                    Solo pedidos pagados
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Estudiantes por nivel con colores */}
                  {NIVELES_ORDEN.map((nivel) => {
                    const opcionesNivel = resumenDiario.niveles[nivel]
                    if (!opcionesNivel || Object.keys(opcionesNivel).length === 0) return null

                    // Definir colores según el nivel
                    let colorClasses = ""
                    let iconColor = ""
                    switch (nivel) {
                      case "PRESCHOOL":
                        colorClasses = "bg-green-100 border-green-300"
                        iconColor = "text-green-600"
                        break
                      case "LOWERSCHOOL":
                        colorClasses = "bg-yellow-100 border-yellow-300"
                        iconColor = "text-yellow-600"
                        break
                      case "MIDDLESCHOOL":
                        colorClasses = "bg-red-100 border-red-300"
                        iconColor = "text-red-600"
                        break
                      default:
                        colorClasses = "bg-gray-100 border-gray-300"
                        iconColor = "text-gray-600"
                    }

                    return (
                      <div key={nivel} className={`border rounded-lg p-4 ${colorClasses}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCap className={`h-5 w-5 ${iconColor}`} />
                          <h4 className="font-semibold text-lg">{nivel}</h4>
                          <Badge variant="secondary">
                            {Object.values(opcionesNivel).reduce((sum, op) => sum + op.cantidad, 0)} total
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {Object.entries(opcionesNivel)
                            .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
                            .map(([codigo, opcion]) => (
                              <div
                                key={codigo}
                                className="flex items-center justify-between p-3 bg-white rounded border"
                              >
                                <div>
                                  <p className="font-medium text-sm">OPC {codigo}</p>
                                </div>
                                <Badge variant="secondary" className="ml-2">
                                  {opcion.cantidad}
                                </Badge>
                              </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-lg">TOTAL</p>
                            <Badge variant="default" className="text-lg px-3 py-1">
                              {Object.values(opcionesNivel).reduce((sum, op) => sum + op.cantidad, 0)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Funcionarios y Highschool combinados con color azul */}
                  {Object.keys(resumenDiario.funcionariosYHighschool).length > 0 && (
                    <div className="border rounded-lg p-4 bg-blue-100 border-blue-300">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-lg">FUNCIONARIO Y HIGH SCHOOL</h4>
                        <Badge variant="secondary">
                          {Object.values(resumenDiario.funcionariosYHighschool).reduce(
                            (sum, op) => sum + op.cantidad,
                            0,
                          )}{" "}
                          total
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {Object.entries(resumenDiario.funcionariosYHighschool)
                          .sort(([a], [b]) => Number.parseInt(a) - Number.parseInt(b))
                          .map(([codigo, opcion]) => (
                            <div key={codigo} className="flex items-center justify-between p-3 bg-white rounded border">
                              <div>
                                <p className="font-medium text-sm">OPC {codigo}</p>
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                {opcion.cantidad}
                              </Badge>
                            </div>
                          ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-300">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-lg">TOTAL</p>
                          <Badge variant="default" className="text-lg px-4 py-2">
                            {Object.values(resumenDiario.funcionariosYHighschool).reduce(
                              (sum, op) => sum + op.cantidad,
                              0,
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Total general con fondo gris */}
                  <div className="border rounded-lg p-4 bg-gray-200 border-gray-400">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xl">TOTAL PEDIDOS</h4>
                      <Badge variant="default" className="text-xl px-4 py-2">
                        {NIVELES_ORDEN.reduce((total, nivel) => {
                          const opcionesNivel = resumenDiario.niveles[nivel]
                          return (
                            total +
                            (opcionesNivel ? Object.values(opcionesNivel).reduce((sum, op) => sum + op.cantidad, 0) : 0)
                          )
                        }, 0) +
                          Object.values(resumenDiario.funcionariosYHighschool).reduce(
                            (sum, op) => sum + op.cantidad,
                            0,
                          )}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Vista Proyección Semanal */}
      {tipoVista === "proyeccion" && (
        <div className="space-y-6">
          {!proyeccionSemanal ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay datos para la proyección semanal</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Proyección Semanal: {proyeccionSemanal.semana}
                  <Badge variant="outline" className="ml-2">
                    Solo pedidos pagados
                  </Badge>
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Vista por día individual - Formato de exportación optimizado para cocina
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Mostrar resumen por día */}
                  {Object.entries(proyeccionSemanal.resumenPorDia)
                    .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
                    .map(([fecha, datosDelDia]) => (
                      <div key={fecha} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-lg">{datosDelDia.nombreDia}</h4>
                          <Badge variant="secondary">{datosDelDia.total} total</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["1", "2", "3", "4"].map((codigo) => {
                            const cantidad = datosDelDia.opciones[codigo] || 0
                            return (
                              <div key={codigo} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                <p className="font-medium text-sm">OPC. {codigo}</p>
                                <Badge variant="secondary" className="ml-2">
                                  {cantidad}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
