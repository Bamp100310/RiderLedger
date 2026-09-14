-- ==============================================================================
-- RIDERLEDGER: MIGRACIÓN PARA LECTURA FÍSICA DE ODÓMETRO
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Añadir columnas opcionales de lectura inicial y final de odómetro a la tabla shifts
ALTER TABLE shifts 
ADD COLUMN IF NOT EXISTS odometer_start NUMERIC(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS odometer_end NUMERIC(10,2) DEFAULT NULL;

COMMENT ON COLUMN shifts.odometer_start IS 'Lectura inicial del odómetro físico del vehículo al iniciar el turno';
COMMENT ON COLUMN shifts.odometer_end IS 'Lectura final del odómetro físico del vehículo al finalizar el turno';
