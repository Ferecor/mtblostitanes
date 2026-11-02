import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { AlertCircle, Image, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import AdminSectionNav from '@/components/admin/AdminSectionNav'
import { GALERIA_MOCK } from '@/data/mockData'
import { db } from '@/firebase/firebase'
import { handleImageFallback } from '@/utils/imageUtils'

const EMPTY_FORM = { url: '', alt: '' }
const GALLERY_STATE_ID = 'gallery-state'

export default function AdminGaleriaPage() {
  const [fotos, setFotos] = useState([])
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'galeria'),
      (snapshot) => {
        setInitialized(snapshot.docs.some((fotoDoc) => fotoDoc.id === GALLERY_STATE_ID))
        setFotos(snapshot.docs.filter((fotoDoc) => fotoDoc.id !== GALLERY_STATE_ID).map((fotoDoc) => ({
          id: fotoDoc.id,
          ...fotoDoc.data(),
        })))
        setError(null)
        setLoading(false)
      },
      (snapshotError) => {
        console.error('No se pudieron cargar las imágenes de la galería:', snapshotError)
        setError('No se pudieron cargar las imágenes. Comprueba la conexión y los permisos de Firestore.')
        setLoading(false)
      }
    )
  }, [])

  const openCreateForm = () => {
    setEditingId(null)
    setFormData(EMPTY_FORM)
    setError(null)
    setNotice(null)
    setFormOpen(true)
  }

  const openEditForm = (foto) => {
    setEditingId(foto.id)
    setFormData({ url: foto.url || foto.thumbnail || '', alt: foto.alt || '' })
    setError(null)
    setNotice(null)
    setFormOpen(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setError(null)
    setNotice(null)

    let imageUrl
    try {
      imageUrl = new URL(formData.url.trim())
      if (!['http:', 'https:'].includes(imageUrl.protocol)) throw new Error('URL no válida')
    } catch {
      setError('Introduce una URL válida de imagen (http o https).')
      return
    }

    const imageData = {
      url: imageUrl.href,
      thumbnail: imageUrl.href,
      alt: formData.alt.trim(),
    }

    setSaving(true)
    try {
      const batch = writeBatch(db)
      if (editingId) {
        batch.update(doc(db, 'galeria', editingId), imageData)
      } else {
        batch.set(doc(collection(db, 'galeria')), {
          ...imageData,
          creadoEn: serverTimestamp(),
        })
      }
      batch.set(doc(db, 'galeria', GALLERY_STATE_ID), { tipo: 'configuracion' })
      await batch.commit()
      setNotice(editingId ? 'Imagen actualizada correctamente.' : 'Imagen añadida correctamente.')
      setFormOpen(false)
      setEditingId(null)
      setFormData(EMPTY_FORM)
    } catch (saveError) {
      console.error('No se pudo guardar la imagen de la galería:', saveError)
      setError('No se pudo guardar la imagen. Comprueba tus permisos y vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (foto) => {
    if (!window.confirm(`¿Eliminar la imagen "${foto.alt || 'sin descripción'}"? Esta acción no se puede deshacer.`)) return

    setDeletingId(foto.id)
    setError(null)
    setNotice(null)
    try {
      const batch = writeBatch(db)
      batch.delete(doc(db, 'galeria', foto.id))
      batch.set(doc(db, 'galeria', GALLERY_STATE_ID), { tipo: 'configuracion' })
      await batch.commit()
      setNotice('Imagen eliminada correctamente.')
    } catch (deleteError) {
      console.error('No se pudo eliminar la imagen de la galería:', deleteError)
      setError('No se pudo eliminar la imagen. Comprueba tus permisos y vuelve a intentarlo.')
    } finally {
      setDeletingId(null)
    }
  }

  const importCurrentGallery = async () => {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const batch = writeBatch(db)
      batch.set(doc(db, 'galeria', GALLERY_STATE_ID), { tipo: 'configuracion' })
      GALERIA_MOCK.forEach((foto) => {
        batch.set(doc(db, 'galeria', foto.id), {
          url: foto.url,
          thumbnail: foto.thumbnail,
          alt: foto.alt,
          fecha: foto.fecha,
        })
      })
      await batch.commit()
      setNotice('Las imágenes actuales ya están disponibles para gestionarlas.')
    } catch (importError) {
      console.error('No se pudo importar la galería actual:', importError)
      setError('No se pudo importar la galería. Comprueba tus permisos de Firestore y vuelve a intentarlo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-ultra pt-24 pb-20">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 md:px-8">
        <AdminSectionNav />

        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              <Image size={13} />
              Área de Administración
            </span>
            <h1 className="text-3xl font-black tracking-tight text-dark sm:text-4xl">Gestión de Galería</h1>
            <p className="mt-1 text-sm text-gray-mid">Añade, modifica y elimina imágenes de la galería pública.</p>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-accent-hover"
            >
              <Plus size={17} />
              Añadir imagen
            </button>
          )}
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
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setFormOpen(false)
            }}
          >
          <form
            onSubmit={handleSave}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-form-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-gray-soft bg-white p-5 shadow-xl sm:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="gallery-form-title" className="text-xl font-bold text-dark">{editingId ? 'Editar imagen' : 'Añadir imagen'}</h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg p-2 text-gray-mid hover:bg-gray-ultra hover:text-dark"
                aria-label="Cerrar formulario"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark sm:col-span-2">
                URL de la imagen *
                <input
                  type="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  required
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-dark sm:col-span-2">
                Descripción de la imagen *
                <input
                  name="alt"
                  value={formData.alt}
                  onChange={handleChange}
                  required
                  maxLength={200}
                  placeholder="Describe brevemente la imagen"
                  className="mt-1.5 w-full rounded-lg border border-gray-soft bg-gray-ultra px-3 py-2.5 text-sm normal-case tracking-normal focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-gray-mid">Usa una URL pública de imagen; la subida directa de archivos no está habilitada.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-gray-soft px-4 py-2.5 text-sm font-semibold text-gray-dark hover:bg-gray-ultra"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingId ? 'Guardar cambios' : 'Añadir imagen'}
              </button>
            </div>
          </form>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-gray-soft bg-white p-10 text-center text-sm text-gray-mid">
            <Loader2 size={22} className="mx-auto mb-3 animate-spin text-accent" />
            Cargando imágenes…
          </div>
        ) : fotos.length === 0 && !initialized ? (
          <section className="rounded-2xl border border-gray-soft bg-white p-6 text-center shadow-sm sm:p-10">
            <Image size={36} className="mx-auto mb-4 text-accent" />
            <h2 className="text-xl font-bold text-dark">Prepara la galería para gestionarla</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-mid">
              Importa las imágenes que se muestran actualmente en la página pública. Después podrás añadir, editar y eliminar imágenes desde aquí.
            </p>
            <button
              type="button"
              onClick={importCurrentGallery}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />}
              Importar imágenes actuales
            </button>
          </section>
        ) : fotos.length === 0 ? (
          <section className="rounded-2xl border border-gray-soft bg-white p-8 text-center shadow-sm">
            <Image size={32} className="mx-auto mb-3 text-gray-mid" />
            <p className="text-sm text-gray-mid">La galería está vacía. Añade una imagen para que aparezca en la página pública.</p>
          </section>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fotos.map((foto) => (
              <article key={foto.id} className="overflow-hidden rounded-2xl border border-gray-soft bg-white shadow-sm">
                <img
                  src={foto.thumbnail || foto.url}
                  alt={foto.alt}
                  onError={handleImageFallback}
                  loading="lazy"
                  className="h-56 w-full bg-gray-ultra object-cover"
                />
                <div className="p-4">
                  <p className="min-h-10 text-sm font-medium text-dark">{foto.alt || 'Sin descripción'}</p>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(foto)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-soft px-3 py-2 text-xs font-bold text-gray-dark hover:border-accent/40 hover:text-accent"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(foto)}
                      disabled={deletingId === foto.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === foto.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
