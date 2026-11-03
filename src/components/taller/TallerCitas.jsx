/**
 * TallerCitas.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Formulario de reserva de cita en el taller del club MTB Tinanes.
 *
 * Funcionalidad:
 *   - Campos: Nombre, Modelo Bici, Tipo de Servicio, Fecha, Hora
 *   - Validación con React Hook Form
 *   - Envío a colección 'citas' en Firestore vinculado al userId
 *   - Feedback visual: loading, éxito y error
 *   - Solo accesible para usuarios autenticados (ver ProtectedRoute)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Wrench,
  Bike,
  CalendarDays,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  X,
  Trash2,
} from 'lucide-react'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useAuth } from '@/context/AuthContext'
import { db } from '@/firebase/firebase'
import { useFirestore } from '@/hooks/useFirestore'
import { formatearFecha, getEstadoConfig, getServicioLabel } from '@/utils/citasUtils'
import { TIPOS_SERVICIO } from '@/data/mockData'

// ── Horarios disponibles ──────────────────────────────────────────────────────
const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30',
]

// ── Fecha mínima: mañana ──────────────────────────────────────────────────────
function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

// ── Subcomponente: campo de formulario con icono ──────────────────────────────
function FormField({ label, icon: Icon, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none z-10"
          />
        )}
        {children}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
    </div>
  )
}

// ── Componente Principal ──────────────────────────────────────────────────────
export default function TallerCitas() {
  const { currentUser, userCitas, userCitasLoading, userCitasError } = useAuth()
  const { addDocument, loading: fbLoading } = useFirestore('citas')
  const [successMsg, setSuccessMsg]         = useState(null)
  const [submitError, setSubmitError]       = useState(null)
  const [citaToReplace, setCitaToReplace]   = useState(null)
  const [pendingRequest, setPendingRequest] = useState(null)
  const [replacingCita, setReplacingCita]   = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre:         currentUser?.displayName ?? '',
      modeloBici:     '',
      tipoServicio:   '',
      fecha:          '',
      hora:           '',
      observaciones:  '',
    },
  })

  // ── Estilos base para inputs ────────────────────────────────────────────────
  const inputBase = (hasError) =>
    `w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg bg-gray-ultra focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all ${
      hasError ? 'border-red-300 bg-red-50/30' : 'border-gray-soft'
    }`

  const selectBase = (hasError) =>
    `w-full pl-9 pr-8 py-2.5 text-sm border rounded-lg bg-gray-ultra focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none cursor-pointer ${
      hasError ? 'border-red-300' : 'border-gray-soft'
    }`

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSuccessMsg(null)
    setSubmitError(null)

    if (userCitasLoading || userCitasError) {
      setSubmitError('No se pudieron comprobar tus citas. Inténtalo de nuevo más tarde.')
      return
    }

    const citaActiva = userCitas.find((cita) =>
      ['pendiente', 'confirmada', 'en_proceso'].includes(cita.estado)
    )
    if (citaActiva) {
      setCitaToReplace(citaActiva)
      setPendingRequest(data)
      return
    }

    try {
      await addDocument({
        userId:        currentUser.uid,
        userEmail:     currentUser.email,
        nombre:        data.nombre,
        modeloBici:    data.modeloBici,
        tipoServicio:  data.tipoServicio,
        fecha:         data.fecha,
        hora:          data.hora,
        observaciones: data.observaciones,
        estado:        'pendiente', // pendiente | confirmada | completada
      })

      setSuccessMsg(`¡Cita solicitada para el ${data.fecha} a las ${data.hora}! Recibirás confirmación pronto.`)
      reset({ nombre: currentUser?.displayName ?? '' })
    } catch {
      setSubmitError('No se pudo enviar la solicitud. Inténtalo de nuevo.')
    }
  }

  const handleKeepAppointment = () => {
    setCitaToReplace(null)
    setPendingRequest(null)
  }

  const handleReplaceAppointment = async () => {
    if (!citaToReplace || !pendingRequest) return

    setReplacingCita(true)
    setSubmitError(null)
    try {
      const batch = writeBatch(db)
      const nuevaCitaRef = doc(collection(db, 'citas'))
      batch.delete(doc(db, 'citas', citaToReplace.id))
      batch.set(nuevaCitaRef, {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        nombre: pendingRequest.nombre,
        modeloBici: pendingRequest.modeloBici,
        tipoServicio: pendingRequest.tipoServicio,
        fecha: pendingRequest.fecha,
        hora: pendingRequest.hora,
        observaciones: pendingRequest.observaciones,
        estado: 'pendiente',
        creadoEn: serverTimestamp(),
      })
      await batch.commit()

      setSuccessMsg(`¡Cita solicitada para el ${pendingRequest.fecha} a las ${pendingRequest.hora}! Recibirás confirmación pronto.`)
      reset({ nombre: currentUser?.displayName ?? '' })
      handleKeepAppointment()
    } catch (error) {
      console.error('No se pudo reemplazar la cita pendiente:', error)
      setSubmitError('No se pudo reemplazar la cita. No se realizaron cambios; inténtalo de nuevo.')
    } finally {
      setReplacingCita(false)
    }
  }

  const isLoading = isSubmitting || fbLoading || replacingCita || userCitasLoading

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Header del formulario ──────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
          <Wrench size={12} />
          Taller
        </div>
        <h2 className="text-3xl font-bold text-dark mb-2">Pedir Cita</h2>
        <p className="text-gray-mid">
          Reserva tu servicio de taller. Te confirmaremos la cita por email
          en un máximo de 24 horas.
        </p>
      </div>

      {/* ── Mensaje de error ──────────────────────────────────────────────────── */}
      {submitError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}

      {/* ── Formulario ────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="bg-white border border-gray-soft rounded-2xl p-6 md:p-8 shadow-sm space-y-5"
      >

        {/* ── Nombre ──────────────────────────────────────────────────────────── */}
        <FormField label="Nombre" icon={User} error={errors.nombre?.message}>
          <input
            type="text"
            placeholder="Tu nombre completo"
            className={inputBase(!!errors.nombre)}
            {...register('nombre', {
              required: 'El nombre es obligatorio',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
          />
        </FormField>

        {/* ── Modelo de Bici ───────────────────────────────────────────────────── */}
        <FormField label="Bicicleta / Modelo" icon={Bike} error={errors.modeloBici?.message}>
          <input
            type="text"
            placeholder="Ej: Trek Fuel EX 9.9 2023"
            className={inputBase(!!errors.modeloBici)}
            {...register('modeloBici', {
              required: 'Indica tu bicicleta o modelo',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            })}
          />
        </FormField>

        {/* ── Tipo de Servicio ─────────────────────────────────────────────────── */}
        <FormField label="Tipo de Servicio" icon={Wrench} error={errors.tipoServicio?.message}>
          <select
            className={selectBase(!!errors.tipoServicio)}
            {...register('tipoServicio', { required: 'Selecciona un tipo de servicio' })}
          >
            <option value="">— Selecciona un servicio —</option>
            {TIPOS_SERVICIO.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none"
          />
        </FormField>

        {/* ── Fecha y Hora ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <FormField label="Fecha" icon={CalendarDays} error={errors.fecha?.message}>
            <input
              type="date"
              min={getTomorrow()}
              className={inputBase(!!errors.fecha)}
              {...register('fecha', { required: 'Selecciona una fecha' })}
            />
          </FormField>

          <FormField label="Hora" icon={Clock} error={errors.hora?.message}>
            <select
              className={selectBase(!!errors.hora)}
              {...register('hora', { required: 'Selecciona una hora' })}
            >
              <option value="">— Hora —</option>
              {HORARIOS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-mid pointer-events-none"
            />
          </FormField>
        </div>

        {/* ── Observaciones (opcional) ─────────────────────────────────────────── */}
        <div>
          <label className="block text-xs font-semibold text-gray-dark uppercase tracking-wide mb-1.5">
            Observaciones <span className="font-normal text-gray-mid normal-case">(opcional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="Describe brevemente el problema o lo que necesitas..."
            className="w-full px-4 py-2.5 text-sm border border-gray-soft rounded-lg bg-gray-ultra focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none"
            {...register('observaciones')}
          />
        </div>

        {/* ── Info de usuario logueado ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-ultra border border-gray-soft">
          <div className="w-6 h-6 rounded-full bg-dark flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {currentUser?.displayName?.[0]?.toUpperCase() ?? currentUser?.email?.[0]?.toUpperCase()}
          </div>
          <p className="text-xs text-gray-mid">
            Cita registrada para{' '}
            <span className="font-semibold text-gray-dark">
              {currentUser?.email}
            </span>
          </p>
        </div>

        {/* ── Botón de envío ───────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={isLoading || Boolean(userCitasError)}
          className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 text-sm shadow-sm hover:shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Enviando solicitud...
            </>
          ) : (
            <>
              <Wrench size={16} />
              Solicitar Cita
            </>
          )}
        </button>
      </form>

      <section className="mt-10" aria-labelledby="mis-citas-heading" aria-live="polite">
        <h2 id="mis-citas-heading" className="text-xl font-bold text-dark mb-4">
          Mis citas
        </h2>

        {userCitasLoading ? (
          <p className="text-sm text-gray-mid">Sincronizando tus citas...</p>
        ) : userCitasError ? (
          <p role="alert" className="text-sm text-red-600">{userCitasError}</p>
        ) : userCitas.length === 0 ? (
          <p className="text-sm text-gray-mid">Todavía no tienes citas solicitadas.</p>
        ) : (
          <div className="divide-y divide-gray-soft border-y border-gray-soft">
            {userCitas.map((cita) => {
              const estado = getEstadoConfig(cita.estado)

              return (
                <article key={cita.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-dark">
                      {getServicioLabel(cita.tipoServicio)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-mid">
                      {cita.modeloBici || 'Bicicleta no especificada'}
                    </p>
                    <p className="mt-1 flex items-center gap-3 text-xs text-gray-mid">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} />
                        {formatearFecha(cita.fecha)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={13} />
                        {cita.hora || 'Hora pendiente'}
                      </span>
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${estado.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estado.dotClass}`} />
                    {estado.label}
                  </span>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {citaToReplace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(event) => event.target === event.currentTarget && !replacingCita && handleKeepAppointment()}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cita-pendiente-title"
            className="relative w-full max-w-md rounded-2xl border border-gray-soft bg-white p-6 shadow-2xl animate-slide-up"
          >
            <button
              type="button"
              onClick={handleKeepAppointment}
              disabled={replacingCita}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-mid transition-colors hover:bg-gray-soft hover:text-dark disabled:opacity-50"
            >
              <X size={18} />
            </button>

            <h2 id="cita-pendiente-title" className="pr-8 text-lg font-bold text-dark">
              Ya tienes una cita pendiente
            </h2>
            <p className="mt-2 text-sm text-gray-mid">
              ¿Quieres conservarla o eliminarla para solicitar otra?
            </p>

            <div className="mt-4 rounded-xl border border-gray-soft bg-gray-ultra p-3 text-sm">
              <p className="font-semibold text-dark">{getServicioLabel(citaToReplace.tipoServicio)}</p>
              <p className="mt-1 text-gray-mid">{formatearFecha(citaToReplace.fecha)} · {citaToReplace.hora || 'Hora pendiente'}</p>
            </div>

            <p className="mt-3 text-xs text-gray-mid">
              Si la eliminas, se borrará esa cita y se registrará la nueva solicitud.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleKeepAppointment}
                disabled={replacingCita}
                className="rounded-xl border border-gray-soft px-4 py-2.5 text-xs font-semibold text-gray-dark transition-colors hover:bg-gray-ultra disabled:opacity-50"
              >
                Conservar cita
              </button>
              <button
                type="button"
                onClick={handleReplaceAppointment}
                disabled={replacingCita}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {replacingCita ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Reemplazando...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Eliminar y pedir otra
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {successMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={(event) => event.target === event.currentTarget && setSuccessMsg(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitud-enviada-title"
            className="relative w-full max-w-md rounded-2xl border border-gray-soft bg-white p-6 text-center shadow-2xl animate-slide-up"
          >
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-mid transition-colors hover:bg-gray-soft hover:text-dark"
            >
              <X size={18} />
            </button>

            <CheckCircle2 size={42} className="mx-auto mb-4 text-green-500" />
            <h2 id="solicitud-enviada-title" className="text-lg font-bold text-green-800">
              ¡Solicitud enviada!
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-green-700">{successMsg}</p>
            <button
              type="button"
              onClick={() => setSuccessMsg(null)}
              className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-accent-hover"
            >
              Aceptar
            </button>
          </section>
        </div>
      )}

    </div>
  )
}
