// Función para ordenar por curso y nombre
const ordenarPorCursoYNombre = (estudiantes: any[]) => {
  return estudiantes.sort((a, b) => {
    // Extraer información del curso
    const extraerInfoCurso = (curso: string | null) => {
      if (!curso) return { numero: 0, letra: "Z", original: "" }

      const cursoUpper = curso.toUpperCase()

      // Manejar casos especiales de PRESCHOOL con jerarquía correcta
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

      // Extraer número y letra del formato "1°A", "10°B", etc.
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

    // Ordenar por número de curso
    if (cursoA.numero !== cursoB.numero) {
      return cursoA.numero - cursoB.numero
    }

    // Si el número es igual, ordenar por letra
    if (cursoA.letra !== cursoB.letra) {
      return cursoA.letra.localeCompare(cursoB.letra)
    }

    // Si curso es igual, ordenar por nombre
    return a.destinatario.localeCompare(b.destinatario)
  })
}

// Función para formatear fecha en español
const formatearFechaCompleta = (fechaStr: string) => {
  const [y, m, d] = fechaStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return date
    .toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
    .toUpperCase()
}

// Función para obtener color RGB del header por nivel
const getColorHeaderRGB = (nivel: string): string => {
  switch (nivel) {
    case "PRESCHOOL":
      return "CCFF99"
    case "LOWERSCHOOL":
      return "FFFF99"
    case "MIDDLESCHOOL":
      return "FF420E"
    case "HIGH SCHOOL":
    case "HIGH SCHOOL (9° - 10°)":
    case "HIGH SCHOOL (11° - 12°)":
    case "HIGHSCHOOL":
      return "0066CC"
    case "FUNCIONARIOS":
      return "0066CC"
    default:
      return "6B7280"
  }
}

// Función para obtener color RGB de la opción
const getColorOpcionRGB = (codigo: string): string => {
  switch (codigo) {
    case "1":
      return "FEFFCC"
    case "2":
      return "CCCCFF"
    case "3":
      return "FFC7C7"
    case "4":
      return "CCFFCC"
    default:
      return "F3F4F6"
  }
}

// Estilos para Excel
const estiloTitulo = {
  font: { bold: true, size: 14, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "medium" },
    right: { style: "medium" },
  },
}

const estiloTituloSubrayado = {
  font: { bold: true, size: 14, color: { rgb: "000000" }, underline: true },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "medium" },
    right: { style: "medium" },
  },
}

const estiloOpcionesSubrayado = {
  font: { bold: true, size: 12, color: { rgb: "000000" }, underline: true },
  alignment: { horizontal: "left", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloFechaGris = {
  font: { bold: true, color: { rgb: "000000" } },
  fill: { fgColor: { rgb: "D9D9D9" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "medium" },
    right: { style: "medium" },
  },
}

const estiloOpcionesGris = {
  fill: { fgColor: { rgb: "D9D9D9" } },
  font: { color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloCelda = {
  font: { color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloTotalGris = {
  fill: { fgColor: { rgb: "6B7280" } },
  font: { color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "medium" },
    bottom: { style: "medium" },
    left: { style: "medium" },
    right: { style: "medium" },
  },
}

const estiloTotalOpcionGris = {
  fill: { fgColor: { rgb: "D9D9D9" } },
  font: { bold: true, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloTotalOpcionGrisClaro = {
  fill: { fgColor: { rgb: "E5E7EB" } },
  font: { bold: true, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloTotalOpcionBlanco = {
  font: { bold: true, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloTotalGrupoOscuro = {
  fill: { fgColor: { rgb: "9CA3AF" } },
  font: { bold: true, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
}

const estiloCeldaVacia = {
  // Sin formato, celda completamente vacía
}

const estiloTituloSinBordes = {
  font: { bold: true, size: 14, color: { rgb: "000000" } },
  alignment: { horizontal: "center", vertical: "center" },
}

const estiloTituloSubrayadoSinBordes = {
  font: { bold: true, size: 14, color: { rgb: "000000" }, underline: true },
  alignment: { horizontal: "center", vertical: "center" },
}

// Función para generar datos de una hoja específica
const generarDatosHoja = (
  casino: string,
  fechaSeleccionada: string,
  fechaFormateada: string,
  opcionesMenu: any[],
  gruposEstudiantes: any,
  funcionarios: any[],
  pedidosCasinos: any[],
) => {
  const datosExcel: any[][] = []
  const merges: any[] = []
  const estilos: { [key: string]: any } = {}
  let currentRow = 0
  let filaInicioGrupo = 0
  let filaFinGrupo = 0
  const filasTotalesGrupo: number[] = []

  // Agregar 2 filas vacías al inicio
  datosExcel.push(["", "", "", "", "", "", "", ""])
  currentRow++
  datosExcel.push(["", "", "", "", "", "", "", ""])
  currentRow++

  // 1. HEADER PRINCIPAL con subrayado (ahora en fila 3)
  datosExcel.push(["", "PLANILLA DE DESPACHO ALMUERZOS", "", "", "", "", "", ""])
  merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
  estilos[`B${currentRow + 1}`] = estiloTituloSubrayadoSinBordes
  currentRow++

  datosExcel.push(["", `CASINO ${casino.toUpperCase()}`, "", "", "", "", "", ""])
  merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
  estilos[`B${currentRow + 1}`] = estiloTituloSinBordes
  currentRow++

  // Línea vacía
  datosExcel.push(["", "", "", "", "", "", "", ""])
  currentRow++

  // Fecha con fondo gris y merge desde C-H
  datosExcel.push(["", `Fecha: ${fechaFormateada}`, "", "", "", "", "", ""])
  merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
  estilos[`B${currentRow + 1}`] = estiloFechaGris
  currentRow++

  // Línea vacía
  datosExcel.push(["", "", "", "", "", "", "", ""])
  currentRow++

  // 2. OPCIONES DEL MENÚ con formato específico
  if (opcionesMenu.length > 0) {
    // Título "OPCIONES ALMUERZOS" combinado desde B-I, negrita, subrayado, alineado izquierda
    datosExcel.push(["", "OPCIONES ALMUERZOS", "", "", "", "", "", ""])
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
    estilos[`B${currentRow + 1}`] = {
      font: { bold: true, size: 12, color: { rgb: "000000" }, underline: true },
      alignment: { horizontal: "left", vertical: "center" },
    }
    currentRow++

    // Filas de opciones con estructura específica
    opcionesMenu.forEach((opcion, index) => {
      // Estilo para el número en columna B
      const estiloNumero = {
        font: { color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
      }

      // Estilo para la descripción combinada C-I con colores intercalados
      const estiloDescripcion =
        index % 2 === 0
          ? {
              fill: { fgColor: { rgb: "D9D9D9" } },
              font: { color: { rgb: "000000" } },
              alignment: { horizontal: "left", vertical: "center" },
            }
          : {
              font: { color: { rgb: "000000" } },
              alignment: { horizontal: "left", vertical: "center" },
            }

      // Fila: B=número, C-I=descripción combinada
      datosExcel.push(["", opcion.codigo_opcion, opcion.descripcion_opcion, "", "", "", "", ""])

      // Merge desde C hasta I para la descripción
      merges.push({ s: { r: currentRow, c: 2 }, e: { r: currentRow, c: 8 } })

      // Aplicar estilos
      estilos[`B${currentRow + 1}`] = estiloNumero
      estilos[`C${currentRow + 1}`] = estiloDescripcion

      currentRow++
    })

    // Línea vacía
    datosExcel.push(["", "", "", "", "", "", "", ""])
    currentRow++
  }

  // 3. ESTUDIANTES POR GRUPO EN ORDEN FIJO
  // Definir el orden de los niveles según el casino
  const nivelesOrden = casino === "Básica" ? ["PRESCHOOL", "MIDDLESCHOOL", "LOWERSCHOOL", "HIGHSCHOOL"] : ["HIGH SCHOOL"]

  // Iterar por cada nivel en el orden correcto
  for (const nivel of nivelesOrden) {
    const estudiantes = gruposEstudiantes[nivel] || []

    if (estudiantes.length > 0) {
      // Crear estilo dinámico para el header del nivel
      const estiloHeaderNivel = {
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: getColorHeaderRGB(nivel) } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      }

      // Header del grupo
      datosExcel.push(["", `${nivel} - ${fechaFormateada}`, "", "", "", "", "", "", ""])
      merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
      estilos[`B${currentRow + 1}`] = estiloHeaderNivel
      currentRow++

      // Headers de columnas
      datosExcel.push(["", "#", "ALUMNO", "CURSO", "OPCION", "CANTIDAD", "CHECK", "OBSERVACION", "PAGO"])
      estilos[`B${currentRow + 1}`] = estiloHeaderNivel
      estilos[`C${currentRow + 1}`] = estiloHeaderNivel
      estilos[`D${currentRow + 1}`] = estiloHeaderNivel
      estilos[`E${currentRow + 1}`] = estiloHeaderNivel
      estilos[`F${currentRow + 1}`] = estiloHeaderNivel
      estilos[`G${currentRow + 1}`] = estiloHeaderNivel
      estilos[`H${currentRow + 1}`] = estiloHeaderNivel
      estilos[`I${currentRow + 1}`] = estiloHeaderNivel
      currentRow++

      // GUARDAR FILA DE INICIO DEL GRUPO (después del header de columnas)
      filaInicioGrupo = currentRow + 1

      // Datos de estudiantes con numeración
      estudiantes.forEach((estudiante, index) => {
        const filaEstilo = estiloCelda

        const estiloOpcion = {
          ...filaEstilo,
          alignment: { horizontal: "center" },
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: getColorOpcionRGB(estudiante.codigo) } },
        }

        datosExcel.push([
          "",
          index + 1, // Numeración
          estudiante.destinatario,
          estudiante.curso || "",
          `OPC ${estudiante.codigo}`,
          estudiante.cantidad, // Nueva columna CANTIDAD
          "", // Columna CHECK vacía
          "", // Columna OBSERVACION vacía
          estudiante.estado_pago?.toUpperCase() || "PAGADO",
        ])

        estilos[`B${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
        estilos[`C${currentRow + 1}`] = filaEstilo
        estilos[`D${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
        estilos[`E${currentRow + 1}`] = estiloOpcion
        estilos[`F${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
        estilos[`G${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
        estilos[`H${currentRow + 1}`] = filaEstilo
        estilos[`I${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
        currentRow++
      })

      // 7 FILAS VACÍAS PARA ENTRADA MANUAL
      for (let i = 0; i < 7; i++) {
        datosExcel.push(["", "", "", "", "", "", "", "", ""])
        estilos[`B${currentRow + 1}`] = estiloCelda
        estilos[`C${currentRow + 1}`] = estiloCelda
        estilos[`D${currentRow + 1}`] = estiloCelda
        estilos[`E${currentRow + 1}`] = estiloCelda
        estilos[`F${currentRow + 1}`] = estiloCelda
        estilos[`G${currentRow + 1}`] = estiloCelda
        estilos[`H${currentRow + 1}`] = estiloCelda
        estilos[`I${currentRow + 1}`] = estiloCelda
        currentRow++
      }

      // CALCULAR FILA DE FIN DEL GRUPO
      filaFinGrupo = currentRow

      // TOTALES POR OPCIÓN con colores intercalados
      const filasPorOpcion: number[] = []
      opcionesMenu.forEach((opcion, index) => {
        const estiloIntercalado = index % 2 === 0 ? estiloTotalOpcionGrisClaro : estiloTotalOpcionBlanco

        // Columnas B, C, D vacías sin formato, E-H con formato
        datosExcel.push([
          "",
          "",
          "",
          "",
          `TOTAL OPCIÓN ${opcion.codigo_opcion}`,
          "",
          "",
          "",
          {
            f: `SUMIF(E${filaInicioGrupo}:E${filaFinGrupo},"OPC ${opcion.codigo_opcion}",F${filaInicioGrupo}:F${filaFinGrupo})`,
          },
        ])
        merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } })

        estilos[`B${currentRow + 1}`] = estiloCeldaVacia
        estilos[`C${currentRow + 1}`] = estiloCeldaVacia
        estilos[`D${currentRow + 1}`] = estiloCeldaVacia
        estilos[`E${currentRow + 1}`] = estiloIntercalado
        estilos[`F${currentRow + 1}`] = estiloCeldaVacia
        estilos[`G${currentRow + 1}`] = estiloCeldaVacia
        estilos[`H${currentRow + 1}`] = estiloCeldaVacia
        estilos[`I${currentRow + 1}`] = { ...estiloIntercalado, font: { bold: true, color: { rgb: "000000" } } }

        // Guardar la fila para la suma posterior
        filasPorOpcion.push(currentRow + 1)
        currentRow++
      })

      // TOTAL DEL GRUPO usando columnas E-G y fórmula simple en H
      datosExcel.push([
        "",
        "",
        "",
        "",
        `TOTAL ${nivel}`,
        "",
        "",
        "",
        {
          f:
            filasPorOpcion.length > 0
              ? `I${filasPorOpcion[0]}+I${filasPorOpcion[1]}+I${filasPorOpcion[2]}+I${filasPorOpcion[3]}`
              : "",
        },
      ])
      merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } })
      estilos[`B${currentRow + 1}`] = estiloCeldaVacia
      estilos[`C${currentRow + 1}`] = estiloCeldaVacia
      estilos[`D${currentRow + 1}`] = estiloCeldaVacia
      estilos[`E${currentRow + 1}`] = estiloTotalGrupoOscuro
      estilos[`F${currentRow + 1}`] = estiloCeldaVacia
      estilos[`G${currentRow + 1}`] = estiloCeldaVacia
      estilos[`H${currentRow + 1}`] = estiloCeldaVacia
      estilos[`I${currentRow + 1}`] = {
        ...estiloTotalGrupoOscuro,
        font: { bold: true, size: 14, color: { rgb: "000000" } },
      }
      filasTotalesGrupo.push(currentRow + 1)
      currentRow++

      // Línea vacía
      datosExcel.push(["", "", "", "", "", "", "", "", ""])
      currentRow++
    }
  }

  // 4. FUNCIONARIOS
  if (funcionarios.length > 0) {
    // Crear estilo dinámico para funcionarios
    const estiloHeaderFuncionarios = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: getColorHeaderRGB("FUNCIONARIOS") } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    // Header funcionarios
    datosExcel.push(["", `FUNCIONARIOS - ${fechaFormateada}`, "", "", "", "", "", "", ""])
    merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 8 } })
    estilos[`B${currentRow + 1}`] = estiloHeaderFuncionarios
    currentRow++

    // Headers de columnas
    datosExcel.push(["", "#", "FUNCIONARIO", "CURSO/UBICACIÓN", "OPCION", "CANTIDAD", "CHECK", "OBSERVACION", "PAGO"])
    estilos[`B${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`C${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`D${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`E${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`F${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`G${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`H${currentRow + 1}`] = estiloHeaderFuncionarios
    estilos[`I${currentRow + 1}`] = estiloHeaderFuncionarios
    currentRow++

    // GUARDAR FILA DE INICIO DEL GRUPO FUNCIONARIOS
    filaInicioGrupo = currentRow + 1

    // Datos de funcionarios con numeración
    funcionarios.forEach((funcionario, index) => {
      const filaEstilo = estiloCelda

      // Estilo especial para la celda de opción con color
      const estiloOpcion = {
        ...filaEstilo,
        alignment: { horizontal: "center" },
        font: { bold: true, color: { rgb: "000000" } },
        fill: { fgColor: { rgb: getColorOpcionRGB(funcionario.codigo) } },
      }

      datosExcel.push([
        "",
        index + 1, // Numeración
        funcionario.destinatario,
        funcionario.nivel === "preschool"
          ? funcionario.curso || "Preschool"
          : funcionario.nivel === "basica"
            ? "Básica"
            : funcionario.nivel === "media"
              ? "Media"
              : "Sin ubicación",
        `OPC ${funcionario.codigo}`,
        funcionario.cantidad, // Nueva columna CANTIDAD
        "", // Columna CHECK vacía
        "", // Columna OBSERVACION vacía
        funcionario.estado_pago?.toUpperCase() || "PAGADO",
      ])

      estilos[`B${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
      estilos[`C${currentRow + 1}`] = filaEstilo
      estilos[`D${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
      estilos[`E${currentRow + 1}`] = estiloOpcion
      estilos[`F${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
      estilos[`G${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
      estilos[`H${currentRow + 1}`] = filaEstilo
      estilos[`I${currentRow + 1}`] = { ...filaEstilo, alignment: { horizontal: "center" } }
      currentRow++
    })

    // 7 FILAS VACÍAS PARA ENTRADA MANUAL
    for (let i = 0; i < 7; i++) {
      datosExcel.push(["", "", "", "", "", "", "", "", ""])
      estilos[`B${currentRow + 1}`] = estiloCelda
      estilos[`C${currentRow + 1}`] = estiloCelda
      estilos[`D${currentRow + 1}`] = estiloCelda
      estilos[`E${currentRow + 1}`] = estiloCelda
      estilos[`F${currentRow + 1}`] = estiloCelda
      estilos[`G${currentRow + 1}`] = estiloCelda
      estilos[`H${currentRow + 1}`] = estiloCelda
      estilos[`I${currentRow + 1}`] = estiloCelda
      currentRow++
    }

    // CALCULAR FILA DE FIN DEL GRUPO FUNCIONARIOS
    filaFinGrupo = currentRow

    // TOTALES POR OPCIÓN con colores intercalados
    const filasPorOpcionFuncionario: number[] = []
    opcionesMenu.forEach((opcion, index) => {
      const estiloIntercalado = index % 2 === 0 ? estiloTotalOpcionGrisClaro : estiloTotalOpcionBlanco

      // Columnas B, C, D vacías sin formato, E-H con formato
      datosExcel.push([
        "",
        "",
        "",
        "",
        `TOTAL OPCIÓN ${opcion.codigo_opcion}`,
        "",
        "",
        "",
        {
          f: `SUMIF(E${filaInicioGrupo}:E${filaFinGrupo},"OPC ${opcion.codigo_opcion}",F${filaInicioGrupo}:F${filaFinGrupo})`,
        },
      ])
      merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } })

      estilos[`B${currentRow + 1}`] = estiloCeldaVacia
      estilos[`C${currentRow + 1}`] = estiloCeldaVacia
      estilos[`D${currentRow + 1}`] = estiloCeldaVacia
      estilos[`E${currentRow + 1}`] = estiloIntercalado
      estilos[`F${currentRow + 1}`] = estiloCeldaVacia
      estilos[`G${currentRow + 1}`] = estiloCeldaVacia
      estilos[`H${currentRow + 1}`] = estiloCeldaVacia
      estilos[`I${currentRow + 1}`] = { ...estiloIntercalado, font: { bold: true, color: { rgb: "000000" } } }

      // Guardar la fila para la suma posterior
      filasPorOpcionFuncionario.push(currentRow + 1)
      currentRow++
    })

    // TOTAL DEL GRUPO usando columnas E-G y fórmula simple en H
    datosExcel.push([
      "",
      "",
      "",
      "",
      `TOTAL FUNCIONARIOS`,
      "",
      "",
      "",
      {
        f:
          filasPorOpcionFuncionario.length > 0
            ? `I${filasPorOpcionFuncionario[0]}+I${filasPorOpcionFuncionario[1]}+I${filasPorOpcionFuncionario[2]}+I${filasPorOpcionFuncionario[3]}`
            : "",
      },
    ])
    merges.push({ s: { r: currentRow, c: 4 }, e: { r: currentRow, c: 7 } })
    estilos[`B${currentRow + 1}`] = estiloCeldaVacia
    estilos[`C${currentRow + 1}`] = estiloCeldaVacia
    estilos[`D${currentRow + 1}`] = estiloCeldaVacia
    estilos[`E${currentRow + 1}`] = estiloTotalGrupoOscuro
    estilos[`F${currentRow + 1}`] = estiloCeldaVacia
    estilos[`G${currentRow + 1}`] = estiloCeldaVacia
    estilos[`H${currentRow + 1}`] = estiloCeldaVacia
    estilos[`I${currentRow + 1}`] = {
      ...estiloTotalGrupoOscuro,
      font: { bold: true, size: 14, color: { rgb: "000000" } },
    }
    filasTotalesGrupo.push(currentRow + 1)
    currentRow++

    // Línea vacía
    datosExcel.push(["", "", "", "", "", "", "", "", ""])
    currentRow++
  }

  // 5. TOTAL GENERAL DEL CASINO
  const formulaTotalCasino = filasTotalesGrupo.length > 0 ? filasTotalesGrupo.map((fila) => `I${fila}`).join("+") : "0"

  datosExcel.push(["", `TOTAL PEDIDOS ${casino.toUpperCase()}`, "", "", "", "", "", "", { f: formulaTotalCasino }])
  merges.push({ s: { r: currentRow, c: 1 }, e: { r: currentRow, c: 7 } })
  estilos[`B${currentRow + 1}`] = estiloTotalGris
  estilos[`I${currentRow + 1}`] = { ...estiloTotalGris, font: { bold: true, size: 14, color: { rgb: "000000" } } }
  currentRow++

  // 6. TABLA DE CUADRE (solo para casino Básica)
  if (casino === "Básica") {
    // Líneas vacías para separación
    datosExcel.push(["", "", "", "", "", "", "", "", "", "", "", "", "", ""])
    currentRow++
    datosExcel.push(["", "", "", "", "", "", "", "", "", "", "", "", "", ""])
    currentRow++

    // Headers de la tabla de cuadre (columnas N, O)
    datosExcel.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "EXTRAS", "TOTAL"])
    estilos[`N${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    estilos[`O${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    currentRow++

    // Guardar referencias para las fórmulas dinámicas
    const filaInicioOpciones = currentRow + 1

    // Filas 1-4: Opciones individuales (HIGH SCHOOL + funcionarios básica + funcionarios media)
    opcionesMenu.forEach((opcion, index) => {
      // Calcular totales dinámicos por opción
      const pedidosHighSchool = pedidosCasinos.filter((pedido) => {
        return (
          pedido.tipo_destinatario === "estudiante" &&
          pedido.casino === "Media" &&
          pedido.codigo === opcion.codigo_opcion
        )
      })

      const funcionariosBasicaOpcion = pedidosCasinos.filter((pedido) => {
        return (
          pedido.tipo_destinatario === "funcionario" &&
          pedido.nivel === "basica" &&
          pedido.codigo === opcion.codigo_opcion
        )
      })

      const funcionariosMediaOpcion = pedidosCasinos.filter((pedido) => {
        return (
          pedido.tipo_destinatario === "funcionario" &&
          pedido.nivel === "media" &&
          pedido.codigo === opcion.codigo_opcion
        )
      })

      const totalOpcion = [...pedidosHighSchool, ...funcionariosBasicaOpcion, ...funcionariosMediaOpcion].reduce(
        (sum, pedido) => sum + pedido.cantidad,
        0,
      )

      datosExcel.push(["", "", "", "", "", "", "", "", "", "", "", "", totalOpcion, 4, totalOpcion + 4])

      estilos[`M${currentRow + 1}`] = {
        font: { color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      }
      estilos[`N${currentRow + 1}`] = {
        font: { color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      }
      estilos[`O${currentRow + 1}`] = {
        font: { color: { rgb: "000000" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      }

      currentRow++
    })

    // Fila 5: Subtotal (suma de las 4 filas anteriores)
    const filaFinOpciones = currentRow
    datosExcel.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      { f: `SUM(M${filaInicioOpciones}:M${filaFinOpciones})` },
      { f: `SUM(N${filaInicioOpciones}:N${filaFinOpciones})` },
      { f: `M${currentRow + 1}+N${currentRow + 1}` },
    ])

    estilos[`M${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D9D9D9" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    estilos[`N${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D9D9D9" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    estilos[`O${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "D9D9D9" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    const filaSubtotal = currentRow + 1
    currentRow++

    // Línea vacía
    datosExcel.push(["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""])
    currentRow++

    // Fila 6: Total general (grupos básica + subtotal anterior)
    const filasGruposBasica = filasTotalesGrupo.filter((_, index) => index < 4) // PRESCHOOL, MIDDLESCHOOL, LOWERSCHOOL, HIGHSCHOOL
    const formulaGruposBasica =
      filasGruposBasica.length > 0 ? filasGruposBasica.map((fila) => `I${fila}`).join("+") : "0"

    datosExcel.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      { f: `${formulaGruposBasica}+M${filaSubtotal}` },
      "",
      { f: `M${currentRow + 1}+N${filaSubtotal}` },
    ])

    estilos[`M${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "9CA3AF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    estilos[`O${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "9CA3AF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }

    const filaTotalGeneral = currentRow + 1
    currentRow++

    // Fila 7: Total + 1
    datosExcel.push([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      { f: `M${filaTotalGeneral}+1` },
      "",
      { f: `M${currentRow + 1}+N${filaSubtotal}` },
    ])

    estilos[`M${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "9CA3AF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    estilos[`O${currentRow + 1}`] = {
      font: { bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "9CA3AF" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      },
    }
    currentRow++
  }

  return { datosExcel, merges, estilos }
}

// Función principal de exportación
export const exportarPlanilla = async (
  fechaSeleccionada: string,
  fechaFormateada: string,
  opcionesMenu: any[],
  gruposEstudiantesBasica: any,
  funcionariosBasica: any[],
  gruposEstudiantesMedia: any,
  funcionariosMedia: any[],
  pedidosCasinos: any[],
) => {
  try {
    console.log("🚀 Iniciando exportación de planillas completas...")
    const XLSX = await import("xlsx-js-style")

    // Crear workbook
    const workbook = XLSX.utils.book_new()

    // Lista de casinos a exportar
    const casinos = ["Básica", "Media"]

    // Generar cada hoja
    for (const casino of casinos) {
      console.log(`📊 Generando hoja para casino: ${casino}`)

      const gruposEstudiantes = casino === "Básica" ? gruposEstudiantesBasica : gruposEstudiantesMedia
      const funcionarios = casino === "Básica" ? funcionariosBasica : funcionariosMedia

      const { datosExcel, merges, estilos } = generarDatosHoja(
        casino,
        fechaSeleccionada,
        fechaFormateada,
        opcionesMenu,
        gruposEstudiantes,
        funcionarios,
        pedidosCasinos,
      )

      // Crear worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(datosExcel)

      // Aplicar estilos
      Object.keys(estilos).forEach((cell) => {
        if (!worksheet[cell]) worksheet[cell] = { v: "" }
        worksheet[cell].s = estilos[cell]
      })

      // Aplicar merges
      worksheet["!merges"] = merges

      // Configurar anchos de columna
      worksheet["!cols"] = [
        { wch: 1.22 }, // A - Borde
        { wch: 7.33 }, // B - #
        { wch: 60.44 }, // C - Nombre
        { wch: 19.11 }, // D - Curso
        { wch: 15.67 }, // E - Opción
        { wch: 12.0 }, // F - Cantidad
        { wch: 15.33 }, // G - Check
        { wch: 42.67 }, // H - Observación
        { wch: 17.11 }, // I - Pago
        { wch: 8.0 }, // J
        { wch: 8.0 }, // K
        { wch: 8.0 }, // L
        { wch: 12.0 }, // M - Totales
        { wch: 12.0 }, // N - Extras
        { wch: 12.0 }, // O - Total
      ]

      // Agregar hoja al workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, casino)
    }

    // Descargar archivo
    const nombreArchivo = `planillas-casinos-${fechaSeleccionada}.xlsx`
    XLSX.writeFile(workbook, nombreArchivo)

    console.log("✅ Planillas exportadas con formato completo:", nombreArchivo)
  } catch (error) {
    console.error("❌ Error exportando planillas:", error)
  }
}
