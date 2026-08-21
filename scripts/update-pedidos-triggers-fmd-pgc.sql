-- 1. ACTUALIZAR EL TRIGGER: update_pedidos_actuales_trigger
-- Reemplazar todas las condiciones que verifican 'pagado' para incluir FMD y PGC

CREATE OR REPLACE FUNCTION update_pedidos_actuales_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- INSERT: Si es pagado, FMD o PGC, sumar cantidad
    IF TG_OP = 'INSERT' THEN
        IF NEW.estado_pago IN ('pagado', 'FMD', 'PGC') THEN
            UPDATE almuerzos 
            SET pedidos_actuales = pedidos_actuales + NEW.cantidad
            WHERE fecha::DATE = NEW.fecha AND codigo_opcion::TEXT = NEW.codigo;
        END IF;
        RETURN NEW;
    END IF;
    
    -- UPDATE: Manejar cambios de estado
    IF TG_OP = 'UPDATE' THEN
        -- Si cambió de no-contable a contable (pagado/FMD/PGC)
        IF OLD.estado_pago NOT IN ('pagado', 'FMD', 'PGC') AND NEW.estado_pago IN ('pagado', 'FMD', 'PGC') THEN
            UPDATE almuerzos 
            SET pedidos_actuales = pedidos_actuales + NEW.cantidad
            WHERE fecha::DATE = NEW.fecha AND codigo_opcion::TEXT = NEW.codigo;
        END IF;
        
        -- Si cambió de contable a no-contable
        IF OLD.estado_pago IN ('pagado', 'FMD', 'PGC') AND NEW.estado_pago NOT IN ('pagado', 'FMD', 'PGC') THEN
            UPDATE almuerzos 
            SET pedidos_actuales = pedidos_actuales - OLD.cantidad
            WHERE fecha::DATE = OLD.fecha AND codigo_opcion::TEXT = OLD.codigo;
        END IF;
        
        -- Si está en estado contable y solo cambió la cantidad
        IF OLD.estado_pago IN ('pagado', 'FMD', 'PGC') AND NEW.estado_pago IN ('pagado', 'FMD', 'PGC')
           AND OLD.cantidad != NEW.cantidad THEN
            UPDATE almuerzos 
            SET pedidos_actuales = pedidos_actuales - OLD.cantidad + NEW.cantidad
            WHERE fecha::DATE = NEW.fecha AND codigo_opcion::TEXT = NEW.codigo;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- DELETE: Si era contable, restar cantidad
    IF TG_OP = 'DELETE' THEN
        IF OLD.estado_pago IN ('pagado', 'FMD', 'PGC') THEN
            UPDATE almuerzos 
            SET pedidos_actuales = pedidos_actuales - OLD.cantidad
            WHERE fecha::DATE = OLD.fecha AND codigo_opcion::TEXT = OLD.codigo;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. ACTUALIZAR LA FUNCIÓN: update_pedidos_actuales_count
-- Cambiar la condición WHERE para incluir FMD y PGC

CREATE OR REPLACE FUNCTION update_pedidos_actuales_count()
RETURNS void AS $$
BEGIN
    UPDATE almuerzos
    SET pedidos_actuales = COALESCE(subquery.total_cantidad, 0)
    FROM (
        SELECT
            pi.codigo::int as codigo,
            pi.fecha::text as fecha,
            SUM(pi.cantidad) as total_cantidad
        FROM pedidos_item pi
        INNER JOIN pedidos p ON pi.pedido_id = p.id
        WHERE p.estado_pago IN ('pagado', 'FMD', 'PGC')
        AND pi.tipo = 'almuerzo'
        GROUP BY pi.codigo::int, pi.fecha::text
    ) as subquery
    WHERE almuerzos.codigo_opcion = subquery.codigo
    AND almuerzos.fecha = subquery.fecha;
END;
$$ LANGUAGE plpgsql;
