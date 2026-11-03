/**
 * AdminCitasPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Apartado de Administrador para Gestionar las Citas del Taller MTB Los Titanes.
 *
 * Características:
 *   - Control centralizado de citas en tiempo real (Firestore / Local Mock)
 *   - Estadísticas e indicadores clave (KPIs)
 *   - Filtros avanzados por texto, estado y fechas
 *   - Cambio de vista instantáneo: Tabla de alta densidad / Tarjetas visuales
 *   - Operaciones CRUD completas (crear, editar, cambiar estado, eliminar)
 *   - Exportación de listado a CSV y botón para imprimir orden del día
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Download,
  Printer,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { useCitasAdmin } from '@/hooks/useCitasAdmin'
import AdminCitasStats from '@/components/admin/AdminCitasStats'
import AdminCitasFilters from '@/components/admin/AdminCitasFilters'
import AdminCitasTable from '@/components/admin/AdminCitasTable'
import AdminCitasCards from '@/components/admin/AdminCitasCards'
import AdminCitaModal from '@/components/admin/AdminCitaModal'
import AdminCitaDetalleModal from '@/components/admin/AdminCitaDetalleModal'
import AdminDeleteConfirmModal from '@/components/admin/AdminDeleteConfirmModal'
import AdminEmailModal from '@/components/admin/AdminEmailModal'
import AdminSectionNav from '@/components/admin/AdminSectionNav'

export default function AdminCitasPage() {
  const {
    citas,
    loading,
    isBackendConnected,
    isUsingMock,
    errorNotice,
    updateEstado,
    updateCita,
    deleteCita,
    addCita,
    marcarConfirmacionEnviada,
    resetToMock,
  } = useCitasAdmin()

  // Estados de interfaz y filtrado
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('todas')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'table'

  // Modales
  const [modalCitaOpen, setModalCitaOpen] = useState(false)
  const [editingCita, setEditingCita] = useState(null)

  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)

  const [modalDeleteOpen, setModalDeleteOpen] = useState(false)
  const [citaToDelete, setCitaToDelete] = useState(null)

  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [citaForEmail, setCitaForEmail] = useState(null)

  // Mensaje flotante de feedback (toast)
  const [toast, setToast] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Lógica de filtrado ──────────────────────────────────────────────────────
  const filteredCitas = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    const now = new Date()

    return citas.filter((cita) => {
      // 1. Filtro por estado
      if (statusFilter && cita.estado !== statusFilter) {
        return false
      }

      // 2. Filtro por fecha
      if (dateFilter !== 'todas') {
        const citaFecha = cita.fecha || ''
        if (dateFilter === 'hoy' && citaFecha !== todayStr) {
          return false
        }
        if (dateFilter === 'proximos7') {
          const next7 = new Date()
          next7.setDate(next7.getDate() + 7)
          const next7Str = next7.toISOString().split('T')[0]
          if (citaFecha < todayStr || citaFecha > next7Str) return false
        }
        if (dateFilter === 'mes') {
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          if (!citaFecha.startsWith(currentMonth)) return false
        }
        if (dateFilter === 'pasadas') {
          if (citaFecha >= todayStr) return false
        }
      }

      // 3. Filtro por búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchNombre = cita.nombre?.toLowerCase().includes(q)
        const matchEmail = cita.userEmail?.toLowerCase().includes(q)
        const matchTel = cita.telefono?.toLowerCase().includes(q)
        const matchBici = cita.modeloBici?.toLowerCase().includes(q)
        const matchServicio = cita.tipoServicio?.toLowerCase().includes(q)
        const matchObs = cita.observaciones?.toLowerCase().includes(q)
        const matchNotas = cita.notasMecanico?.toLowerCase().includes(q)

        return (
          matchNombre ||
          matchEmail ||
          matchTel ||
          matchBici ||
          matchServicio ||
          matchObs ||
          matchNotas
        )
      }

      return true
    })
  }, [citas, statusFilter, dateFilter, searchQuery])

  // ── Handlers de acciones ────────────────────────────────────────────────────
  const handleUpdateEstado = async (id, nuevoEstado) => {
    await updateEstado(id, nuevoEstado)
    showToast(`Estado de la cita actualizado a "${nuevoEstado}"`)
    if (selectedCita && selectedCita.id === id) {
      setSelectedCita((prev) => ({ ...prev, estado: nuevoEstado }))
    }

    // Si se pasa la cita a "confirmada", sugerir enviar el correo de confirmación al usuario registrado
    if (nuevoEstado === 'confirmada') {
      const citaActual = citas.find((c) => c.id === id)
      if (citaActual && citaActual.userEmail && !citaActual.confirmacionEnviada) {
        setCitaForEmail({ ...citaActual, estado: 'confirmada' })
        setEmailModalOpen(true)
      }
    }
  }

  const handleOpenEmail = (cita) => {
    setCitaForEmail(cita)
    setEmailModalOpen(true)
  }

  const handleMarcarEmailEnviado = async (citaId, emailDestino) => {
    await marcarConfirmacionEnviada(citaId, emailDestino)
    showToast(`Confirmación registrada como enviada a ${emailDestino}`)
  }

  const handleOpenCreate = () => {
    setEditingCita(null)
    setModalCitaOpen(true)
  }

  const handleOpenEdit = (cita) => {
    setEditingCita(cita)
    setModalCitaOpen(true)
  }

  const handleSaveCita = async (formData) => {
    if (editingCita?.id) {
      await updateCita(editingCita.id, formData)
      showToast('Cita modificada con éxito')
    } else {
      await addCita(formData)
      showToast('Nueva cita registrada en el taller')
    }
  }

  const handleOpenDetalle = (cita) => {
    setSelectedCita(cita)
    setModalDetalleOpen(true)
  }

  const handleOpenDelete = (cita) => {
    setCitaToDelete(cita)
    setModalDeleteOpen(true)
  }

  const handleConfirmDelete = async (id) => {
    await deleteCita(id)
    showToast('Cita eliminada de los registros')
  }

  // ── Exportar a CSV ──────────────────────────────────────────────────────────
  const exportToCSV = () => {
    if (!filteredCitas.length) return

    const headers = [
      'ID',
      'Cliente',
      'Email',
      'Telefono',
      'Bicicleta',
      'Servicio',
      'Fecha',
      'Hora',
      'Estado',
      'Coste_Estimado',
      'Observaciones',
      'Notas_Taller',
    ]

    const rows = filteredCitas.map((c) => [
      c.id || '',
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${(c.userEmail || '').replace(/"/g, '""')}"`,
      `"${(c.telefono || '').replace(/"/g, '""')}"`,
      `"${(c.modeloBici || '').replace(/"/g, '""')}"`,
      `"${(c.tipoServicio || '').replace(/"/g, '""')}"`,
      c.fecha || '',
      c.hora || '',
      c.estado || '',
      c.costeEstimado || '',
      `"${(c.observaciones || '').replace(/"/g, '""')}"`,
      `"${(c.notasMecanico || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `citas_taller_mtb_tinanes_${new Date().toISOString().split('T')[0]}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ── Imprimir ────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print()
  }

  return (
    <main className="min-h-screen bg-gray-ultra pt-24 pb-20 print:pt-4 print:pb-4 print:bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 md:px-8">
        <AdminSectionNav />

        {/* ── Toast de confirmación flotante ─────────────────────────────────── */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-dark text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-up">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{toast.message}</span>
          </div>
        )}

        {/* ── Cabecera de Página ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent/10 text-accent uppercase tracking-wider">
                <Wrench size={13} />
                Área de Administración
              </span>

              {/* Indicador de conexión / fuente de datos */}
              {isBackendConnected ? (
                <span
                  title="Conectado al Servidor Backend con Firebase Admin SDK"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Servidor Backend Activo (Admin SDK)
                </span>
              ) : isUsingMock ? (
                <span
                  title="Funcionando con datos locales y almacenamiento en navegador"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Modo Taller Local / Fallback
                </span>
              ) : (
                <span
                  title="Conectado a Firestore en vivo"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Firestore Sincronizado
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-dark tracking-tight">
              Gestión de Citas de Taller
            </h1>
            <p className="text-sm text-gray-mid mt-1">
              Supervisa las reservas, programa reparaciones y actualiza el estado de las bicicletas en el taller.
            </p>
          </div>

          {/* Botones de acción superior */}
          <div className="flex items-center flex-wrap gap-2.5 print:hidden">
            <button
              onClick={exportToCSV}
              title="Descargar listado en formato Excel / CSV"
              className="px-3.5 py-2.5 bg-white hover:bg-gray-soft text-gray-dark border border-gray-soft rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download size={14} />
              Exportar CSV
            </button>

            <button
              onClick={handlePrint}
              title="Imprimir hoja de trabajo del día"
              className="px-3.5 py-2.5 bg-white hover:bg-gray-soft text-gray-dark border border-gray-soft rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer size={14} />
              Imprimir
            </button>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
            >
              <Plus size={16} />
              Nueva Cita
            </button>
          </div>
        </div>

        {/* ── Banner informativo si hay aviso de permisos ───────────────────── */}
        {errorNotice && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 animate-fade-in">
            <AlertCircle size={20} className="text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800 leading-relaxed flex-1">
              <p className="font-bold mb-0.5">Modo Local Activo</p>
              <p>{errorNotice}</p>
            </div>
            {isUsingMock && (
              <button
                onClick={resetToMock}
                title="Recargar datos de prueba iniciales"
                className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 transition-colors shrink-0 flex items-center gap-1"
              >
                <RotateCcw size={12} />
                Reiniciar Mocks
              </button>
            )}
          </div>
        )}

        {/* ── Estadísticas KPIs ──────────────────────────────────────────────── */}
        <AdminCitasStats
          citas={citas}
          activeStatus={statusFilter}
          onSelectStatus={(st) => setStatusFilter(st)}
        />

        {/* ── Filtros y Búsqueda ─────────────────────────────────────────────── */}
        <AdminCitasFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalResultados={filteredCitas.length}
        />

        {/* ── Listado de Citas (Tabla o Tarjetas) ────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-soft p-6 h-56 animate-pulse"
              />
            ))}
          </div>
        ) : viewMode === 'table' ? (
          <AdminCitasTable
            citas={filteredCitas}
            onUpdateEstado={handleUpdateEstado}
            onViewDetalle={handleOpenDetalle}
            onEditCita={handleOpenEdit}
            onDeleteCita={handleOpenDelete}
            onOpenEmail={handleOpenEmail}
          />
        ) : (
          <AdminCitasCards
            citas={filteredCitas}
            onUpdateEstado={handleUpdateEstado}
            onViewDetalle={handleOpenDetalle}
            onEditCita={handleOpenEdit}
            onDeleteCita={handleOpenDelete}
            onOpenEmail={handleOpenEmail}
          />
        )}
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}
      <AdminCitaModal
        isOpen={modalCitaOpen}
        onClose={() => setModalCitaOpen(false)}
        cita={editingCita}
        onSave={handleSaveCita}
      />

      <AdminCitaDetalleModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        cita={selectedCita}
        onEdit={handleOpenEdit}
        onUpdateEstado={handleUpdateEstado}
        onOpenEmail={handleOpenEmail}
      />

      <AdminDeleteConfirmModal
        isOpen={modalDeleteOpen}
        onClose={() => setModalDeleteOpen(false)}
        cita={citaToDelete}
        onConfirm={handleConfirmDelete}
      />

      <AdminEmailModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        cita={citaForEmail}
        onMarcarEnviado={handleMarcarEmailEnviado}
      />
    </main>
  )
}
