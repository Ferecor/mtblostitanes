/**
 * AdminCitasCards.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vista en tarjetas interactivas para la gestión visual de citas.
 * Ideal para pantallas táctiles y para ver notas completas sin desbordamiento.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Bike,
  Calendar,
  Clock,
  Phone,
  Mail,
  Wrench,
  MessageSquare,
  ClipboardList,
  Edit2,
  Trash2,
  Eye,
  Check,
  Play,
  CheckCircle2,
  XCircle,
  Euro,
} from 'lucide-react'
import { getServicioLabel, getEstadoConfig, formatearFecha } from '@/utils/citasUtils'

export default function AdminCitasCards({
  citas,
  onUpdateEstado,
  onViewDetalle,
  onEditCita,
  onDeleteCita,
  onOpenEmail,
}) {
  if (!citas.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-soft p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-ultra text-gray-mid flex items-center justify-center mx-auto mb-3">
          <Calendar size={22} />
        </div>
        <p className="text-sm font-semibold text-gray-dark">No hay citas que coincidan con los filtros</p>
        <p className="text-xs text-gray-mid mt-1">Prueba a cambiar el estado o los términos de búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {citas.map((cita) => {
        const estadoCfg = getEstadoConfig(cita.estado)

        return (
          <div
            key={cita.id}
            className="bg-white rounded-2xl border border-gray-soft p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              {/* ── Cabecera: Fecha + Hora + Estado ─────────────────────────── */}
              <div className="flex items-start justify-between gap-2 mb-4 pb-3 border-b border-gray-soft/70">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-ultra text-xs font-bold text-dark border border-gray-soft">
                    <Calendar size={13} className="text-accent" />
                    {formatearFecha(cita.fecha)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-gray-mid">
                    <Clock size={12} />
                    {cita.hora || '—'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {cita.confirmacionEnviada && (
                    <span
                      title="Correo de confirmación enviado"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      Email
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${estadoCfg.badgeClass}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${estadoCfg.dotClass}`} />
                    {estadoCfg.label}
                  </span>
                </div>
              </div>

              {/* ── Info Cliente ────────────────────────────────────────────── */}
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-dark text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {cita.nombre?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-dark text-base truncate">
                      {cita.nombre}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-mid mt-0.5">
                      {cita.userEmail && (
                        <a
                          href={`mailto:${cita.userEmail}`}
                          className="hover:text-accent truncate max-w-[140px] flex items-center gap-1"
                          title={cita.userEmail}
                        >
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{cita.userEmail}</span>
                        </a>
                      )}
                      {cita.telefono && (
                        <a
                          href={`tel:${cita.telefono}`}
                          className="hover:text-accent flex items-center gap-1 shrink-0"
                          title={cita.telefono}
                        >
                          <Phone size={12} className="shrink-0" />
                          <span>{cita.telefono}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bici & Servicio ──────────────────────────────────────────── */}
              <div className="space-y-2 mb-4 bg-gray-ultra/60 p-3 rounded-xl border border-gray-soft/60">
                <div className="flex items-center gap-2 text-xs">
                  <Bike size={14} className="text-gray-mid shrink-0" />
                  <span className="text-gray-mid">Bicicleta:</span>
                  <span className="font-semibold text-dark truncate">
                    {cita.modeloBici || 'No especificada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Wrench size={14} className="text-gray-mid shrink-0" />
                  <span className="text-gray-mid">Servicio:</span>
                  <span className="font-semibold text-accent truncate">
                    {getServicioLabel(cita.tipoServicio)}
                  </span>
                </div>
                {cita.costeEstimado && (
                  <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-soft/50">
                    <Euro size={13} className="text-emerald-600 shrink-0" />
                    <span className="text-gray-mid">Coste est.:</span>
                    <span className="font-bold text-emerald-700">
                      {cita.costeEstimado} €
                    </span>
                  </div>
                )}
              </div>

              {/* ── Observaciones del Cliente ───────────────────────────────── */}
              {cita.observaciones && (
                <div className="mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-mid font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    <MessageSquare size={12} />
                    Observaciones cliente
                  </div>
                  <p className="text-gray-dark bg-white border border-gray-soft p-2.5 rounded-lg text-xs leading-relaxed line-clamp-2">
                    {cita.observaciones}
                  </p>
                </div>
              )}

              {/* ── Notas del Taller ────────────────────────────────────────── */}
              {cita.notasMecanico && (
                <div className="mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-accent font-semibold mb-1 text-[11px] uppercase tracking-wider">
                    <ClipboardList size={12} />
                    Notas taller
                  </div>
                  <p className="text-gray-dark bg-accent/5 border border-accent/20 p-2.5 rounded-lg text-xs leading-relaxed line-clamp-2">
                    {cita.notasMecanico}
                  </p>
                </div>
              )}
            </div>

            {/* ── Acciones Rápidas de Estado y Menú ────────────────────────── */}
            <div className="pt-4 border-t border-gray-soft/70 space-y-2 mt-2">
              <div className="flex items-center justify-between gap-1.5">

                {/* Botón rápido según estado actual */}
                {cita.estado === 'pendiente' && (
                  <button
                    onClick={() => onUpdateEstado(cita.id, 'confirmada')}
                    className="flex-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check size={13} />
                    Confirmar Cita
                  </button>
                )}

                {cita.estado === 'confirmada' && (
                  <button
                    onClick={() => onUpdateEstado(cita.id, 'en_proceso')}
                    className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Play size={13} />
                    Pasar a Taller
                  </button>
                )}

                {cita.estado === 'en_proceso' && (
                  <button
                    onClick={() => onUpdateEstado(cita.id, 'completada')}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 size={13} />
                    Marcar Lista
                  </button>
                )}

                {(cita.estado === 'completada' || cita.estado === 'cancelada') && (
                  <button
                    onClick={() => onUpdateEstado(cita.id, 'pendiente')}
                    className="flex-1 py-1.5 px-3 bg-gray-ultra hover:bg-gray-soft text-gray-dark text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-gray-soft"
                  >
                    Reabrir Cita
                  </button>
                )}

                {cita.estado !== 'cancelada' && cita.estado !== 'completada' && (
                  <button
                    onClick={() => onUpdateEstado(cita.id, 'cancelada')}
                    title="Cancelar Cita"
                    className="p-1.5 text-gray-mid hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XCircle size={16} />
                  </button>
                )}

                {/* Acciones secundarias */}
                <div className="flex items-center gap-1 pl-1">
                  <button
                    onClick={() => onOpenEmail && onOpenEmail(cita)}
                    title={
                      cita.confirmacionEnviada
                        ? 'Reenviar email de confirmación al cliente'
                        : 'Enviar email de confirmación al usuario registrado'
                    }
                    className={`p-1.5 rounded-lg transition-colors ${
                      cita.confirmacionEnviada
                        ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        : 'text-accent bg-accent/10 hover:bg-accent/20'
                    }`}
                  >
                    <Mail size={16} />
                  </button>
                  <button
                    onClick={() => onViewDetalle(cita)}
                    title="Ver Detalle"
                    className="p-1.5 text-gray-mid hover:text-dark hover:bg-gray-ultra rounded-lg transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onEditCita(cita)}
                    title="Editar Cita"
                    className="p-1.5 text-gray-mid hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDeleteCita(cita)}
                    title="Eliminar Cita"
                    className="p-1.5 text-gray-mid hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
