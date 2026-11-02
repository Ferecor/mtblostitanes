/**
 * AdminCitasTable.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vista en tabla para administración densa y ágil de citas.
 * Permite cambiar el estado directamente desde la fila con selector desplegable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  Bike,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  ChevronDown,
} from 'lucide-react'
import { ESTADOS_CITA } from '@/data/mockData'
import { getServicioLabel, getEstadoConfig, formatearFecha } from '@/utils/citasUtils'

export default function AdminCitasTable({
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
    <div className="bg-white rounded-2xl border border-gray-soft shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-ultra/60 border-b border-gray-soft text-[11px] font-bold text-gray-mid uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Cliente</th>
              <th className="py-3.5 px-4">Bicicleta</th>
              <th className="py-3.5 px-4">Servicio</th>
              <th className="py-3.5 px-4">Fecha y Hora</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4">Notas</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-soft/60 text-sm">
            {citas.map((cita) => {
              const estadoCfg = getEstadoConfig(cita.estado)

              return (
                <tr
                  key={cita.id}
                  className="hover:bg-gray-ultra/40 transition-colors group"
                >
                  {/* ── Cliente ─────────────────────────────────────────────── */}
                  <td className="py-4 px-4 sm:px-6">
                    <div className="font-semibold text-dark text-sm">
                      {cita.nombre}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-mid">
                      {cita.userEmail && (
                        <a
                          href={`mailto:${cita.userEmail}`}
                          title={cita.userEmail}
                          className="flex items-center gap-1 hover:text-accent truncate max-w-[150px]"
                        >
                          <Mail size={12} className="shrink-0" />
                          <span className="truncate">{cita.userEmail}</span>
                        </a>
                      )}
                      {cita.telefono && (
                        <a
                          href={`tel:${cita.telefono}`}
                          title={cita.telefono}
                          className="flex items-center gap-1 hover:text-accent shrink-0"
                        >
                          <Phone size={12} className="shrink-0" />
                          <span>{cita.telefono}</span>
                        </a>
                      )}
                    </div>
                  </td>

                  {/* ── Bicicleta ───────────────────────────────────────────── */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-gray-dark font-medium text-xs sm:text-sm">
                      <Bike size={15} className="text-gray-mid shrink-0" />
                      <span className="truncate max-w-[180px]">{cita.modeloBici || '—'}</span>
                    </div>
                  </td>

                  {/* ── Servicio ────────────────────────────────────────────── */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-ultra text-gray-dark border border-gray-soft">
                      {getServicioLabel(cita.tipoServicio)}
                    </span>
                  </td>

                  {/* ── Fecha y Hora ────────────────────────────────────────── */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-semibold text-dark text-xs sm:text-sm flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-mid" />
                      {formatearFecha(cita.fecha)}
                    </div>
                    <div className="text-xs text-gray-mid flex items-center gap-1.5 mt-0.5 font-mono">
                      <Clock size={12} />
                      {cita.hora || '—'}
                    </div>
                  </td>

                  {/* ── Estado con selector rápido ──────────────────────────── */}
                  <td className="py-4 px-4">
                    <div className="relative inline-block">
                      <select
                        value={cita.estado}
                        onChange={(e) => onUpdateEstado(cita.id, e.target.value)}
                        className={`text-xs font-bold pl-2.5 pr-7 py-1 rounded-lg border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 ${estadoCfg.badgeClass}`}
                      >
                        {ESTADOS_CITA.map((est) => (
                          <option key={est.value} value={est.value}>
                            {est.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={12}
                        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60"
                      />
                    </div>
                    {cita.confirmacionEnviada && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Email enviado</span>
                      </div>
                    )}
                  </td>

                  {/* ── Observaciones y Notas ───────────────────────────────── */}
                  <td className="py-4 px-4 max-w-[180px]">
                    {cita.observaciones || cita.notasMecanico ? (
                      <div className="truncate text-xs text-gray-mid" title={cita.observaciones || cita.notasMecanico}>
                        {cita.observaciones && (
                          <span className="text-gray-dark">{cita.observaciones}</span>
                        )}
                        {cita.notasMecanico && (
                          <span className="block text-[11px] text-accent font-medium mt-0.5">
                            Taller: {cita.notasMecanico}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-mid/60">—</span>
                    )}
                  </td>

                  {/* ── Acciones ────────────────────────────────────────────── */}
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <div className="inline-flex items-center gap-1">
                      {/* Botón para enviar confirmación por email al usuario */}
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
                        title="Ver detalle de la cita"
                        className="p-1.5 text-gray-mid hover:text-dark hover:bg-gray-ultra rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditCita(cita)}
                        title="Editar cita"
                        className="p-1.5 text-gray-mid hover:text-accent hover:bg-accent/5 rounded-lg transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteCita(cita)}
                        title="Eliminar cita"
                        className="p-1.5 text-gray-mid hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
