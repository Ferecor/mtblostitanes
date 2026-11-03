/**
 * emailService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio para generación y envío de correos electrónicos de confirmación
 * de citas a los usuarios registrados en MTB Los Titanes.
 *
 * Soporta:
 *   - Enlace directo a Gmail Web (abre borrador redactado listo para enviar)
 *   - Enlace directo a Outlook / Hotmail Web
 *   - Protocolo universal mailto: (abre Apple Mail, Thunderbird, etc.)
 *   - Copia de contenido al portapapeles
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getServicioLabel, formatearFecha } from '@/utils/citasUtils'

/**
 * Genera el asunto estándar para el correo de confirmación
 */
export function generarAsuntoConfirmacion(cita) {
  const fecha = formatearFecha(cita?.fecha)
  const hora = cita?.hora ? ` a las ${cita.hora}` : ''
  return `Confirmación de Cita en Taller MTB Los Titanes — ${fecha}${hora}`
}

/**
 * Genera el cuerpo formal y detallado del correo de confirmación
 */
export function generarCuerpoConfirmacion(cita) {
  if (!cita) return ''

  const nombreCliente = cita.nombre || 'Ciclista'
  const fecha = formatearFecha(cita.fecha)
  const hora = cita.hora || 'Hora a convenir'
  const modeloBici = cita.modeloBici || 'Bicicleta de montaña'
  const servicio = getServicioLabel(cita.tipoServicio)

  let lineasCuerpo = [
    `Hola ${nombreCliente},`,
    '',
    '¡Buenas noticias! Te confirmamos que tu cita en el taller oficial de MTB Los Titanes ha sido programada con éxito.',
    '',
    '────────────────────────────────────────',
    '🚲 DETALLES DE TU CITA EN EL TALLER',
    '────────────────────────────────────────',
    `• Fecha: ${fecha}`,
    `• Hora: ${hora}`,
    `• Bicicleta: ${modeloBici}`,
    `• Servicio solicitado: ${servicio}`,
  ]

  if (cita.costeEstimado) {
    lineasCuerpo.push(`• Presupuesto estimado inicial: ${cita.costeEstimado} €`)
  }

  if (cita.observaciones) {
    lineasCuerpo.push(`• Observaciones del cliente: ${cita.observaciones}`)
  }

  if (cita.notasMecanico) {
    lineasCuerpo.push(`• Indicaciones del mecánico: ${cita.notasMecanico}`)
  }

  lineasCuerpo = lineasCuerpo.concat([
    '',
    '────────────────────────────────────────',
    '📍 INFORMACIÓN Y RECOMENDACIONES',
    '────────────────────────────────────────',
    '',
    'Por favor, te recomendamos traer la bicicleta unos minutos antes de la hora acordada y libre de exceso de barro para agilizar la revisión en el banco de trabajo.',
    '',
    'Si necesitas reprogramar o cancelar la cita, por favor avísanos respondiendo directamente a este correo con al menos 24 horas de antelación.',
    '',
    '¡Muchas gracias por confiar en nosotros y a seguir disfrutando de las sendas!',
    '',
    'Atentamente,',
    'El Equipo Técnico de MTB Los Titanes 🚵',
    
  ])

  return lineasCuerpo.join('\n')
}

/**
 * Abre el cliente nativo del sistema (Apple Mail, Thunderbird, etc.)
 */
export function abrirMailto(destinatario, asunto, cuerpo) {
  const mailtoUrl = `mailto:${encodeURIComponent(destinatario)}?subject=${encodeURIComponent(
    asunto
  )}&body=${encodeURIComponent(cuerpo)}`
  window.location.href = mailtoUrl
}

/**
 * Genera la URL para redactar directamente en Gmail Web
 */
export function getGmailWebUrl(destinatario, asunto, cuerpo) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    destinatario
  )}&su=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}

/**
 * Genera la URL para redactar directamente en Outlook Web
 */
export function getOutlookWebUrl(destinatario, asunto, cuerpo) {
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(
    destinatario
  )}&subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`
}
