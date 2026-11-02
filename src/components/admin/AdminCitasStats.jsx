/**
 * AdminCitasStats.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tarjetas de métricas y resumen rápido para el taller.
 * Permite filtrar por estado al hacer clic en cualquiera de las tarjetas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { CheckCircle2, Wrench, AlertTriangle, Calendar, Layers } from 'lucide-react'

export default function AdminCitasStats({ citas, activeStatus, onSelectStatus }) {
  const total = citas.length
  const pendientes = citas.filter((c) => c.estado === 'pendiente').length
  const confirmadas = citas.filter((c) => c.estado === 'confirmada').length
  const enTaller = citas.filter((c) => c.estado === 'en_proceso').length
  const completadas = citas.filter((c) => c.estado === 'completada').length

  const todayStr = new Date().toISOString().split('T')[0]
  const citasHoy = citas.filter((c) => c.fecha === todayStr).length

  const stats = [
    {
      id: 'todos',
      label: 'Total Citas',
      count: total,
      icon: Layers,
      color: 'bg-dark text-white',
      border: 'border-dark',
      activeRing: 'ring-dark',
    },
    {
      id: 'pendiente',
      label: 'Por Confirmar',
      count: pendientes,
      icon: AlertTriangle,
      color: 'bg-amber-500 text-white',
      border: 'border-amber-400',
      activeRing: 'ring-amber-500',
      badge: pendientes > 0 ? `${pendientes} urgentes` : null,
    },
    {
      id: 'confirmada',
      label: 'Confirmadas',
      count: confirmadas,
      icon: Calendar,
      color: 'bg-blue-600 text-white',
      border: 'border-blue-500',
      activeRing: 'ring-blue-600',
    },
    {
      id: 'en_proceso',
      label: 'En Taller',
      count: enTaller,
      icon: Wrench,
      color: 'bg-purple-600 text-white',
      border: 'border-purple-500',
      activeRing: 'ring-purple-600',
    },
    {
      id: 'completada',
      label: 'Completadas',
      count: completadas,
      icon: CheckCircle2,
      color: 'bg-emerald-600 text-white',
      border: 'border-emerald-500',
      activeRing: 'ring-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
      {stats.map(({ id, label, count, icon: Icon, color, activeRing, badge }) => {
        const isSelected = (activeStatus === id) || (id === 'todos' && !activeStatus)

        return (
          <button
            key={id}
            onClick={() => onSelectStatus(id === 'todos' ? '' : id)}
            className={`relative p-4 rounded-2xl bg-white border text-left transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md ${
              isSelected
                ? `ring-2 ${activeRing} shadow-md border-transparent bg-white`
                : 'border-gray-soft hover:border-gray-mid/40'
            }`}
          >
            {badge && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 animate-pulse">
                {badge}
              </span>
            )}

            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-mid uppercase tracking-wide">
                {label}
              </span>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${color}`}
              >
                <Icon size={16} />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-dark tracking-tight">
                {count}
              </span>
              {id === 'confirmada' && citasHoy > 0 && (
                <span className="text-xs font-medium text-blue-600">
                  ({citasHoy} hoy)
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
