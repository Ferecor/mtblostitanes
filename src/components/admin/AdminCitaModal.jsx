/**
 * AdminCitaModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal para Crear una nueva cita manual o Editar una existente por el administrador.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Bike,
  Wrench,
  Calendar,
  Clock,
  Euro,
  ClipboardList,
  Save,
  PlusCircle,
  Loader2,
} from 'lucide-react'
import { TIPOS_SERVICIO, ESTADOS_CITA } from '@/data/mockData'

const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30',
]

export default function AdminCitaModal({
  isOpen,
  onClose,
  cita, // si viene definida, es modo edición; si es null, es modo creación
  onSave,
}) {
  const isEditing = Boolean(cita?.id)

  const [formData, setFormData] = useState({
    nombre: '',
    userEmail: '',
    telefono: '',
    modeloBici: '',
    tipoServicio: 'mantenimiento',
    fecha: '',
    hora: '10:00',
    estado: 'confirmada',
    costeEstimado: '',
    observaciones: '',
    notasMecanico: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cita) {
      setFormData({
        nombre: cita.nombre || '',
        userEmail: cita.userEmail || '',
        telefono: cita.telefono || '',
        modeloBici: cita.modeloBici || '',
        tipoServicio: cita.tipoServicio || 'mantenimiento',
        fecha: cita.fecha || '',
        hora: cita.hora || '10:00',
        estado: cita.estado || 'confirmada',
        costeEstimado: cita.costeEstimado !== undefined ? cita.costeEstimado : '',
        observaciones: cita.observaciones || '',
        notasMecanico: cita.notasMecanico || '',
      })
    } else {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      setFormData({
        nombre: '',
        userEmail: '',
        telefono: '',
        modeloBici: '',
        tipoServicio: 'mantenimiento',
        fecha: tomorrowStr,
        hora: '10:00',
        estado: 'confirmada',
        costeEstimado: '',
        observaciones: '',
        notasMecanico: '',
      })
    }
    setError(null)
  }, [cita, isOpen])

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!formData.nombre.trim()) {
      setError('El nombre del cliente es obligatorio.')
      return
    }
    if (!formData.fecha) {
      setError('La fecha es obligatoria.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...formData,
        costeEstimado: formData.costeEstimado ? Number(formData.costeEstimado) : null,
      })
      onClose()
    } catch (err) {
      setError('Error al guardar la cita. Inténtalo de nuevo.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-soft my-8 overflow-hidden animate-slide-up">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-soft flex items-center justify-between bg-gray-ultra/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              {isEditing ? <Wrench size={18} /> : <PlusCircle size={18} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark">
                {isEditing ? 'Editar Cita de Taller' : 'Registrar Nueva Cita'}
              </h2>
              <p className="text-xs text-gray-mid">
                {isEditing ? `Modificando cita de ${cita.nombre}` : 'Añadir cita manual por llamada o mostrador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-mid hover:text-dark rounded-full hover:bg-gray-soft transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Error banner ─────────────────────────────────────────────────── */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200">
            {error}
          </div>
        )}

        {/* ── Formulario ───────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {/* Fila 1: Cliente y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Cliente *
              </label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
                <input
                  type="email"
                  name="userEmail"
                  value={formData.userEmail}
                  onChange={handleChange}
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Teléfono
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="600 000 000"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Fila 2: Bicicleta y Servicio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Bicicleta / Modelo
              </label>
              <div className="relative">
                <Bike size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
                <input
                  type="text"
                  name="modeloBici"
                  value={formData.modeloBici}
                  onChange={handleChange}
                  placeholder="Ej: Orbea Oiz M10"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Tipo de Servicio
              </label>
              <div className="relative">
                <Wrench size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid" />
                <select
                  name="tipoServicio"
                  value={formData.tipoServicio}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
                >
                  {TIPOS_SERVICIO.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Fila 3: Fecha, Hora, Estado y Presupuesto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Fecha *
              </label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                  className="w-full pl-9 pr-2 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Hora
              </label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
                <select
                  name="hora"
                  value={formData.hora}
                  onChange={handleChange}
                  className="w-full pl-9 pr-2 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer font-mono"
                >
                  {HORARIOS.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs font-semibold bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent cursor-pointer"
              >
                {ESTADOS_CITA.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
                Coste Estimado (€)
              </label>
              <div className="relative">
                <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
                <input
                  type="number"
                  name="costeEstimado"
                  value={formData.costeEstimado}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="5"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Observaciones del cliente */}
          <div>
            <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1">
              Observaciones del Cliente
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={2}
              placeholder="Descripción del problema aportada por el cliente..."
              className="w-full p-3 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          {/* Notas internas del taller */}
          <div>
            <label className="block text-xs font-semibold text-accent uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <ClipboardList size={13} />
              Notas internas del Mecánico / Taller
            </label>
            <textarea
              name="notasMecanico"
              value={formData.notasMecanico}
              onChange={handleChange}
              rows={2}
              placeholder="Piezas a pedir, estado de la transmisión, diagnósticos técnicos..."
              className="w-full p-3 text-xs bg-accent/5 border border-accent/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent resize-none"
            />
          </div>

          {/* ── Footer con botones ─────────────────────────────────────────── */}
          <div className="pt-4 border-t border-gray-soft flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 text-xs font-semibold text-gray-dark hover:bg-gray-ultra rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-xs font-bold text-white bg-accent hover:bg-accent-hover rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={14} />
                  {isEditing ? 'Guardar Cambios' : 'Registrar Cita'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
