import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertCircle, Loader2, Mail, Mountain, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import AdminSectionNav from '@/components/admin/AdminSectionNav'
import { db } from '@/firebase/firebase'
import { getGmailWebUrl } from '@/services/emailService'
import { getInscritosRuta } from '@/services/apiAdminRutas'

const EMPTY_FORM = {
  nombre: '',
  fecha: '',
  distanciaKm: '',
  desnivel: '',
  dificultad: 'Media',
  descripcion: '',
  imagen: '',
}

function getDateInputValue(fechaRaw) {
  if (!fechaRaw) return ''

  const date = typeof fechaRaw?.toDate === 'function'
    ? fechaRaw.toDate()
    : parseISO(fechaRaw)

  return Number.isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd')
}

export default function AdminRutasPage() {
  const [rutas, setRutas] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [expandedRouteId, setExpandedRouteId] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [attendeesError, setAttendeesError] = useState('')

  useEffect(() => {
    const routesQuery = query(collection(db, 'rutas'), orderBy('fechaRaw', 'asc'))
    return onSnapshot(
      routesQuery,
      (snapshot) => {
        setRutas(snapshot.docs.map((routeDoc) => ({ id: routeDoc.id, ...routeDoc.data() })))
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('No se pudieron cargar las rutas para administración:', snapshotError)
        setError('No se pudieron cargar las rutas. Comprueba la conexión y los permisos de Firestore.')
        setLoading(false)
      }
    )
  }, [])

  const openCreateForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setError(null)
    setFormOpen(true)
  }

  const openEditForm = (ruta) => {
    setEditingId(ruta.id)
    setFormData({
      nombre: ruta.nombre || '',
      fecha: getDateInputValue(ruta.fechaRaw),
      distanciaKm: ruta.distanciaKm ?? '',
      desnivel: ruta.desnivel ?? '',
      dificultad: ruta.dificultad || 'Media',
      descripcion: ruta.descripcion || '',
      imagen: ruta.imagen || '',
    })
    setError(null)
    setFormOpen(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError(null)

    if (!formData.nombre.trim() || !formData.fecha) {
      setError('El nombre y la fecha son obligatorios.')
      return
    }

    const routeDate = parseISO(formData.fecha)
    if (Number.isNaN(routeDate.getTime())) {
      setError('La fecha indicada no es válida.')
      return
    }

    const routeData = {
      nombre: formData.nombre.trim(),
      fecha: format(routeDate, "d 'de' MMMM", { locale: es }),
      fechaRaw: routeDate.toISOString(),
      distanciaKm: Number(formData.distanciaKm) || 0,
      desnivel: Number(formData.desnivel) || 0,
      dificultad: formData.dificultad,
      descripcion: formData.descripcion.trim(),
      imagen: formData.imagen.trim(),
    }

    setSaving(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'rutas', editingId), routeData)
        setNotice('Ruta actualizada correctamente.')
      } else {
        await addDoc(collection(db, 'rutas'), {
          ...routeData,
          asistentes: [],
        })
        setNotice('Ruta creada correctamente.')
      }
      setFormOpen(false)
      setEditingId(null)
      setFormData(EMPTY_FORM)
    } catch (saveError) {
      console.error('No se pudo guardar la ruta:', saveError)
      setError('No se pudo guardar la ruta. Comprueba tus permisos y vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ruta) => {
    if (!window.confirm(`¿Eliminar la ruta "${ruta.nombre}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(ruta.id)
    setError(null)
    setNotice(null)
    try {
      await deleteDoc(doc(db, 'rutas', ruta.id))
      setNotice(`Se eliminó la ruta "${ruta.nombre}".`)
    } catch (deleteError) {
      console.error('No se pudo eliminar la ruta:', deleteError)
      setError('No se pudo eliminar la ruta. Comprueba tus permisos y vuelve a intentarlo.')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAttendees = async (ruta) => {
    if (expandedRouteId === ruta.id) {
      setExpandedRouteId(null)
      setAttendees([])
      setAttendeesError('')
      return
    }

    setExpandedRouteId(ruta.id)
    setAttendees([])
    setAttendeesError('')
    setAttendeesLoading(true)
    try {
      setAttendees(await getInscritosRuta(ruta.id))
    } catch (attendeesLoadError) {
      console.error('No se pudieron cargar los usuarios inscritos:', attendeesLoadError)
      setAttendeesError(attendeesLoadError.message)
    } finally {
      setAttendeesLoading(false)
    }
  }

  const handleOpenGmailConfirmation = (ruta, attendee) => {
    const routeName = ruta.nombre || 'Ruta MTB Los Titanes'
    const subject = `Confirmación de inscripción — ${routeName}`
    const body = [
      `Hola ${attendee.nombre || 'Ciclista'},`,
      '',
      `¡Te has unido correctamente a la ruta ${routeName}!`,
      '',
      `Fecha: ${ruta.fecha || 'Fecha por confirmar'}`,
      `Distancia: ${ruta.distanciaKm ?? 0} km`,
      `Desnivel: +${ruta.desnivel ?? 0} m`,
      `Dificultad: ${ruta.dificultad || 'Sin especificar'}`,
      ruta.descripcion ? `Descripción: ${ruta.descripcion}` : '',
      '',
      '¡Nos vemos en la montaña!',
      'El equipo de MTB Los Titanes',
    ].filter(Boolean).join('\n')

    window.open(
      getGmailWebUrl(attendee.email, subject, body),
      '_blank',
      'noopener,noreferrer'
    )
    setNotice(`Borrador de confirmación abierto en Gmail Web para ${attendee.email}.`)
  }

  return (
    <main className="min-h-screen bg-gray-ultra pt-24 pb-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 md:px-8">
        <AdminSectionNav />

        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <Mountain size={13} />
              Área de Administración
            </span>
            <h1 className="text-3xl font-black tracking-tight text-dark sm:text-4xl">Gestión de Rutas</h1>
            <p className="mt-1 text-sm text-gray-mid">Crea, modifica y elimina las salidas del club.</p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
          >
            <Plus size={17} />
            Nueva ruta
          </button>
        </header>

        {notice && (
          <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {formOpen && (
          <form onSubmit={handleSave} className="mb-8 rounded-2xl border border-gray-soft bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-dark">{editingId ? 'Editar ruta' : 'Crear ruta'}</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 text-gray-mid hover:bg-gray-ultra hover:text-dark"
                aria-label="Cerrar formulario"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark sm:col-span-2">
                Nombre *
                <input
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark">
                Fecha *
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark">
                Distancia (km)
                <input
                  type="number"
                  name="distanciaKm"
                  value={formData.distanciaKm}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark">
                Desnivel (m)
                <input
                  type="number"
                  name="desnivel"
                  value={formData.desnivel}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark">
                Dificultad
                <select
                  name="dificultad"
                  value={formData.dificultad}
                  onChange={handleChange}
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                >
                  <option>Fácil</option>
                  <option>Media</option>
                  <option>Experto</option>
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark sm:col-span-2 lg:col-span-3">
                URL de imagen
                <input
                  type="url"
                  name="imagen"
                  value={formData.imagen}
                  onChange={handleChange}
                  maxLength={2000}
                  placeholder="https://..."
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark sm:col-span-2 lg:col-span-3">
                Descripción
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  className="mt-1.5 w-full resize-y rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-gray-soft px-4 py-2.5 text-sm font-semibold text-gray-dark hover:bg-gray-ultra"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Guardando…' : 'Guardar ruta'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-mid">
            <Loader2 size={18} className="animate-spin" />
            Cargando rutas…
          </div>
        ) : rutas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-soft bg-white px-6 py-16 text-center">
            <Mountain size={32} className="mx-auto mb-3 text-gray-mid" />
            <h2 className="font-bold text-dark">Todavía no hay rutas</h2>
            <p className="mt-1 text-sm text-gray-mid">Crea una ruta para publicarla en el calendario del club.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-soft bg-white">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(130px,1fr)_minmax(120px,0.8fr)_auto] gap-4 border-b border-gray-soft bg-gray-ultra px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-mid md:grid">
              <span>Ruta</span>
              <span>Fecha</span>
              <span>Distancia / dificultad</span>
              <span className="text-right">Acciones</span>
            </div>
            <ul className="divide-y divide-gray-soft">
              {rutas.map((ruta) => (
                <li key={ruta.id} className="p-4 md:px-5">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(130px,1fr)_minmax(120px,0.8fr)_auto] md:items-center md:gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-dark">{ruta.nombre}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-mid">{ruta.descripcion || 'Sin descripción'}</p>
                    </div>
                    <span className="text-sm text-gray-dark">{ruta.fecha || 'Sin fecha'}</span>
                    <span className="text-sm text-gray-dark">
                      {ruta.distanciaKm ?? 0} km · {ruta.dificultad || 'Sin dificultad'}
                    </span>
                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleAttendees(ruta)}
                        aria-expanded={expandedRouteId === ruta.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-soft px-3 py-2 text-xs font-semibold text-gray-dark hover:bg-gray-ultra"
                      >
                        <Users size={14} />
                        Inscritos ({ruta.asistentes?.length ?? 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditForm(ruta)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-soft px-3 py-2 text-xs font-semibold text-gray-dark hover:bg-gray-ultra"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ruta)}
                        disabled={deletingId === ruta.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {deletingId === ruta.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />}
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {expandedRouteId === ruta.id && (
                    <section aria-label={`Usuarios inscritos en ${ruta.nombre}`} className="mt-4 rounded-xl border border-gray-soft bg-gray-ultra p-4">
                      <h3 className="mb-3 text-sm font-bold text-dark">Usuarios inscritos</h3>
                      {attendeesLoading ? (
                        <div className="flex items-center gap-2 py-3 text-sm text-gray-mid">
                          <Loader2 size={16} className="animate-spin" />
                          Cargando inscritos…
                        </div>
                      ) : attendeesError ? (
                        <p role="alert" className="text-sm text-red-700">{attendeesError}</p>
                      ) : attendees.length === 0 ? (
                        <p className="text-sm text-gray-mid">Todavía no hay usuarios inscritos en esta ruta.</p>
                      ) : (
                        <ul className="divide-y divide-gray-soft">
                          {attendees.map((attendee) => {
                            return (
                              <li key={attendee.uid} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-dark">{attendee.nombre}</p>
                                  <p className="truncate text-xs text-gray-mid">{attendee.email || 'Sin correo disponible'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenGmailConfirmation(ruta, attendee)}
                                  disabled={!attendee.email}
                                  className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Mail size={14} />
                                  Confirmación por Gmail
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </section>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
