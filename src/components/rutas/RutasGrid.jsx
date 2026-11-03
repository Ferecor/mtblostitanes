/**
 * RutasGrid.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Grid de rutas del club. Carga rutas de Firestore y añade rutas de demo
 * para que el historial de rutas completadas también esté visible.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '@/firebase/firebase'
import { RUTAS_MOCK } from '@/data/mockData'
import { useAuth } from '@/context/AuthContext'
import RutaCard from './RutaCard'
import LoginModal from '@/components/auth/LoginModal'
import { Mountain, RefreshCcw } from 'lucide-react'
import { getRouteDate, hasExpired } from '@/utils/rutasUtils'

export default function RutasGrid() {
  const { currentUser } = useAuth()
  const [rutas,      setRutas]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [loginOpen,  setLoginOpen]  = useState(false)
  const rutasActivas = rutas.filter((ruta) => !hasExpired(ruta.fechaRaw, ruta.fecha))
  const rutasCompletadas = rutas.filter((ruta) => hasExpired(ruta.fechaRaw, ruta.fecha))

  // ── Suscripción a Firestore en tiempo real ──────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, 'rutas'))

    const unsub = onSnapshot(
      q,
      (snap) => {
        const firestoreRoutes = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        const existingIds = new Set(firestoreRoutes.map((ruta) => ruta.id))
        const routesWithDemo = [
          ...firestoreRoutes,
          ...RUTAS_MOCK.filter((ruta) => !existingIds.has(ruta.id)),
        ]

        setRutas(routesWithDemo.sort((a, b) => {
          const dateA = getRouteDate(a.fechaRaw, a.fecha)?.getTime() ?? Number.MAX_SAFE_INTEGER
          const dateB = getRouteDate(b.fechaRaw, b.fecha)?.getTime() ?? Number.MAX_SAFE_INTEGER
          return dateA - dateB
        }))
        setLoading(false)
      },
      (err) => {
        console.warn('Firestore no disponible, usando datos mock:', err.message)
        setRutas(RUTAS_MOCK)
        setLoading(false)
        setError(null) // silencioso — usamos mock
      }
    )

    return unsub
  }, [])

  // ── Estados de carga ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-gray-ultra rounded-2xl h-80 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="mb-4 text-sm text-gray-mid flex items-center gap-1.5">
          <RefreshCcw size={13} />
          {error}
        </div>
      )}

      <section aria-labelledby="rutas-completadas-heading">
        <h2 id="rutas-completadas-heading" className="mb-5 text-xl font-bold text-dark">
          Rutas completadas
        </h2>
        {rutasCompletadas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rutasCompletadas.map((ruta) => (
              <RutaCard
                key={ruta.id}
                ruta={ruta}
                onLoginRequired={() => setLoginOpen(true)}
              />
            ))}
          </div>
        ) : (
          <p className="mb-10 text-sm text-gray-mid">Todavía no hay rutas completadas.</p>
        )}
      </section>

      <section aria-labelledby="rutas-activas-heading" className="mt-12">
        <h2 id="rutas-activas-heading" className="mb-5 text-xl font-bold text-dark">
          Próximas salidas
        </h2>
        {rutasActivas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {rutasActivas.map((ruta) => (
              <RutaCard
                key={ruta.id}
                ruta={ruta}
                onLoginRequired={() => setLoginOpen(true)}
              />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Mountain size={32} className="mx-auto mb-3 text-gray-soft" />
            {currentUser ? (
              <>
                <p className="text-sm text-gray-mid">No hay próximas salidas programadas.</p>
                <p className="mt-1 text-xs text-gray-mid">¡Vuelve pronto para ver las novedades!</p>
              </>
            ) : (
              <p className="text-sm text-gray-mid">
                Regístrate como usuario del club para ver las próximas salidas
              </p>
            )}
          </div>
        )}
      </section>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
