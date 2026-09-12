-- ==============================================================================
-- RIDERLEDGER: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Jornadas / Turnos Operativos
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tiempo_reparto_minutos INT NOT NULL DEFAULT 0, -- Minutos activos en entregas/pedidos
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,  -- Minutos de espera / tiempo muerto en calle
    kilometros NUMERIC(6,2) NOT NULL DEFAULT 0,    -- Km recorridos en la jornada
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Transacciones Contables (Ingresos, Gastos y Cobros Efectivo)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO', 'COBRO_EFECTIVO_APP')),
    categoria VARCHAR(50) NOT NULL, 
    -- Ingresos: 'DOMICILIOS', 'PASAJEROS', 'OTROS_INGRESOS'
    -- Gastos: 'COMBUSTIBLE', 'MANTENIMIENTO_MOTO', 'ALIMENTACION', 'OTROS_GASTOS'
    subcategoria VARCHAR(50) NOT NULL, -- 'Rappi', 'Didi Food', 'Uber', 'Gasolina', 'Almuerzo', etc.
    descripcion TEXT,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('APP', 'EFECTIVO', 'TRANSFERENCIA_BANCO')),
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de optimización para consultas por rango de fecha
CREATE INDEX IF NOT EXISTS idx_shifts_fecha ON shifts(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_fecha ON transactions(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_shift_id ON transactions(shift_id);

-- Habilitar Políticas de Seguridad a Nivel de Fila (RLS)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para clientes anónimos (o autenticados)
-- Nota: Si usas login individual con Supabase Auth más adelante, puedes agregar "user_id UUID"
DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en shifts" ON shifts;
CREATE POLICY "Permitir todo a usuarios publicos en shifts"
    ON shifts FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en transactions" ON transactions;
CREATE POLICY "Permitir todo a usuarios publicos en transactions"
    ON transactions FOR ALL
    USING (true)
    WITH CHECK (true);

-- Habilitar publicación Realtime en Supabase (opcional pero recomendado)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'shifts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
END $$;
