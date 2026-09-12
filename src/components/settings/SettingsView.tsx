import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { testSupabaseConnection } from '../../lib/supabase';
import {
  Settings,
  Database,
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  Smartphone,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- RIDERLEDGER: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tiempo_reparto_minutos INT NOT NULL DEFAULT 0,
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,
    kilometros NUMERIC(6,2) NOT NULL DEFAULT 0,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO', 'COBRO_EFECTIVO_APP')),
    categoria VARCHAR(50) NOT NULL, 
    subcategoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('APP', 'EFECTIVO', 'TRANSFERENCIA_BANCO')),
    shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shifts_fecha ON shifts(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_fecha ON transactions(fecha DESC);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en shifts" ON shifts;
CREATE POLICY "Permitir todo a usuarios publicos en shifts" ON shifts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir todo a usuarios publicos en transactions" ON transactions;
CREATE POLICY "Permitir todo a usuarios publicos en transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
`;

export const SettingsView: React.FC = () => {
  const {
    supabaseConfig,
    updateSupabaseConfig,
    loadDemoData,
    clearAllData,
    shifts,
    transactions,
    triggerSync,
    isSyncing
  } = useAppData();

  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Probar conexión en vivo
  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Ingresa tanto la URL de Supabase como la clave Anon Key.'
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Probando conexión con Supabase...' });
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    if (res.success) {
      setTestResult({ status: 'success', message: res.message });
    } else {
      setTestResult({ status: 'error', message: res.message });
    }
  };

  // Guardar configuración en localStorage
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSupabaseConfig({
      url: url.trim(),
      anonKey: anonKey.trim()
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    handleTestConnection();
  };

  // Copiar SQL al portapapeles
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Exportar copia de seguridad en JSON
  const handleExportJson = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shifts,
      transactions
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const dlUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = dlUrl;
    link.download = `RiderLedger_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="space-y-5 pb-24 max-w-2xl mx-auto">
      {/* Encabezado */}
      <div className="bg-slate-900/80 p-4 rounded-3xl border border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            Ajustes & Conexión
          </h2>
          <p className="text-xs text-slate-400">
            Conecta tu base de datos Supabase en tiempo real sin recompilar
          </p>
        </div>
      </div>

      {/* Tarjeta de Configuración de Supabase */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Base de Datos Supabase (PostgreSQL)</h3>
              <p className="text-[11px] text-slate-400">Sincronización multi-dispositivo en la nube</p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
          >
            Ir a Supabase <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project URL de Supabase
            </label>
            <input
              type="url"
              placeholder="https://xyzprojectid.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Encuéntrala en: Project Settings → API → Project URL
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={e => setAnonKey(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Encuéntrala en: Project Settings → API → Project API Keys (anon public)
            </p>
          </div>

          {/* Resultado de prueba */}
          {testResult.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                testResult.status === 'testing'
                  ? 'bg-slate-950 text-slate-300 border-white/10'
                  : testResult.status === 'success'
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-950/50 text-rose-300 border-rose-500/30'
              }`}
            >
              {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 animate-sync mt-0.5" />}
              {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />}
              {testResult.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />}
              <div className="flex-1">{testResult.message}</div>
            </div>
          )}

          {/* Botones de acción de configuración */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testResult.status === 'testing'}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-white/10 transition-colors"
            >
              Probar Conexión
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Guardado
                </>
              ) : (
                'Guardar Credenciales'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Script SQL para Supabase con botón 1-click copiar */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📜</span> Script SQL para Crear las Tablas
            </h3>
            <p className="text-[11px] text-slate-400">
              Copia y pega este script en el <b>SQL Editor</b> de tu panel de Supabase
            </p>
          </div>
          <button
            onClick={handleCopySql}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              copiedSql
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/10'
            }`}
          >
            {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
          </button>
        </div>

        <div className="bg-slate-950 rounded-2xl p-3 border border-white/5 max-h-48 overflow-y-auto">
          <pre className="text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre">
            {SUPABASE_SQL_SCRIPT}
          </pre>
        </div>
      </div>

      {/* Gestión de Datos y Demostración */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Datos y Copia de Seguridad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Cargar Demo */}
          <button
            onClick={() => {
              if (window.confirm('¿Deseas recargar datos de demostración realistas?')) {
                loadDemoData();
              }
            }}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-white/5 text-left transition-all"
          >
            <p className="text-xs font-bold text-white">Cargar Demo</p>
            <p className="text-[10px] text-slate-400">7 días con Rappi, Didi y gasolina</p>
          </button>

          {/* Exportar Respaldo JSON */}
          <button
            onClick={handleExportJson}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-white/5 text-left transition-all"
          >
            <p className="text-xs font-bold text-white flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Respaldar JSON
            </p>
            <p className="text-[10px] text-slate-400">Descargar copia completa</p>
          </button>

          {/* Limpiar Datos */}
          <button
            onClick={() => {
              if (window.confirm('¿Estás seguro de borrar todos los turnos y transacciones locales?')) {
                clearAllData();
              }
            }}
            className="p-3 rounded-2xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/20 text-left transition-all"
          >
            <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Limpiar Todo
            </p>
            <p className="text-[10px] text-slate-400">Borrar registros locales</p>
          </button>
        </div>
      </div>

      {/* Guía de Instalación PWA (Android / iPhone) */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-5 space-y-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          Cómo instalar en tu Teléfono Móvil
        </h3>
        <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
          <li>
            <b className="text-slate-200">Android (Chrome):</b> Toca los tres puntos (⋮) y selecciona{' '}
            <span className="text-emerald-400 font-semibold">"Instalar aplicación"</span> o{' '}
            <span className="text-emerald-400 font-semibold">"Añadir a pantalla de inicio"</span>.
          </li>
          <li>
            <b className="text-slate-200">iPhone / iPad (Safari):</b> Toca el botón Compartir (
            <span className="text-cyan-400">cuadrado con flecha hacia arriba</span>) y selecciona{' '}
            <span className="text-cyan-400 font-semibold">"Añadir a pantalla de inicio"</span>.
          </li>
          <li>
            La app funcionará como una aplicación nativa, a pantalla completa sin barra de navegación y con soporte offline.
          </li>
        </ul>
      </div>
    </div>
  );
};
