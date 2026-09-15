-- ==============================================================================
-- RIDERLEDGER: MIGRACIÓN PARA CRÉDITOS, TARJETAS Y CONFIGURACIÓN FINANCIERA
-- Archivo: 20260915_create_credits_and_cards_tables.sql
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabla de Créditos y Cuotas Fijas
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

-- 2. Tabla de Tarjetas de Crédito y Cuentas Revolventes
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

-- 3. Tabla de Metas y Referencias Financieras (1 fila activa por usuario)
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

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_credits_dia_pago ON credits(dia_pago);
CREATE INDEX IF NOT EXISTS idx_credit_cards_fecha_pago ON credit_cards(fecha_pago);

-- Habilitar Row Level Security (RLS)
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para clientes anónimos/autenticados
DROP POLICY IF EXISTS "Permitir todo en credits" ON credits;
CREATE POLICY "Permitir todo en credits" ON credits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en credit_cards" ON credit_cards;
CREATE POLICY "Permitir todo en credit_cards" ON credit_cards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo en financial_settings" ON financial_settings;
CREATE POLICY "Permitir todo en financial_settings" ON financial_settings FOR ALL USING (true) WITH CHECK (true);

-- Fijar REPLICA IDENTITY FULL para que UPDATE y DELETE incluyan el registro previo completo
ALTER TABLE credits REPLICA IDENTITY FULL;
ALTER TABLE credit_cards REPLICA IDENTITY FULL;
ALTER TABLE financial_settings REPLICA IDENTITY FULL;

-- Agregar tablas a la publicación de Supabase Realtime
DO $$
BEGIN
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
