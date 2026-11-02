/**
 * server/emailSender.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servicio de envío de correos electrónicos desde el backend con Nodemailer.
 * Envía la confirmación de cita al correo del usuario registrado.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import nodemailer from 'nodemailer'

// Configuración del transporte Nodemailer
let transporter = null

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}

function getTransporter() {
  if (transporter) return transporter

  if (isEmailConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    console.log('📧 Transporte SMTP configurado con:', process.env.SMTP_HOST)
  } else {
    if (process.env.NODE_ENV === 'production') {
      const error = new Error('El envío de correo no está configurado en el servidor')
      error.code = 'EMAIL_NOT_CONFIGURED'
      throw error
    }

    // Modo simulación / Ethereal para desarrollo local
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal_pass',
      },
      // Si falla ethereal, simula el envío localmente
      tls: {
        rejectUnauthorized: false,
      },
    })
    console.log('📧 Transporte de email en modo Desarrollo / Simulación (sin SMTP externo configurado)')
  }

  return transporter
}

async function enviarCorreoBackend({ destinatario, subject, text, html }) {
  return getTransporter().sendMail({
    from: process.env.SMTP_FROM || '"Taller MTB Los Titanes" <taller@mtbtinanes.com>',
    to: destinatario,
    subject,
    text,
    html,
  })
}

/**
 * Envía el correo de confirmación de cita al cliente
 */
export async function enviarEmailConfirmacionBackend({
  destinatario,
  nombreCliente,
  fecha,
  hora,
  modeloBici,
  servicio,
  costeEstimado,
  notasMecanico,
}) {
  const subject = `Confirmación de Cita en Taller MTB Los Titanes — ${fecha} a las ${hora}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 20px; color: #222; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; }
          .header { background: #000000; padding: 28px 32px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0 0 6px 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .header span { color: #FF5722; }
          .header p { margin: 0; font-size: 13px; color: #aaaaaa; }
          .content { padding: 32px; }
          .greeting { font-size: 17px; font-weight: bold; margin-bottom: 12px; }
          .intro { font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 24px; }
          .details-card { background: #fafafa; border: 1px solid #eeeeee; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .details-row:last-child { border-bottom: none; }
          .details-label { color: #888888; font-weight: 600; }
          .details-value { color: #111111; font-weight: bold; text-align: right; }
          .badge-service { color: #FF5722; font-weight: 700; }
          .notes-box { background: #fff8f5; border-left: 4px solid #FF5722; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; margin-bottom: 20px; }
          .info-box { background: #f0f7ff; border-radius: 10px; padding: 14px 18px; font-size: 12px; color: #1e3a8a; line-height: 1.5; margin-bottom: 24px; }
          .footer { background: #111111; color: #777777; padding: 24px 32px; text-align: center; font-size: 11px; }
          .footer p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>MTB <span>Los Titanes</span></h1>
            <p>Servicio Técnico Oficial de Bicicletas de Montaña</p>
          </div>
          <div class="content">
            <div class="greeting">¡Hola, ${nombreCliente || 'Ciclista'}! 👋</div>
            <p class="intro">
              Te confirmamos que tu cita en el taller de <strong>MTB Los Titanes</strong> ha sido programada con éxito. Tu bicicleta estará en las mejores manos.
            </p>

            <div class="details-card">
              <div class="details-row">
                <span class="details-label">📅 Fecha de la cita:</span>
                <span class="details-value">${fecha}</span>
              </div>
              <div class="details-row">
                <span class="details-label">⏰ Hora programada:</span>
                <span class="details-value">${hora}</span>
              </div>
              <div class="details-row">
                <span class="details-label">🚵 Bicicleta:</span>
                <span class="details-value">${modeloBici || 'Bicicleta de montaña'}</span>
              </div>
              <div class="details-row">
                <span class="details-label">🔧 Servicio técnico:</span>
                <span class="details-value badge-service">${servicio || 'Mantenimiento General'}</span>
              </div>
              ${costeEstimado ? `
              <div class="details-row">
                <span class="details-label">💶 Presupuesto est.:</span>
                <span class="details-value">${costeEstimado} €</span>
              </div>` : ''}
            </div>

            ${notasMecanico ? `
            <div class="notes-box">
              <strong>Indicaciones del mecánico:</strong><br>
              ${notasMecanico}
            </div>` : ''}

            <div class="info-box">
              <strong>📍 Recomendaciones para el día de la cita:</strong><br>
              • Por favor, acude 5 minutos antes de la hora indicada con la bicicleta limpia de barro para agilizar la inspección.<br>
              • Ubicación: Taller Central MTB Los Titanes, Polígono Industrial de Tinanes, Nave 4.<br>
              • Si necesitas reprogramar o cancelar, contáctanos respondiendo a este correo o vía WhatsApp al +34 612 345 678.
            </div>

            <p style="font-size: 13px; color: #666; margin: 0;">
              ¡Nos vemos en el taller y buenas rutas por la montaña! 🚵‍♂️
            </p>
          </div>
          <div class="footer">
            <p><strong>Club MTB Los Titanes</strong> • Polígono Industrial de Tinanes, Nave 4</p>
            <p>Tel: +34 985 00 00 00 • taller@mtbtinanes.com • www.mtbtinanes.com</p>
          </div>
        </div>
      </body>
    </html>
  `

  const textContent = `
Hola ${nombreCliente || 'Ciclista'},

Confirmamos tu cita en el taller de MTB Los Titanes:
• Fecha: ${fecha}
• Hora: ${hora}
• Bicicleta: ${modeloBici || 'Bicicleta de montaña'}
• Servicio: ${servicio || 'Mantenimiento General'}
${costeEstimado ? `• Coste estimado: ${costeEstimado} €\n` : ''}${notasMecanico ? `• Notas del mecánico: ${notasMecanico}\n` : ''}
Ubicación: Taller Central MTB Los Titanes, Polígono Industrial de Tinanes, Nave 4.
Tel: +34 985 00 00 00 / WhatsApp: +34 612 345 678

¡Te esperamos en el taller!
Equipo Técnico MTB Los Titanes
  `

  try {
    const info = await enviarCorreoBackend({
      destinatario,
      subject,
      text: textContent,
      html: htmlContent,
    })

    console.log(`✉️ Correo de confirmación enviado exitosamente a: ${destinatario} (MessageID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    if (err.code === 'EMAIL_NOT_CONFIGURED') throw err
    console.warn(`⚠️ No se pudo enviar el correo vía SMTP (${err.message}). Simulación de envío completada.`);
    // Devolvemos éxito simulado para entornos locales sin servidor SMTP configurado
    return {
      success: true,
      simulado: true,
      destinatario,
      asunto: subject,
      aviso: 'Envío procesado por el backend en modo simulación local.',
    }
  }
}

export async function enviarEmailConfirmacionRuta({ destinatario, nombreUsuario, ruta }) {
  const subject = `Confirmación de inscripción — ${ruta.nombre || 'Ruta MTB Los Titanes'}`
  const nombre = nombreUsuario || 'Ciclista'
  const fecha = ruta.fecha || 'Fecha por confirmar'
  const text = [
    `Hola ${nombre},`,
    '',
    `¡Te has unido correctamente a la ruta ${ruta.nombre || 'de MTB Los Titanes'}!`,
    '',
    `Fecha: ${fecha}`,
    `Distancia: ${ruta.distanciaKm ?? 0} km`,
    `Desnivel: +${ruta.desnivel ?? 0} m`,
    `Dificultad: ${ruta.dificultad || 'Sin especificar'}`,
    '',
    ruta.descripcion || '',
    '',
    '¡Nos vemos en la montaña!',
    'El equipo de MTB Los Titanes',
  ].filter(Boolean).join('\n')
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
  try {
    const info = await enviarCorreoBackend({
      destinatario,
      subject,
      text,
      html: `<p>Hola ${escapeHtml(nombre)},</p>
          <p>¡Te has unido correctamente a la ruta <strong>${escapeHtml(ruta.nombre || 'de MTB Los Titanes')}</strong>!</p>
          <ul>
            <li>Fecha: ${escapeHtml(fecha)}</li>
            <li>Distancia: ${escapeHtml(ruta.distanciaKm ?? 0)} km</li>
            <li>Desnivel: +${escapeHtml(ruta.desnivel ?? 0)} m</li>
            <li>Dificultad: ${escapeHtml(ruta.dificultad || 'Sin especificar')}</li>
          </ul>
          ${ruta.descripcion ? `<p>${escapeHtml(ruta.descripcion)}</p>` : ''}
          <p>¡Nos vemos en la montaña!<br>El equipo de MTB Los Titanes</p>`,
    })

    console.log(`Correo de confirmación de ruta enviado a ${destinatario} (MessageID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') throw error
    console.warn(`No se pudo enviar el correo de confirmación de ruta (${error.message}). Envío simulado.`)
    return {
      success: true,
      simulado: true,
      destinatario,
      asunto: subject,
      aviso: 'Envío procesado en modo simulación, como en la confirmación de citas.',
    }
  }
}

export async function enviarEmailRutaConfirmada({ destinatario, nombreUsuario, ruta }) {
  const nombre = nombreUsuario || 'Ciclista'
  const subject = `Ruta confirmada — ${ruta.nombre || 'MTB Los Titanes'}`
  const fecha = ruta.fecha || 'Fecha por confirmar'
  const distancia = `${ruta.distanciaKm ?? 0} km`
  const desnivel = `+${ruta.desnivel ?? 0} m`
  const dificultad = ruta.dificultad || 'Sin especificar'
  const text = [
    `Hola ${nombre},`,
    '',
    `Te confirmamos que la ruta "${ruta.nombre || 'MTB Los Titanes'}" está confirmada.`,
    '',
    `Fecha: ${fecha}`,
    `Distancia: ${distancia}`,
    `Desnivel: ${desnivel}`,
    `Dificultad: ${dificultad}`,
    ruta.descripcion ? `Descripción: ${ruta.descripcion}` : '',
    '',
    '¡Nos vemos en la montaña!',
    'El equipo de MTB Los Titanes',
  ].filter(Boolean).join('\n')
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
  try {
    const info = await enviarCorreoBackend({
      destinatario,
      subject,
      text,
      html: `<p>Hola ${escapeHtml(nombre)},</p>
        <p>Te confirmamos que la ruta <strong>${escapeHtml(ruta.nombre || 'MTB Los Titanes')}</strong> está confirmada.</p>
        <ul>
          <li>Fecha: ${escapeHtml(fecha)}</li>
          <li>Distancia: ${escapeHtml(distancia)}</li>
          <li>Desnivel: ${escapeHtml(desnivel)}</li>
          <li>Dificultad: ${escapeHtml(dificultad)}</li>
        </ul>
        ${ruta.descripcion ? `<p>${escapeHtml(ruta.descripcion)}</p>` : ''}
        <p>¡Nos vemos en la montaña!<br>El equipo de MTB Los Titanes</p>`,
    })

    console.log(`Correo de ruta confirmada enviado a ${destinatario} (MessageID: ${info.messageId})`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') throw error
    console.warn(`No se pudo enviar el correo de ruta confirmada (${error.message}). Envío simulado.`)
    return {
      success: true,
      simulado: true,
      destinatario,
      asunto: subject,
      aviso: 'Envío procesado en modo simulación, como en la confirmación de citas.',
    }
  }
}
