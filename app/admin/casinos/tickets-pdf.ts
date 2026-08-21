import jsPDF from "jspdf"

// Interfaz para los pedidos
interface PedidoCasino {
  id: string
  destinatario: string
  curso: string | null
  codigo: string
  descripcion: string
  estado_pago: string
}

// Colores de texto por opción (versión oscura para contraste)
const getColorTextoOpcion = (codigo: string): [number, number, number] => {
  switch (codigo) {
    case "1":
      return [184, 138, 0] // Amarillo oscuro
    case "2":
      return [106, 90, 205] // Morado
    case "3":
      return [205, 92, 92] // Rojo/Rosa
    case "4":
      return [34, 139, 34] // Verde
    default:
      return [0, 0, 0] // Negro
  }
}

const filtrarCursos2a10 = (pedidos: PedidoCasino[]): PedidoCasino[] => {
  return pedidos.filter((pedido) => {
    if (!pedido.curso) return false
    const match = pedido.curso.match(/(\d+)/)
    if (!match) return false
    const numeroCurso = Number.parseInt(match[1])
    return numeroCurso >= 2 && numeroCurso <= 10
  })
}

const ordenarPorOpcionYCurso = (estudiantes: PedidoCasino[]) => {
  return [...estudiantes].sort((a, b) => {
    // Primero ordenar por código de opción (color)
    const opcionA = Number.parseInt(a.codigo) || 99
    const opcionB = Number.parseInt(b.codigo) || 99
    if (opcionA !== opcionB) return opcionA - opcionB

    // Luego por curso
    const extraerNumeroCurso = (curso: string | null): number => {
      if (!curso) return 999
      const match = curso.match(/(\d+)/)
      return match ? Number.parseInt(match[1]) : 999
    }
    const extraerLetraCurso = (curso: string | null): string => {
      if (!curso) return "Z"
      const match = curso.match(/\d+°?([A-Z]?)/)
      return match?.[1] || "A"
    }

    const cursoNumA = extraerNumeroCurso(a.curso)
    const cursoNumB = extraerNumeroCurso(b.curso)
    if (cursoNumA !== cursoNumB) return cursoNumA - cursoNumB

    const cursoLetraA = extraerLetraCurso(a.curso)
    const cursoLetraB = extraerLetraCurso(b.curso)
    if (cursoLetraA !== cursoLetraB) return cursoLetraA.localeCompare(cursoLetraB)

    // Finalmente por nombre
    return a.destinatario.localeCompare(b.destinatario)
  })
}

// Función para ordenar por curso y nombre (igual que excel-exporter)
const ordenarPorCursoYNombre = (estudiantes: PedidoCasino[]) => {
  return [...estudiantes].sort((a, b) => {
    const extraerInfoCurso = (curso: string | null) => {
      if (!curso) return { numero: 0, letra: "Z", original: "" }
      const cursoUpper = curso.toUpperCase()
      if (cursoUpper.includes("PLAYGROUP") || cursoUpper.includes("PG")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -3, letra, original: curso }
      }
      if (cursoUpper.includes("PRE-KINDER") || cursoUpper.includes("PREKINDER") || cursoUpper.includes("PK")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -2, letra, original: curso }
      }
      if (cursoUpper.includes("KINDER") && !cursoUpper.includes("PRE")) {
        const letra = curso.match(/([A-Z])$/)?.[1] || "A"
        return { numero: -1, letra, original: curso }
      }
      const match = curso.match(/(\d+)°?([A-Z]?)/)
      if (match) {
        const numero = Number.parseInt(match[1])
        const letra = match[2] || "A"
        return { numero, letra, original: curso }
      }
      return { numero: 999, letra: "Z", original: curso }
    }

    const cursoA = extraerInfoCurso(a.curso)
    const cursoB = extraerInfoCurso(b.curso)

    if (cursoA.numero !== cursoB.numero) return cursoA.numero - cursoB.numero
    if (cursoA.letra !== cursoB.letra) return cursoA.letra.localeCompare(cursoB.letra)
    return a.destinatario.localeCompare(b.destinatario)
  })
}

export const exportarTicketsPDF = (pedidos: PedidoCasino[], fecha: string) => {
  // Dimensiones del ticket en mm
  const TICKET_ANCHO = 50 // 5 cm
  const TICKET_ALTO = 45 // 4.5 cm
  const MARGEN_PAGINA = 10
  const PADDING_TICKET = 3
  const FONT_SIZE = 12 // Tamaño base que se escalará

  // Crear PDF en tamaño carta
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter", // 216mm x 279mm
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Calcular cuántos tickets caben por fila y columna
  const ticketsPorFila = Math.floor((pageWidth - MARGEN_PAGINA * 2) / TICKET_ANCHO)
  const ticketsPorColumna = Math.floor((pageHeight - MARGEN_PAGINA * 2) / TICKET_ALTO)
  const ticketsPorPagina = ticketsPorFila * ticketsPorColumna

  // Formatear fecha para mostrar en tickets (DD/MM/YYYY)
  const [anio, mes, dia] = fecha.split("-")
  const fechaTicket = `${dia}/${mes}/${anio}`

  const pedidosFiltrados = filtrarCursos2a10(pedidos)
  const pedidosOrdenados = ordenarPorOpcionYCurso(pedidosFiltrados)

  pedidosOrdenados.forEach((pedido, index) => {
    // Calcular si necesitamos nueva página
    const indexEnPagina = index % ticketsPorPagina
    if (index > 0 && indexEnPagina === 0) {
      doc.addPage()
    }

    // Calcular posición del ticket
    const fila = Math.floor(indexEnPagina / ticketsPorFila)
    const columna = indexEnPagina % ticketsPorFila
    const x = MARGEN_PAGINA + columna * TICKET_ANCHO
    const y = MARGEN_PAGINA + fila * TICKET_ALTO

    // Dibujar borde del ticket
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.rect(x, y, TICKET_ANCHO, TICKET_ALTO)

    // Configurar color según opción
    const [r, g, b] = getColorTextoOpcion(pedido.codigo)
    doc.setTextColor(r, g, b)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(FONT_SIZE)

    // Preparar texto
    const nombre = pedido.destinatario.toUpperCase()
    const curso = pedido.curso?.toUpperCase() || ""
    const opcion = `OPC ${pedido.codigo}`

    // Área de texto dentro del ticket
    const textX = x + PADDING_TICKET
    const textY = y + PADDING_TICKET + 4
    const maxWidth = TICKET_ANCHO - PADDING_TICKET * 2

    // Escribir nombre con word-wrap
    const lineasNombre = doc.splitTextToSize(nombre, maxWidth)
    let currentY = textY

    lineasNombre.forEach((linea: string) => {
      doc.text(linea, textX, currentY)
      currentY += 5
    })

    // Escribir curso
    currentY += 1
    doc.text(curso, textX, currentY)
    currentY += 5

    // Escribir opción
    currentY += 1
    doc.setFontSize(FONT_SIZE + 2)
    doc.text(opcion, textX, currentY)

    // Escribir fecha de entrega
    currentY += 6
    doc.setTextColor(80, 80, 80)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(FONT_SIZE - 2)
    doc.text(fechaTicket, textX, currentY)
  })

  // Formatear fecha para nombre del archivo
  const fechaFormateada = fecha.replace(/-/g, "")
  doc.save(`tickets_casinos_${fechaFormateada}.pdf`)
}
