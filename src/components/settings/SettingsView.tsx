import React, { useState } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { testSupabaseConnection } from '../../lib/supabase';
import {
  Settings,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Download,
  Users,
  UserPlus,
  Smartphone,
  ExternalLink,
  Sparkles,
  Plus,
  Power
} from 'lucide-react';

const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- RIDERLEDGER: ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tiempo_reparto_minutos INT NOT NULL DEFAULT 0,
    tiempo_espera_minutos INT NOT NULL DEFAULT 0,
    kilometros NUMERIC(6,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('INGRESO', 'GASTO', 'COBRO_EFECTIVO_APP')),
    categoria VARCHAR(50) NOT NULL, 
    subcategoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    monto NUMERIC(12,2) NOT NULL DEFAULT 0,
    medio_pago VARCHAR(30) NOT NULL CHECK (medio_pago IN ('APP', 'EFECTIVO', 'BRE_B')),
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
    activeUser,
    users,
    switchUser,
    createUser,
    deleteUser,
    userApps,
    addUserApp,
    deleteUserApp,
    toggleUserApp
  } = useAppData();

  const [activeTab, setActiveTab] = useState<'apps' | 'familia' | 'supabase' | 'backup'>('apps');

  // Formulario nueva App
  const [newAppName, setNewAppName] = useState('');
  const [newAppType, setNewAppType] = useState<'DOMICILIOS' | 'PASAJEROS'>('DOMICILIOS');
  const [newAppColor, setNewAppColor] = useState('#0284c7');
  const [showAddApp, setShowAddApp] = useState(false);

  // Formulario nuevo Usuario
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('Repartidor Familiar');
  const [showAddUser, setShowAddUser] = useState(false);

  // Supabase
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Ingresa la URL y la Anon Key de Supabase.'
      });
      return;
    }

    setTestResult({ status: 'testing', message: 'Probando conexión...' });
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTestResult({
      status: res.success ? 'success' : 'error',
      message: res.message
    });
  };

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

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;
    addUserApp(newAppName.trim(), newAppType, newAppColor, newAppType === 'DOMICILIOS' ? '🛵' : '🚗');
    setNewAppName('');
    setShowAddApp(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    createUser(newUserName.trim(), newUserRole.trim());
    setNewUserName('');
    setShowAddUser(false);
  };

  const handleExportJson = () => {
    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      activeUser,
      shifts,
      transactions
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const dlUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = dlUrl;
    link.download = `RiderLedger_Backup_${activeUser.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-24">
      {/* Cabecera */}
      <div className="app-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-500" />
            Configuración & Gestión
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administra tus apps, cuentas familiares, conexión Supabase y copias de seguridad
          </p>
        </div>
      </div>

      {/* Píldoras de Navegación dentro de Ajustes */}
      <div className="flex gap-1.5 p-1 app-card rounded-xl overflow-x-auto">
        {[
          { id: 'apps', label: '📱 Mis Aplicaciones', desc: 'Apps activas' },
          { id: 'familia', label: '👥 Cuentas Familiares', desc: 'Perfiles' },
          { id: 'supabase', label: '☁️ Base de Datos', desc: 'Supabase' },
          { id: 'backup', label: '💾 Copia de Seguridad', desc: 'Respaldo' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* 1. ADMINISTRADOR DE APLICACIONES CONFIGURABLES (Punto 7) */}
      {/* ============================================================ */}
      {activeTab === 'apps' && (
        <div className="space-y-4">
          <div className="app-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-500" />
                  Catálogo de Aplicaciones ({userApps.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Activa, desactiva o agrega las plataformas en las que trabajas tú o tu familiar.
                </p>
              </div>

              <button
                onClick={() => setShowAddApp(!showAddApp)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-sm hover:bg-cyan-400 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir App</span>
              </button>
            </div>

            {/* Formulario Nueva App */}
            {showAddApp && (
              <form onSubmit={handleCreateApp} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nueva Plataforma</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre de la App
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Armi, TaDa, Picap"
                      value={newAppName}
                      onChange={e => setNewAppName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Tipo de Servicio
                    </label>
                    <select
                      value={newAppType}
                      onChange={e => setNewAppType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="DOMICILIOS">Domicilios / Envíos</option>
                      <option value="PASAJEROS">Transporte de Pasajeros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Color Distintivo
                    </label>
                    <input
                      type="color"
                      value={newAppColor}
                      onChange={e => setNewAppColor(e.target.value)}
                      className="w-full h-9 rounded-xl border border-slate-300 dark:border-white/10 p-1 bg-white dark:bg-slate-900 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddApp(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-bold"
                  >
                    Guardar App
                  </button>
                </div>
              </form>
            )}

            {/* Listado de Apps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {userApps.map(app => (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                    app.activa
                      ? 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-white/10 shadow-xs'
                      : 'opacity-50 bg-slate-100 dark:bg-slate-900/20 border-dashed border-slate-300 dark:border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: app.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {app.nombre}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {app.tipo}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Botón Activar / Desactivar */}
                    <button
                      onClick={() => toggleUserApp(app.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                        app.activa
                          ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-slate-400 hover:bg-slate-500/10'
                      }`}
                      title={app.activa ? 'Desactivar de formularios' : 'Activar en formularios'}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar ${app.nombre}?`)) {
                          deleteUserApp(app.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Eliminar app"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. GESTIÓN DE USUARIOS Y FAMILIA (Punto 6) */}
      {/* ============================================================ */}
      {activeTab === 'familia' && (
        <div className="app-card rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500" />
                Cuentas Familiares ({users.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cada miembro de tu familia tiene sus propios turnos, ingresos, cuotas y apps aisladas.
              </p>
            </div>

            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-white text-xs font-bold shadow-sm hover:bg-cyan-400 self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Añadir Familiar</span>
            </button>
          </div>

          {/* Formulario Nuevo Usuario Familiar */}
          {showAddUser && (
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 space-y-3 animate-fade-in">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Nuevo Miembro Familiar</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Andrés / Papá"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Rol / Actividad
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Repartidor Rappi / Mensajero Urbano"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 text-white text-xs font-bold"
                >
                  Crear Perfil
                </button>
              </div>
            </form>
          )}

          {/* Tarjetas de Usuarios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {users.map(u => {
              const isCurrent = u.id === activeUser.id;
              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/10 border-cyan-500 shadow-sm'
                      : 'app-card hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white font-black shadow-md"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.nombre.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {u.nombre}
                      </h4>
                      <p className="text-[11px] text-slate-400">{u.rol || 'Miembro Familiar'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-500 text-white">
                        Activo
                      </span>
                    ) : (
                      <button
                        onClick={() => switchUser(u.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-500 hover:text-white transition-colors"
                      >
                        Cambiar
                      </button>
                    )}
                    {users.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar la cuenta de ${u.nombre}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. BASE DE DATOS SUPABASE */}
      {/* ============================================================ */}
      {activeTab === 'supabase' && (
        <div className="space-y-4">
          <div className="app-card rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Conexión Supabase (PostgreSQL)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sincroniza tus registros en la nube en tiempo real
                  </p>
                </div>
              </div>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1 hover:underline"
              >
                Panel Supabase <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project URL de Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://xyzprojectid.supabase.co"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Anon / Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={e => setAnonKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {testResult.status !== 'idle' && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    testResult.status === 'testing'
                      ? 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300'
                      : testResult.status === 'success'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}
                >
                  {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 animate-sync mt-0.5" />}
                  {testResult.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />}
                  {testResult.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">{testResult.message}</div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/10"
                >
                  Probar Conexión
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                >
                  {savedSuccess ? <><Check className="w-4 h-4" /> Guardado</> : 'Guardar Credenciales'}
                </button>
              </div>
            </form>
          </div>

          {/* Script SQL con botón 1-clic */}
          <div className="app-card rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Script SQL para Supabase
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Copia y pega este script en el SQL Editor de tu proyecto en Supabase
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  copiedSql
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10'
                }`}
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 rounded-xl p-3 max-h-40 overflow-y-auto">
              <pre className="text-[10px] text-slate-300 font-mono leading-relaxed whitespace-pre">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. COPIAS DE SEGURIDAD & DEMO */}
      {/* ============================================================ */}
      {activeTab === 'backup' && (
        <div className="app-card rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Gestión de Datos y Copia de Seguridad
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exporta tu información para guardarla o resetea datos para comenzar de nuevo.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              onClick={() => {
                if (window.confirm(`¿Cargar datos de demo para ${activeUser.nombre}?`)) {
                  loadDemoData();
                }
              }}
              className="p-3 rounded-xl app-card hover:border-cyan-500 text-left transition-all"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white">Cargar Demo</p>
              <p className="text-[10px] text-slate-400">Genera 7 días con Rappi, Armi y Bre-B</p>
            </button>

            <button
              onClick={handleExportJson}
              className="p-3 rounded-xl app-card hover:border-cyan-500 text-left transition-all"
            >
              <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-cyan-500" /> Exportar JSON
              </p>
              <p className="text-[10px] text-slate-400">Descarga tu copia de seguridad</p>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`¿Borrar los registros locales de ${activeUser.nombre}?`)) {
                  clearAllData();
                }
              }}
              className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-left transition-all"
            >
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Limpiar Datos
              </p>
              <p className="text-[10px] text-slate-400">Elimina turnos de este usuario</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
