-- ==========================================
-- T1 PARTE A — MIGRACIONES SQL + RPCs
-- PedidosAIS — Módulo Anulación de Almuerzos con Créditos
-- ==========================================
-- Todos los bloques son IDEMPOTENTES: se pueden ejecutar múltiples veces sin error.
-- Ejecutar en el SQL Editor de Supabase en orden.
-- ==========================================

-- BLOQUE 1: Migraciones de columnas
-- ----------------------------------

-- Soft delete para ítems de pedido (anulación)
ALTER TABLE pedidos_item ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_item_deleted_at ON pedidos_item(deleted_at);

-- Soft delete para pedidos (uso futuro)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_deleted_at ON pedidos(deleted_at);

-- Descuento aplicado al pedido (en pesos)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS descuento INTEGER DEFAULT 0;

-- Créditos disponibles por estudiante
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS creditos_disponibles INTEGER DEFAULT 0;

-- Hora límite para anulaciones (0-23, default 9 = 9:00 AM)
ALTER TABLE configuracion_bloqueo ADD COLUMN IF NOT EXISTS hora_limite_anulacion INTEGER DEFAULT 9;


-- BLOQUE 2: Función RPC para decrementar créditos (se usa en webhook de pago)
-- ----------------------------------
-- Decrementa créditos de un estudiante, nunca baja de 0.
CREATE OR REPLACE FUNCTION decrementar_credito(estudiante_id UUID, cantidad INTEGER DEFAULT 1)
RETURNS void AS $$
  UPDATE estudiantes 
  SET creditos_disponibles = GREATEST(0, creditos_disponibles - cantidad)
  WHERE id = estudiante_id;
$$ LANGUAGE sql;


-- BLOQUE 3: Función RPC ATÓMICA para anular almuerzo + sumar crédito
-- ----------------------------------
-- Esta función hace TODO en una sola transacción:
--  1. Verifica que el ítem existe, no está anulado, es de estudiante, es almuerzo, fecha futura
--  2. Verifica que el pedido padre está pagado/FMD/PGC
--  3. Marca el ítem como anulado (soft delete con deleted_at = NOW())
--  4. Suma 1 crédito al estudiante
-- Si CUALQUIER paso falla, NADA se commitea (atomicidad garantizada).
CREATE OR REPLACE FUNCTION anular_almuerzo_con_credito(
  p_pedido_item_id UUID,
  p_estudiante_id UUID
)
RETURNS jsonb AS $$
DECLARE
  v_item RECORD;
  v_estado_pago TEXT;
  v_fecha_hoy DATE;
BEGIN
  -- Obtener hoy en Chile (timezone correcta, sin restar horas manualmente)
  v_fecha_hoy := (NOW() AT TIME ZONE 'America/Santiago')::DATE;

  -- 1. Cargar el ítem y bloquearlo para esta transacción
  SELECT pi.id, pi.fecha, pi.deleted_at, pi.tipo, pi.tipo_destinatario, p.estado_pago
  INTO v_item
  FROM pedidos_item pi
  INNER JOIN pedidos p ON p.id = pi.pedido_id
  WHERE pi.id = p_pedido_item_id
  FOR UPDATE OF pi;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_no_existe');
  END IF;

  IF v_item.deleted_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'item_ya_anulado');
  END IF;

  IF v_item.tipo != 'almuerzo' THEN
    RETURN jsonb_build_object('success', false, 'error', 'solo_almuerzos');
  END IF;

  IF v_item.tipo_destinatario != 'estudiante' THEN
    RETURN jsonb_build_object('success', false, 'error', 'solo_estudiantes');
  END IF;

  IF v_item.estado_pago NOT IN ('pagado', 'FMD', 'PGC') THEN
    RETURN jsonb_build_object('success', false, 'error', 'pedido_no_pagado');
  END IF;

  IF v_item.fecha <= v_fecha_hoy THEN
    RETURN jsonb_build_object('success', false, 'error', 'fecha_pasada');
  END IF;

  -- 2. Soft delete del ítem
  UPDATE pedidos_item SET deleted_at = NOW() WHERE id = p_pedido_item_id;

  -- 3. Sumar crédito al estudiante (verificando que exista)
  UPDATE estudiantes 
  SET creditos_disponibles = COALESCE(creditos_disponibles, 0) + 1
  WHERE id = p_estudiante_id;

  IF NOT FOUND THEN
    -- El estudiante no existe — la transacción se hace rollback automáticamente
    RAISE EXCEPTION 'estudiante_no_existe';
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'almuerzo_anulado');
END;
$$ LANGUAGE plpgsql;


-- BLOQUE 4: Verificación
-- ----------------------------------
-- Ejecuta estas queries y confirma que todas devuelven resultados:

-- Verificar columna deleted_at en pedidos_item
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pedidos_item' AND column_name = 'deleted_at';

-- Verificar columnas deleted_at y descuento en pedidos
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'pedidos' AND column_name IN ('deleted_at', 'descuento');

-- Verificar columna creditos_disponibles en estudiantes
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'estudiantes' AND column_name = 'creditos_disponibles';

-- Verificar columna hora_limite_anulacion en configuracion_bloqueo
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'configuracion_bloqueo' AND column_name = 'hora_limite_anulacion';

-- Verificar que ambas funciones RPC existen
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('decrementar_credito', 'anular_almuerzo_con_credito');
