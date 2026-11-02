/**
 * useCitasAdmin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Hook centralizado para la administración de citas del taller.
 *
 * Arquitectura:
 *   - Comunicación directa con el Servidor Backend (/api/admin/citas)
 *     que ejecuta Firebase Admin SDK con credenciales de cuenta de servicio.
 *   - Envío de correos de confirmación procesados por el backend (Nodemailer).
 *   - Fallback automático resiliente a Firestore cliente / LocalStorage / Mocks
 *     si el servidor backend está en mantenimiento o en modo offline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import {
  getCitasBackend,
  createCitaBackend,
  updateCitaBackend,
  updateEstadoBackend,
  deleteCitaBackend,
  enviarConfirmacionEmailBackendAPI,
} from '@/services/apiCitas'
import { CITAS_MOCK } from '@/data/mockData'
import { db } from '@/firebase/firebase'
import { useAuth } from '@/context/AuthContext'

const LOCAL_STORAGE_KEY = 'mtb_admin_citas_v1'

export function useCitasAdmin() {
  const { isAdmin } = useAuth()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isBackendConnected, setIsBackendConnected] = useState(false)
  const [isUsingMock, setIsUsingMock] = useState(false)
  const [errorNotice, setErrorNotice] = useState(null)
  const liveSnapshotReceived = useRef(false)

  // ── Inicializar datos locales desde localStorage o CITAS_MOCK ──────────────
  const getInitialMockData = () => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // Ignorar error de JSON parse
    }
    return CITAS_MOCK
  }

  const persistMockData = (data) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e)
    }
  }

  // ── Cargar citas desde el Backend ───────────────────────────────────────────
  const cargarCitas = useCallback(async () => {
    setLoading(true)
    try {
      const citasServidor = await getCitasBackend()
      if (Array.isArray(citasServidor)) {
        if (citasServidor.length === 0 && !liveSnapshotReceived.current) {
          // Si el backend no tiene documentos aún, mostramos los mocks iniciales
          const mock = getInitialMockData()
          setCitas(mock)
          setIsUsingMock(true)
        } else if (!liveSnapshotReceived.current) {
          setCitas(citasServidor)
          setIsUsingMock(false)
        }
        setIsBackendConnected(true)
        setErrorNotice(null)
      }
    } catch (err) {
      console.warn('Backend de citas no responde o no disponible. Usando fallback local:', err.message)
      if (!liveSnapshotReceived.current) {
        const mock = getInitialMockData()
        setCitas(mock)
        setIsUsingMock(true)
      }
      setIsBackendConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCitas()
  }, [cargarCitas])

  useEffect(() => {
    if (!isAdmin) return undefined

    return onSnapshot(
      collection(db, 'citas'),
      (snapshot) => {
        liveSnapshotReceived.current = true
        if (snapshot.empty) {
          setCitas(getInitialMockData())
          setIsUsingMock(true)
          return
        }

        const citasActualizadas = snapshot.docs
          .map((citaDoc) => {
            const data = citaDoc.data()
            return {
              id: citaDoc.id,
              ...data,
              creadoEn: data.creadoEn?.toDate ? data.creadoEn.toDate().toISOString() : data.creadoEn,
              actualizadoEn: data.actualizadoEn?.toDate ? data.actualizadoEn.toDate().toISOString() : data.actualizadoEn,
            }
          })
          .sort((a, b) => `${b.fecha ?? ''} ${b.hora ?? ''}`.localeCompare(`${a.fecha ?? ''} ${a.hora ?? ''}`))

        setCitas(citasActualizadas)
        setIsUsingMock(false)
        setErrorNotice(null)
      },
      (snapshotError) => {
        console.warn('No se pudieron sincronizar las citas en tiempo real:', snapshotError.message)
        setErrorNotice('No se pudieron sincronizar las citas en tiempo real.')
      }
    )
  }, [isAdmin])

  // ── Cambiar Estado de Cita ──────────────────────────────────────────────────
  const updateEstado = useCallback(
    async (id, nuevoEstado) => {
      // Intentar actualizar en backend
      if (isBackendConnected) {
        try {
          await updateEstadoBackend(id, nuevoEstado)
          setCitas((prev) =>
            prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
          )
          return { success: true }
        } catch (err) {
          console.warn('Error al actualizar estado en backend, actualizando local:', err)
        }
      }

      // Fallback local
      setCitas((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, estado: nuevoEstado } : c))
        persistMockData(next)
        return next
      })
      return { success: true }
    },
    [isBackendConnected]
  )

  // ── Actualización completa de campos de Cita ────────────────────────────────
  const updateCita = useCallback(
    async (id, camposActualizados) => {
      if (isBackendConnected) {
        try {
          await updateCitaBackend(id, camposActualizados)
          setCitas((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...camposActualizados } : c))
          )
          return { success: true }
        } catch (err) {
          console.warn('Error al actualizar cita en backend, guardando local:', err)
        }
      }

      setCitas((prev) => {
        const next = prev.map((c) =>
          c.id === id ? { ...c, ...camposActualizados } : c
        )
        persistMockData(next)
        return next
      })
      return { success: true }
    },
    [isBackendConnected]
  )

  // ── Eliminar Cita ───────────────────────────────────────────────────────────
  const deleteCita = useCallback(
    async (id) => {
      if (isBackendConnected) {
        try {
          await deleteCitaBackend(id)
          setCitas((prev) => prev.filter((c) => c.id !== id))
          return { success: true }
        } catch (err) {
          console.warn('Error al borrar en backend, borrando local:', err)
        }
      }

      setCitas((prev) => {
        const next = prev.filter((c) => c.id !== id)
        persistMockData(next)
        return next
      })
      return { success: true }
    },
    [isBackendConnected]
  )

  // ── Crear Nueva Cita Manual (Admin) ─────────────────────────────────────────
  const addCita = useCallback(
    async (nuevaCita) => {
      const citaConDatos = {
        ...nuevaCita,
        estado: nuevaCita.estado || 'confirmada',
        creadoPorAdmin: true,
      }

      if (isBackendConnected) {
        try {
          const res = await createCitaBackend(citaConDatos)
          const citaCreada = res.cita || { id: res.id, ...citaConDatos }
          setCitas((prev) => [citaCreada, ...prev])
          return { success: true, id: res.id }
        } catch (err) {
          console.warn('Error al crear en backend, creando local:', err)
        }
      }

      const idGenerado = `cita-manual-${Date.now()}`
      const citaLocal = {
        id: idGenerado,
        ...citaConDatos,
        creadoEn: new Date().toISOString(),
      }

      setCitas((prev) => {
        const next = [citaLocal, ...prev]
        persistMockData(next)
        return next
      })
      return { success: true, id: idGenerado }
    },
    [isBackendConnected]
  )

  // ── Enviar Confirmación por Email (a través del Backend) ────────────────────
  const enviarConfirmacionEmail = useCallback(
    async (id, emailDestino) => {
      const fechaEnvio = new Date().toISOString()

      if (isBackendConnected) {
        try {
          const res = await enviarConfirmacionEmailBackendAPI(id, emailDestino)
          setCitas((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    confirmacionEnviada: true,
                    fechaEnvioConfirmacion: fechaEnvio,
                    ultimoEmailEnviadoA: emailDestino,
                  }
                : c
            )
          )
          return { success: true, ...res }
        } catch (err) {
          console.warn('Error al enviar confirmación vía backend:', err)
        }
      }

      // Registro local en fallback
      const campos = {
        confirmacionEnviada: true,
        fechaEnvioConfirmacion: fechaEnvio,
        ultimoEmailEnviadoA: emailDestino,
      }
      await updateCita(id, campos)
      return { success: true, simulado: true }
    },
    [isBackendConnected, updateCita]
  )

  // ── Marcar confirmación como enviada manualmente ───────────────────────────
  const marcarConfirmacionEnviada = useCallback(
    async (id, emailDestino) => {
      const fechaEnvio = new Date().toISOString()
      const campos = {
        confirmacionEnviada: true,
        fechaEnvioConfirmacion: fechaEnvio,
        ultimoEmailEnviadoA: emailDestino,
      }
      return updateCita(id, campos)
    },
    [updateCita]
  )

  // ── Restaurar datos mock de ejemplo ─────────────────────────────────────────
  const resetToMock = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    setCitas(CITAS_MOCK)
    setIsUsingMock(true)
  }, [])

  return {
    citas,
    loading,
    isBackendConnected,
    isUsingMock,
    errorNotice,
    cargarCitas,
    updateEstado,
    updateCita,
    deleteCita,
    addCita,
    enviarConfirmacionEmail,
    marcarConfirmacionEnviada,
    resetToMock,
  }
}
