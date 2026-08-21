-- Script de rollback en caso de problemas
-- SOLO USAR SI ALGO SALE MAL

-- Eliminar políticas
DROP POLICY IF EXISTS "Allow all operations on almuerzos" ON almuerzos;
DROP POLICY IF EXISTS "Allow all operations on colaciones" ON colaciones;
DROP POLICY IF EXISTS "Allow all operations on estudiantes" ON estudiantes;
DROP POLICY IF EXISTS "Allow all operations on funcionarios" ON funcionarios;

-- Deshabilitar RLS
ALTER TABLE almuerzos DISABLE ROW LEVEL SECURITY;
ALTER TABLE colaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE estudiantes DISABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
