import * as XLSX from "xlsx-js-style"

interface ItemFinanzas {
  id: number
  fecha: string
  subtotal: number
  estado_pago: string
  pedido_id?: number
  producto?: string
  cantidad?: number
  precio_unitario?: number
}

interface TotalesSemana {
  pagado: { monto: number; cantidad: number }
  fmd: { monto: number; cantidad: number }
  pgc: { monto: number; cantidad: number }
  total: { monto: number; cantidad: number }
}

// Estilos para el Excel
const estiloEncabezado = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "4472C4" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
  },
}

const estiloTotal = {
  font: { bold: true },
  fill: { fgColor: { rgb: "E7E6E6" } },
  alignment: { horizontal: "right" },
}

const estiloMonto = {
  alignment: { horizontal: "right" },
  numFmt: "$#,##0",
}

const estiloCelda = {
  border: {
    top: { style: "thin", color: { rgb: "D3D3D3" } },
    bottom: { style: "thin", color: { rgb: "D3D3D3" } },
    left: { style: "thin", color: { rgb: "D3D3D3" } },
    right: { style: "thin", color: { rgb: "D3D3D3" } },
  },
}

/**
 * Exporta los datos de una semana a Excel con formato profesional
 */
export function exportarSemanaExcel(
  items: ItemFinanzas[],
  nombreSemana: string,
  totales: TotalesSemana,
  mes: string,
  año: number,
) {
  const wb = XLSX.utils.book_new()

  // Crear datos de la hoja
  const datos: any[][] = [
    ["REPORTE FINANCIERO SEMANAL"],
    [nombreSemana],
    [`Mes: ${mes} ${año}`],
    [],
    ["Fecha", "Pedido ID", "Estado", "Subtotal"],
  ]

  // Agregar items
  items.forEach((item) => {
    datos.push([item.fecha, item.pedido_id || "-", item.estado_pago.toUpperCase(), item.subtotal])
  })

  // Agregar filas vacías antes de totales
  datos.push([])
  datos.push([])

  // Agregar resumen de totales
  datos.push(["RESUMEN DE ITEMS", "", "", ""])
  datos.push(["Estado", "Cantidad", "", "Monto Total"])
  datos.push(["Pagado", totales.pagado.cantidad, "", totales.pagado.monto])
  datos.push(["FMD", totales.fmd.cantidad, "", totales.fmd.monto])
  datos.push(["PGC", totales.pgc.cantidad, "", totales.pgc.monto])
  datos.push([])
  datos.push(["TOTAL GENERAL", totales.total.cantidad, "", totales.total.monto])

  // Crear worksheet
  const ws = XLSX.utils.aoa_to_sheet(datos)

  // Aplicar estilos al título
  ws["A1"].s = {
    font: { bold: true, sz: 16, color: { rgb: "1F4E78" } },
    alignment: { horizontal: "center" },
  }

  // Merge del título
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // Título principal
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // Semana
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } }, // Mes
  ]

  // Aplicar estilos a encabezados (fila 5, índice 4)
  const encabezadoRow = 4
  for (let col = 0; col < 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: encabezadoRow, c: col })
    if (!ws[cellAddress]) ws[cellAddress] = { v: "" }
    ws[cellAddress].s = estiloEncabezado
  }

  // Aplicar estilos a datos
  const inicioFilas = 5
  const finFilas = 5 + items.length - 1

  for (let row = inicioFilas; row <= finFilas; row++) {
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[cellAddress]) {
        ws[cellAddress].s = estiloCelda

        // Aplicar formato de monto a la columna de Subtotal (columna 3)
        if (col === 3) {
          ws[cellAddress].s = { ...estiloCelda, ...estiloMonto }
        }
      }
    }
  }

  // Aplicar estilos a la sección de resumen
  const inicioResumen = 5 + items.length + 3
  for (let i = 0; i < 7; i++) {
    const cellAddressA = XLSX.utils.encode_cell({ r: inicioResumen + i, c: 0 })
    const cellAddressB = XLSX.utils.encode_cell({ r: inicioResumen + i, c: 1 })
    const cellAddressD = XLSX.utils.encode_cell({ r: inicioResumen + i, c: 3 })

    if (ws[cellAddressA]) ws[cellAddressA].s = estiloTotal
    if (ws[cellAddressB]) ws[cellAddressB].s = estiloCelda
    if (ws[cellAddressD]) {
      ws[cellAddressD].s = { ...estiloCelda, ...estiloMonto }
    }
  }

  // Ajustar anchos de columna
  ws["!cols"] = [
    { wch: 12 }, // Fecha
    { wch: 12 }, // Pedido ID
    { wch: 12 }, // Estado
    { wch: 15 }, // Subtotal
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Reporte Semanal")

  // Generar nombre de archivo
  const inicioNum = nombreSemana.match(/del (\d+)/)?.[1] || "01"
  const finNum = nombreSemana.match(/al (\d+)/)?.[1] || "07"
  const nombreArchivo = `finanzas-${mes.toLowerCase()}-${año}-semana-${inicioNum}-${finNum}.xlsx`

  // Descargar archivo
  XLSX.writeFile(wb, nombreArchivo)
}

/**
 * Exporta el reporte completo del mes con múltiples hojas
 */
export function exportarMesCompletoExcel(
  semanasData: Array<{
    semana: { texto: string; inicioNum: number; finNum: number }
    pedidos: ItemFinanzas[]
    totales: TotalesSemana
  }>,
  mes: string,
  año: number,
  resumenMes: TotalesSemana,
) {
  const wb = XLSX.utils.book_new()

  // ==================== HOJA DE RESUMEN ====================
  const resumenData: any[][] = [
    ["REPORTE FINANCIERO MENSUAL"],
    [`${mes.toUpperCase()} ${año}`],
    [],
    ["RESUMEN GENERAL"],
    [],
    ["Concepto", "Cantidad de Items", "Monto Total"],
    ["Pagado", resumenMes.pagado.cantidad, resumenMes.pagado.monto],
    ["FMD", resumenMes.fmd.cantidad, resumenMes.fmd.monto],
    ["PGC", resumenMes.pgc.cantidad, resumenMes.pgc.monto],
    [],
    ["TOTAL MES", resumenMes.total.cantidad, resumenMes.total.monto],
    [],
    [],
    ["DESGLOSE POR SEMANAS"],
    [],
  ]

  // Agregar resumen de cada semana
  semanasData.forEach((semanaData, index) => {
    resumenData.push([
      `Semana ${index + 1}`,
      semanaData.semana.texto,
      semanaData.totales.total.cantidad,
      semanaData.totales.total.monto,
    ])
  })

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)

  // Estilos para hoja de resumen
  wsResumen["A1"].s = {
    font: { bold: true, sz: 18, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "1F4E78" } },
    alignment: { horizontal: "center", vertical: "center" },
  }

  wsResumen["A2"].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "center" },
  }

  // Merge del título
  wsResumen["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]

  // Estilos para encabezados
  for (let col = 0; col < 3; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 5, c: col })
    if (wsResumen[cellAddress]) {
      wsResumen[cellAddress].s = estiloEncabezado
    }
  }

  // Estilos para datos del resumen
  for (let row = 6; row <= 8; row++) {
    for (let col = 0; col < 3; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (wsResumen[cellAddress]) {
        wsResumen[cellAddress].s = estiloCelda
        if (col === 2) {
          wsResumen[cellAddress].s = { ...estiloCelda, ...estiloMonto }
        }
      }
    }
  }

  // Estilo para total
  const totalRow = 10
  for (let col = 0; col < 3; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRow, c: col })
    if (wsResumen[cellAddress]) {
      wsResumen[cellAddress].s = { ...estiloTotal, fill: { fgColor: { rgb: "FFD966" } } }
      if (col === 2) {
        wsResumen[cellAddress].s = { ...estiloTotal, ...estiloMonto, fill: { fgColor: { rgb: "FFD966" } } }
      }
    }
  }

  wsResumen["!cols"] = [{ wch: 25 }, { wch: 45 }, { wch: 20 }, { wch: 18 }]

  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Mensual")

  // ==================== HOJAS POR SEMANA ====================
  semanasData.forEach((semanaData, index) => {
    const datos: any[][] = [
      [`SEMANA ${index + 1}`],
      [semanaData.semana.texto],
      [],
      ["Fecha", "Pedido ID", "Estado", "Subtotal"],
    ]

    // Agregar items
    semanaData.pedidos.forEach((item) => {
      datos.push([item.fecha, item.pedido_id || "-", item.estado_pago.toUpperCase(), item.subtotal])
    })

    // Agregar totales
    datos.push([])
    datos.push([])
    datos.push(["RESUMEN", "", "", ""])
    datos.push(["Pagado", semanaData.totales.pagado.cantidad, "", semanaData.totales.pagado.monto])
    datos.push(["FMD", semanaData.totales.fmd.cantidad, "", semanaData.totales.fmd.monto])
    datos.push(["PGC", semanaData.totales.pgc.cantidad, "", semanaData.totales.pgc.monto])
    datos.push([])
    datos.push(["TOTAL", semanaData.totales.total.cantidad, "", semanaData.totales.total.monto])

    const ws = XLSX.utils.aoa_to_sheet(datos)

    // Estilos
    ws["A1"].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" },
    }

    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    ]

    // Encabezados
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col })
      if (!ws[cellAddress]) ws[cellAddress] = { v: "" }
      ws[cellAddress].s = estiloEncabezado
    }

    // Datos
    for (let row = 4; row < 4 + semanaData.pedidos.length; row++) {
      for (let col = 0; col < 4; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
        if (ws[cellAddress]) {
          ws[cellAddress].s = estiloCelda
          if (col === 3) {
            ws[cellAddress].s = { ...estiloCelda, ...estiloMonto }
          }
        }
      }
    }

    ws["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]

    XLSX.utils.book_append_sheet(wb, ws, `Semana ${index + 1}`)
  })

  // ==================== HOJA CON TODOS LOS ITEMS ====================
  const todosItems = semanasData.flatMap((s) => s.pedidos)

  const datosCompletos: any[][] = [
    ["TODOS LOS ITEMS DEL MES"],
    [`${mes.toUpperCase()} ${año}`],
    [],
    ["Fecha", "Pedido ID", "Estado", "Subtotal"],
  ]

  todosItems.forEach((item) => {
    datosCompletos.push([item.fecha, item.pedido_id || "-", item.estado_pago.toUpperCase(), item.subtotal])
  })

  const wsTodos = XLSX.utils.aoa_to_sheet(datosCompletos)

  wsTodos["A1"].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "center" },
  }

  wsTodos["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
  ]

  for (let col = 0; col < 4; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 3, c: col })
    if (!wsTodos[cellAddress]) wsTodos[cellAddress] = { v: "" }
    wsTodos[cellAddress].s = estiloEncabezado
  }

  for (let row = 4; row < 4 + todosItems.length; row++) {
    for (let col = 0; col < 4; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (wsTodos[cellAddress]) {
        wsTodos[cellAddress].s = estiloCelda
        if (col === 3) {
          wsTodos[cellAddress].s = { ...estiloCelda, ...estiloMonto }
        }
      }
    }
  }

  wsTodos["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]

  XLSX.utils.book_append_sheet(wb, wsTodos, "Todos los Items")

  // Descargar archivo
  const nombreArchivo = `finanzas-${mes.toLowerCase()}-${año}-completo.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}
