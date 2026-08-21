import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface ResumenCocina {
  fecha: string
  dia_semana: string
  niveles: {
    [nivel: string]: {
      [codigo: string]: { descripcion: string; cantidad: number }
    }
  }
  funcionariosYHighschool: {
    [codigo: string]: { descripcion: string; cantidad: number }
  }
}

const NIVELES_ORDEN = ["PRESCHOOL", "LOWERSCHOOL", "MIDDLESCHOOL"]
const OPCIONES_KEYS = ["1", "2", "3", "4", "ESPECIAL"]
const OPCIONES_LABELS = ["OPC 1", "OPC 2", "OPC 3", "OPC 4", "ESPECIAL"]

export function exportarResumenPDF(resumenDiario: ResumenCocina) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  })

  const fechaFormateada = new Date(resumenDiario.fecha + "T12:00:00")
    .toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .toUpperCase()

  // Título
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("RESUMEN PEDIDOS", doc.internal.pageSize.width / 2, 15, { align: "center" })

  // Fecha
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(fechaFormateada, doc.internal.pageSize.width / 2, 21, { align: "center" })

  // Preparar datos para la tabla
  const tableData: (string | number)[][] = []

  let totalGeneral = 0

  // Agregar niveles en orden
  NIVELES_ORDEN.forEach((nivel) => {
    const nivelData = resumenDiario.niveles[nivel]
    if (nivelData) {
      // Header del nivel
      tableData.push([nivel, ""])

      let total = 0
      OPCIONES_KEYS.forEach((key, index) => {
        const opcionData = nivelData[key]
        const cantidad = opcionData?.cantidad || 0
        tableData.push([OPCIONES_LABELS[index], cantidad])
        if (key !== "ESPECIAL") {
          total += cantidad
        }
      })

      // Total del nivel
      tableData.push(["TOTAL", total])

      totalGeneral += total

      // Espacio entre niveles
      tableData.push(["", ""])
    }
  })

  // Agregar FUNCIONARIO Y HIGH SCHOOL
  const funcionarios = resumenDiario.funcionariosYHighschool
  if (funcionarios) {
    tableData.push(["FUNCIONARIO Y HIGH SCHOOL", ""])

    let total = 0
    OPCIONES_KEYS.forEach((key, index) => {
      const opcionData = funcionarios[key]
      const cantidad = opcionData?.cantidad || 0
      tableData.push([OPCIONES_LABELS[index], cantidad])
      if (key !== "ESPECIAL") {
        total += cantidad
      }
    })

    tableData.push(["TOTAL", total])

    totalGeneral += total
  }

  autoTable(doc, {
    startY: 26,
    head: [],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 1.5,
      halign: "left",
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: "normal" },
      1: { cellWidth: 20, halign: "center" },
    },
    margin: { left: 20, right: 20 },
    didParseCell: (data) => {
      const rowData = data.row.raw as (string | number)[]
      const firstCell = rowData[0]?.toString() || ""

      // Headers de nivel (PRESCHOOL, LOWERSCHOOL, etc.)
      if (
        firstCell === "PRESCHOOL" ||
        firstCell === "LOWERSCHOOL" ||
        firstCell === "MIDDLESCHOOL" ||
        firstCell === "FUNCIONARIO Y HIGH SCHOOL"
      ) {
        data.cell.styles.fillColor = [230, 230, 230]
        data.cell.styles.fontStyle = "bold"
        data.cell.styles.fontSize = 10
      }

      // Filas TOTAL
      if (firstCell === "TOTAL") {
        data.cell.styles.fontStyle = "bold"
        if (data.column.index === 1) {
          data.cell.styles.fillColor = [255, 255, 200]
        }
      }

      // Filas vacías (separadores)
      if (firstCell === "" && rowData[1] === "") {
        data.cell.styles.fillColor = [255, 255, 255]
        data.cell.styles.lineWidth = 0
      }
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY || 150
  const boxX = 120
  const boxY = 40
  const boxWidth = 50
  const boxHeight = 25

  // Dibujar recuadro
  doc.setDrawColor(0)
  doc.setLineWidth(0.5)
  doc.rect(boxX, boxY, boxWidth, boxHeight)

  // Título del recuadro
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.text("TOTAL GENERAL", boxX + boxWidth / 2, boxY + 8, { align: "center" })

  // Número total
  doc.setFontSize(16)
  doc.text(totalGeneral.toString(), boxX + boxWidth / 2, boxY + 18, { align: "center" })

  // Guardar PDF
  const nombreArchivo = `resumen-pedidos-${resumenDiario.fecha}.pdf`
  doc.save(nombreArchivo)
}
