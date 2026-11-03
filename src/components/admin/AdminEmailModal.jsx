/**
 * AdminEmailModal.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Modal para enviar el correo de confirmación de cita al usuario registrado.
 *
 * Características:
 *   - Destinatario automático: correo del usuario registrado en la cita (userEmail)
 *   - Asunto y plantilla personalizada con todos los datos técnicos del taller
 *   - Edición previa antes del envío
 *   - Enlaces directos a:
 *       • Gmail Web (abre borrador redactado listo para pulsar enviar)
 *   - Botón de copia al portapapeles
 *   - Registro y marca de confirmación enviada en Firestore / base de datos
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Clock,
  Bike,
  User,
  Info,
} from 'lucide-react'
import {
  generarAsuntoConfirmacion,
  generarCuerpoConfirmacion,
  getGmailWebUrl,
} from '@/services/emailService'
import { formatearFecha } from '@/utils/citasUtils'

export default function AdminEmailModal({
  isOpen,
  onClose,
  cita,
  onMarcarEnviado,
}) {
  const [destinatario, setDestinatario] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [marcado, setMarcado] = useState(false)

  useEffect(() => {
    if (cita) {
      setDestinatario(cita.userEmail || '')
      setAsunto(generarAsuntoConfirmacion(cita))
      setCuerpo(generarCuerpoConfirmacion(cita))
      setCopiado(false)
      setMarcado(Boolean(cita.confirmacionEnviada))
    }
  }, [cita, isOpen])

  if (!isOpen || !cita) return null

  // ── Copiar al portapapeles ──────────────────────────────────────────────────
  const handleCopiar = async () => {
    try {
      const textoCompleto = `Para: ${destinatario}\nAsunto: ${asunto}\n\n${cuerpo}`
      await navigator.clipboard.writeText(textoCompleto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch (e) {
      console.warn('Error al copiar al portapapeles:', e)
    }
  }

  // ── Abrir en Gmail Web ──────────────────────────────────────────────────────
  const handleAbrirGmail = async () => {
    const url = getGmailWebUrl(destinatario, asunto, cuerpo)
    window.open(url, '_blank', 'noopener,noreferrer')
    if (onMarcarEnviado) {
      await onMarcarEnviado(cita.id, destinatario)
      setMarcado(true)
    }
  }

  // ── Marcar manualmente como enviado ─────────────────────────────────────────
  const handleMarcarManual = async () => {
    if (onMarcarEnviado) {
      await onMarcarEnviado(cita.id, destinatario)
      setMarcado(true)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-soft my-6 overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-gray-soft bg-gray-ultra/60 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-dark">
                  Enviar Confirmación de Cita
                </h2>
                {marcado && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 size={11} />
                    Ya enviada
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-mid">
                Se enviará al correo registrado del usuario: <span className="font-semibold text-gray-dark">{destinatario || 'Sin email'}</span>
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

        {/* ── Resumen de Cita ──────────────────────────────────────────────── */}
        <div className="px-6 py-3 bg-gray-ultra/30 border-b border-gray-soft text-xs flex flex-wrap items-center gap-4 text-gray-dark shrink-0">
          <div className="flex items-center gap-1.5 font-semibold">
            <User size={13} className="text-gray-mid" />
            {cita.nombre}
          </div>
          <div className="flex items-center gap-1.5">
            <Bike size={13} className="text-gray-mid" />
            {cita.modeloBici || 'MTB'}
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Calendar size={13} className="text-accent" />
            {formatearFecha(cita.fecha)}
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <Clock size={13} className="text-gray-mid" />
            {cita.hora}
          </div>
        </div>

        {/* ── Formulario de Correo ─────────────────────────────────────────── */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">

          {/* Destinatario */}
          <div>
            <label className="block text-xs font-bold text-gray-dark uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Para (Correo del Usuario Registrado) *</span>
              <span className="text-[10px] text-accent font-semibold normal-case">
                Obtenido del registro de la cita
              </span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none" />
              <input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-medium text-dark"
              />
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="block text-xs font-bold text-gray-dark uppercase tracking-wider mb-1">
              Asunto del Correo
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-ultra border border-gray-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent font-medium text-dark"
            />
          </div>

          {/* Cuerpo del Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-dark uppercase tracking-wider">
                Mensaje de Confirmación (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopiar}
                className="text-[11px] font-semibold text-accent hover:underline flex items-center gap-1"
              >
                {copiado ? (
                  <>
                    <Check size={12} className="text-green-600" />
                    <span className="text-green-600">¡Mensaje copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    Copiar texto completo
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={11}
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              className="w-full p-3 text-xs bg-gray-ultra border border-gray-soft rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent text-gray-dark leading-relaxed font-sans resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
            <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Se abrirá un borrador en <strong>Gmail Web</strong> para que puedas revisarlo y enviarlo.
            </p>
          </div>
        </div>

        {/* ── Footer con Botones de Envío ──────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-soft bg-gray-ultra/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <button
            type="button"
            onClick={handleMarcarManual}
            className={`text-xs font-semibold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              marcado
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'text-gray-mid hover:text-dark hover:bg-gray-soft/60'
            }`}
          >
            <CheckCircle2 size={14} className={marcado ? 'text-emerald-600' : ''} />
            {marcado ? 'Marcado como enviado' : 'Marcar como enviado sin abrir'}
          </button>

          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleAbrirGmail}
              disabled={!destinatario}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <span>Gmail Web</span>
              <ExternalLink size={13} />
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
