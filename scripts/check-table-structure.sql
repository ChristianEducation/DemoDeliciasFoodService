-- Verificar estructura actual de las tablas

-- Verificar que las tablas existen
SELECT 
    table_name, 
    table_type,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('pedidos', 'pedidos_item')
ORDER BY table_name;

-- Verificar columnas de la tabla pedidos
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pedidos'
ORDER BY ordinal_position;

-- Verificar columnas de la tabla pedidos_item
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'pedidos_item'
ORDER BY ordinal_position;

-- Verificar constraints y claves
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name IN ('pedidos', 'pedidos_item')
ORDER BY tc.table_name, tc.constraint_type;
