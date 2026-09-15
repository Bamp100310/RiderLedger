-- ==============================================================================
-- RIDERLEDGER: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Jornadas / Turnos Operativos
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tiempo_reparto_minutos INT NOT NULL DEFAULT 0, -- Minutos activos en entregas/pedidos
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,  -- Minutos de espera / tiempo muerto en calle
    kilometros NUMERIC(6,2) NOT NULL DEFAULT 0,    -- Km recorridos en la jornada
    odometer_start NUMERIC(10,2) DEFAULT NULL,     -- Lectura inicial de odómetro físico
    odometer_end NUMERIC(10,2) DEFAULT NULL,       -- Lectura final de odómetro físico
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 2. Tabla de Transacciones Contables (Ingresos, Gastos y Cobros Efectivo)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO', 'COBRO_EFECTIVO_APP')),
    categoria VARCHAR(50) NOT NULL, 
    -- Ingresos: 'DOMICILIOS', 'PASAJEROS', 'OTROS_INGRESOS'
    -- Gastos: 'COMBUSTIBLE', 'MANTENIMIENTO_MOTO', 'ALIMENTACION', 'OTROS_GASTOS', 'CUOTA_CREDITO', 'HONORARIOS_ACOMPANANTE'
    subcategoria VARCHAR(50) NOT NULL, -- 'Rappi', 'Didi Food', 'Armi', 'Gasolina', 'Almuerzo', etc.
    descripcion TEXT,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('APP', 'EFECTIVO', 'BRE_B', 'TRANSFERENCIA_BANCO')),
    shift_id TEXT REFERENCES shifts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 3. Tabla de Perfiles Familiares (Sincronización multi-dispositivo)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT,
    rol TEXT,
    "avatarColor" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla de Créditos y Cuotas Fijas
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    monto_cuota NUMERIC(12,2) NOT NULL DEFAULT 0,
    dia_pago INT NOT NULL CHECK (dia_pago BETWEEN 1 AND 31),
    descripcion TEXT,
    pagado_este_mes BOOLEAN NOT NULL DEFAULT false,
    ultimo_mes_pagado VARCHAR(7), -- 'YYYY-MM'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 5. Tabla de Tarjetas de Crédito y Cuentas Revolventes
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    cupo_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    saldo_utilizado NUMERIC(12,2) NOT NULL DEFAULT 0,
    fecha_corte INT NOT NULL CHECK (fecha_corte BETWEEN 1 AND 31),
    fecha_pago INT NOT NULL CHECK (fecha_pago BETWEEN 1 AND 31),
    pago_minimo NUMERIC(12,2) NOT NULL DEFAULT 0,
    pago_total_esperado NUMERIC(12,2),
    tasa_interes_ea NUMERIC(5,2),
    banco_entidad TEXT,
    ultimos_digitos VARCHAR(4),
    notas TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'AL_DIA' CHECK (estado IN ('AL_DIA', 'EN_ALERTA', 'SOBREGIRO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL
);

-- 6. Tabla de Metas y Referencias Financieras (1 fila por usuario)
CREATE TABLE IF NOT EXISTS financial_settings (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    meta_ingreso_minimo_mensual NUMERIC(12,2) NOT NULL DEFAULT 1750905,
    horas_semanales_referencia INT NOT NULL DEFAULT 42,
    horas_mensuales_referencia INT NOT NULL DEFAULT 182,
    meta_ingreso_hora_referencia NUMERIC(12,2) NOT NULL DEFAULT 9620,
    meta_ahorro_mensual NUMERIC(12,2) NOT NULL DEFAULT 300000,
    meta_fondo_emergencia_meses INT NOT NULL DEFAULT 3,
    limite_utilizacion_credito_pct INT NOT NULL DEFAULT 30,
    porcentaje_necesidades_ref INT NOT NULL DEFAULT 50,
    porcentaje_deseos_ref INT NOT NULL DEFAULT 30,
    porcentaje_ahorro_deuda_ref INT NOT NULL DEFAULT 20,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de optimización
CREATE INDEX IF NOT EXISTS idx_shifts_fecha ON shifts(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_fecha ON transactions(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_tipo ON transactions(tipo);
CREATE INDEX IF NOT EXISTS idx_transactions_shift_id ON transactions(shift_id);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credits_dia_pago ON credits(dia_pago);
CREATE INDEX IF NOT EXISTS idx_credit_cards_fecha_pago ON credit_cards(fecha_pago);

-- Habilitar Políticas de Seguridad a Nivel de Fila (RLS)
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en shifts" ON shifts;
CREATE POLICY "Permitir todo a usuarios publicos en shifts" ON shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en transactions" ON transactions;
CREATE POLICY "Permitir todo a usuarios publicos en transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en profiles" ON profiles;
CREATE POLICY "Permitir todo a usuarios publicos en profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en credits" ON credits;
CREATE POLICY "Permitir todo en credits" ON credits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en credit_cards" ON credit_cards;
CREATE POLICY "Permitir todo en credit_cards" ON credit_cards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en financial_settings" ON financial_settings;
CREATE POLICY "Permitir todo en financial_settings" ON financial_settings FOR ALL USING (true) WITH CHECK (true);

-- Fijar REPLICA IDENTITY FULL
ALTER TABLE shifts REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE credits REPLICA IDENTITY FULL;
ALTER TABLE credit_cards REPLICA IDENTITY FULL;
ALTER TABLE financial_settings REPLICA IDENTITY FULL;

-- Habilitar publicación Realtime en Supabase
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'credits'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE credits;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'credit_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE credit_cards;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'financial_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE financial_settings;
  END IF;
END $$;
