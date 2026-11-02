/**
 * AdminCitaDetalleModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal de ficha completa de la cita para el taller.
 * Permite visualizar todo el historial, contactar al cliente (llamada, email,
 * WhatsApp) y avanzar rápidamente en el flujo del estado.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  X,
  Bike,
  Calendar,
  Clock,
  Phone,
  Mail,
  Wrench,
  Euro,
  MessageSquare,
  ClipboardList,
  Edit2,
  ExternalLink,
} from 'lucide-react'
import { getServicioLabel, getEstadoConfig, formatearFecha } from '@/utils/citasUtils'

export default function AdminCitaDetalleModal({
  isOpen,
  onClose,
  cita,
  onEdit,
  onUpdateEstado,
  onOpenEmail,
}) {
  if (!isOpen || !cita) return null

  const estadoCfg = getEstadoConfig(cita.estado)

  // Generar enlace directo a WhatsApp si tiene teléfono
  const cleanPhone = cita.telefono ? cita.telefono.replace(/\s+/g, '') : ''
  const whatsappUrl = cleanPhone
    ? `https://wa.me/34${cleanPhone.replace('+34', '')}?text=Hola%20${encodeURIComponent(
        cita.nombre
      )},%20nos%20ponemos%20en%20contacto%20desde%20el%20taller%20MTB%20Los%20Titanes%20respecto%20a%20tu%20cita%20de%20taller.`
    : null

  const pasosFlujo = ['pendiente', 'confirmada', 'en_proceso', 'completada']
  const estadoIndex = pasosFlujo.indexOf(cita.estado)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-soft my-8 overflow-hidden animate-slide-up">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-5 border-b border-gray-soft bg-gray-ultra/50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${estadoCfg.badgeClass}`}
              >
                <span className={`w-2 h-2 rounded-full ${estadoCfg.dotClass}`} />
                {estadoCfg.label}
              </span>
              <span className="text-xs font-mono text-gray-mid">#{cita.id}</span>
            </div>
            <h2 className="text-xl font-black text-dark">{cita.nombre}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-mid hover:text-dark rounded-full hover:bg-gray-soft transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Flujo de Estados visual ──────────────────────────────────────── */}
        {cita.estado !== 'cancelada' && (
          <div className="px-6 py-4 bg-gray-ultra/30 border-b border-gray-soft">
            <p className="text-[11px] font-bold text-gray-mid uppercase tracking-wider mb-2">
              Progreso del Servicio
            </p>
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-gray-soft -z-0" />
              {pasosFlujo.map((paso, idx) => {
                const cfg = getEstadoConfig(paso)
                const isPassed = estadoIndex >= idx
                const isCurrent = cita.estado === paso

                return (
                  <button
                    key={paso}
                    onClick={() => onUpdateEstado(cita.id, paso)}
                    className="flex flex-col items-center gap-1 relative z-10 group"
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? `${cfg.badgeClass} ring-2 ring-current scale-110 shadow-sm`
                          : isPassed
                          ? 'bg-dark text-white'
                          : 'bg-white border border-gray-soft text-gray-mid group-hover:border-gray-dark'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isCurrent
                          ? 'text-dark font-bold'
                          : isPassed
                          ? 'text-gray-dark'
                          : 'text-gray-mid'
                      }`}
                    >
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Contenido de la Ficha ────────────────────────────────────────── */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">

          {/* Contacto rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-ultra border border-gray-soft">
            <div>
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider block mb-1">
                Correo Electrónico
              </span>
              {cita.userEmail ? (
                <a
                  href={`mailto:${cita.userEmail}`}
                  className="text-xs font-semibold text-gray-dark hover:text-accent flex items-center gap-1.5"
                >
                  <Mail size={13} className="text-gray-mid" />
                  {cita.userEmail}
                </a>
              ) : (
                <span className="text-xs text-gray-mid">No indicado</span>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider block mb-1">
                Teléfono de Contacto
              </span>
              {cita.telefono ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${cita.telefono}`}
                    className="text-xs font-semibold text-gray-dark hover:text-accent flex items-center gap-1.5"
                  >
                    <Phone size={13} className="text-gray-mid" />
                    {cita.telefono}
                  </a>
                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 hover:bg-green-200 transition-colors flex items-center gap-1"
                    >
                      WhatsApp
                      <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-mid">No indicado</span>
              )}
            </div>
          </div>

          {/* Detalles de la Bicicleta y Cita */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-gray-soft">
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider flex items-center gap-1 mb-1">
                <Bike size={12} />
                Bicicleta
              </span>
              <p className="text-sm font-bold text-dark">{cita.modeloBici || 'No indicada'}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-soft">
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider flex items-center gap-1 mb-1">
                <Wrench size={12} />
                Servicio
              </span>
              <p className="text-sm font-bold text-accent">{getServicioLabel(cita.tipoServicio)}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-soft">
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider flex items-center gap-1 mb-1">
                <Calendar size={12} />
                Fecha Programada
              </span>
              <p className="text-sm font-bold text-dark">{formatearFecha(cita.fecha)}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-soft">
              <span className="text-[10px] font-bold text-gray-mid uppercase tracking-wider flex items-center gap-1 mb-1">
                <Clock size={12} />
                Hora
              </span>
              <p className="text-sm font-bold text-dark font-mono">{cita.hora || '—'}</p>
            </div>
          </div>

          {/* Coste estimado */}
          {cita.costeEstimado && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <Euro size={15} />
                Presupuesto / Coste Estimado
              </span>
              <span className="text-base font-black text-emerald-900 font-mono">
                {cita.costeEstimado} €
              </span>
            </div>
          )}

          {/* Observaciones cliente */}
          {cita.observaciones && (
            <div>
              <span className="text-xs font-bold text-gray-dark uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <MessageSquare size={14} className="text-gray-mid" />
                Observaciones del Cliente
              </span>
              <div className="p-3.5 rounded-xl bg-gray-ultra border border-gray-soft text-xs text-gray-dark leading-relaxed">
                {cita.observaciones}
              </div>
            </div>
          )}

          {/* Notas de taller */}
          {cita.notasMecanico && (
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <ClipboardList size={14} />
                Notas Técnicas del Taller
              </span>
              <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 text-xs text-gray-dark leading-relaxed">
                {cita.notasMecanico}
              </div>
            </div>
          )}

          {/* Estado de Confirmación por Correo */}
          <div className="p-3.5 rounded-xl bg-gray-ultra border border-gray-soft flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  cita.confirmacionEnviada
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-soft text-gray-mid'
                }`}
              >
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-dark truncate">
                  {cita.confirmacionEnviada
                    ? 'Confirmación enviada al cliente'
                    : 'Confirmación por email pendiente'}
                </p>
                <p className="text-[11px] text-gray-mid truncate">
                  {cita.userEmail
                    ? `Correo: ${cita.userEmail}`
                    : 'Sin correo registrado'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onClose()
                if (onOpenEmail) onOpenEmail(cita)
              }}
              className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Mail size={13} />
              {cita.confirmacionEnviada ? 'Reenviar' : 'Enviar Email'}
            </button>
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-soft flex items-center justify-between bg-gray-ultra/40">
          <button
            onClick={() => {
              onClose()
              onEdit(cita)
            }}
            className="px-4 py-2 bg-dark hover:bg-gray-dark text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit2 size={13} />
            Editar Datos
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-soft text-gray-dark border border-gray-soft text-xs font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
