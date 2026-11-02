/**
 * GaleriaGrid.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Grid fotográfico responsivo con hover minimalista y Lightbox al clic.
 * Carga datos de mockData (extensible a Firestore).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react'
import { ZoomIn } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { GALERIA_MOCK } from '@/data/mockData'
import Lightbox from './Lightbox'
import { handleImageFallback } from '@/utils/imageUtils'

export default function GaleriaGrid() {
  const [fotos, setFotos] = useState(GALERIA_MOCK)
  const [lightboxIdx, setLightboxIdx] = useState(null)

  useEffect(() => {
    return onSnapshot(
      collection(db, 'galeria'),
      (snapshot) => {
        const photoDocs = snapshot.docs.filter((fotoDoc) => fotoDoc.id !== 'gallery-state')
        setFotos(snapshot.empty
          ? GALERIA_MOCK
          : photoDocs.map((fotoDoc) => {
            const foto = fotoDoc.data()
            return {
              id: fotoDoc.id,
              ...foto,
              url: foto.url || foto.thumbnail,
              thumbnail: foto.thumbnail || foto.url,
            }
          }))
      },
      (error) => {
        console.warn('No se pudo cargar la galería desde Firestore:', error)
        setFotos(GALERIA_MOCK)
      }
    )
  }, [])

  const openLightbox = (idx) => setLightboxIdx(idx)
  const closeLightbox = () => setLightboxIdx(null)
  const prevPhoto = () => setLightboxIdx((i) => (i - 1 + fotos.length) % fotos.length)
  const nextPhoto = () => setLightboxIdx((i) => (i + 1) % fotos.length)

  return (
    <>
      {/* ── Grid Masonry-like usando CSS columns ─────────────────────────────── */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
        {fotos.map((foto, idx) => (
          <button
            key={foto.id}
            onClick={() => openLightbox(idx)}
            className="group relative block w-full overflow-hidden rounded-xl bg-gray-ultra break-inside-avoid focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Ver foto: ${foto.alt}`}
          >
            <img
              src={foto.thumbnail}
              alt={foto.alt}
              onError={handleImageFallback}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Overlay hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ZoomIn size={22} className="text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>
      {fotos.length === 0 && (
        <p className="py-16 text-center text-sm text-gray-mid">Todavía no hay imágenes en la galería.</p>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <Lightbox
          fotos={fotos}
          indice={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </>
  )
}
