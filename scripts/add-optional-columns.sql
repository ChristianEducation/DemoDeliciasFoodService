-- Script OPCIONAL para agregar columnas adicionales a la tabla pedidos
-- Solo ejecutar si quieres tener estas columnas adicionales

-- Agregar columna para datos adicionales (JSONB)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'datos_adicionales'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN datos_adicionales JSONB;
        COMMENT ON COLUMN pedidos.datos_adicionales IS 'Información adicional del pedido en formato JSON';
    END IF;
END $$;

-- Agregar columna para fecha de actualización
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedidos' 
        AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE;
        COMMENT ON COLUMN pedidos.fecha_actualizacion IS 'Fecha de última actualización del pedido';
    END IF;
END $$;

-- Verificar que las columnas se agregaron correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pedidos'
AND column_name IN ('datos_adicionales', 'fecha_actualizacion')
ORDER BY column_name;
