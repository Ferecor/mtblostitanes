import express from 'express'
import { adminAuth, adminDb } from '../firebaseAdmin.js'
import { enviarEmailConfirmacionRuta, isEmailConfigured } from '../emailSender.js'

const router = express.Router()
const ADMIN_EMAILS = new Set([
  'admin@mtbtinanes.com',
  'taller@mtbtinanes.com',
  'ferecorweb@gmail.com',
  'mtblostitanes@gmail.com',
])

router.use(async (req, res, next) => {
  const token = req.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión' })
  }
  if (!adminAuth) {
    return res.status(503).json({ error: 'Autenticación no disponible en el servidor' })
  }

  try {
    const user = await adminAuth.verifyIdToken(token, true)
    const email = user.email?.toLowerCase()
    if (user.email_verified !== true || !email || !ADMIN_EMAILS.has(email)) {
      return res.status(403).json({ error: 'No tienes permisos de administración' })
    }
    return next()
  } catch (error) {
    console.warn(
      'No se pudo verificar el acceso a la gestión de rutas:',
      error.code || 'auth/unknown',
      error.message
    )
    const reauthenticationRequired = [
      'auth/id-token-expired',
      'auth/id-token-revoked',
      'auth/user-disabled',
      'auth/user-not-found',
    ].includes(error.code)

    return res.status(401).json({
      error: reauthenticationRequired
        ? 'La sesión de administrador expiró o fue revocada. Cierra sesión e inicia sesión de nuevo.'
        : 'No se pudo validar la sesión de administrador. Cierra sesión e inicia sesión de nuevo.',
    })
  }
})

router.get('/:id/inscritos', async (req, res) => {
  if (!adminDb) {
    return res.status(503).json({ error: 'Base de datos no disponible en el servidor' })
  }

  try {
    const rutaSnapshot = await adminDb.collection('rutas').doc(req.params.id).get()
    if (!rutaSnapshot.exists) {
      return res.status(404).json({ error: 'No se encontró la ruta' })
    }

    const asistentes = rutaSnapshot.data().asistentes
    if (!Array.isArray(asistentes)) {
      return res.json({ inscritos: [] })
    }

    const inscritos = await Promise.all(asistentes.map(async (uid) => {
      try {
        const usuario = await adminAuth.getUser(uid)
        return {
          uid: usuario.uid,
          nombre: usuario.displayName || 'Usuario',
          email: usuario.email || '',
        }
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          return { uid, nombre: 'Cuenta no disponible', email: '' }
        }
        throw error
      }
    }))

    return res.json({ inscritos })
  } catch (error) {
    console.error('No se pudieron cargar los inscritos de la ruta:', error)
    return res.status(500).json({ error: 'No se pudieron cargar los usuarios inscritos' })
  }
})

router.post('/:id/inscritos/:uid/confirmacion', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && !isEmailConfigured()) {
    return res.status(503).json({ error: 'El envío de correo no está configurado en el servidor' })
  }

  if (!adminAuth || !adminDb) {
    return res.status(503).json({ error: 'El servicio no está disponible en el servidor' })
  }
  try {
    const rutaSnapshot = await adminDb.collection('rutas').doc(req.params.id).get()
    if (!rutaSnapshot.exists) {
      return res.status(404).json({ error: 'No se encontró la ruta' })
    }

    const ruta = rutaSnapshot.data()
    if (!Array.isArray(ruta.asistentes) || !ruta.asistentes.includes(req.params.uid)) {
      return res.status(404).json({ error: 'El usuario no está inscrito en esta ruta' })
    }

    const usuario = await adminAuth.getUser(req.params.uid)
    if (!usuario.email) {
      return res.status(400).json({ error: 'El usuario no tiene un correo electrónico asociado' })
    }
    const destinatario = typeof req.body.destinatario === 'string'
      ? req.body.destinatario.trim()
      : usuario.email
    if (!destinatario) {
      return res.status(400).json({ error: 'Indica un correo electrónico de destino' })
    }

    const resultado = await enviarEmailConfirmacionRuta({
      destinatario,
      nombreUsuario: usuario.displayName,
      ruta,
    })

    return res.json({
      success: true,
      simulado: Boolean(resultado.simulado),
      destinatario,
    })
  } catch (error) {
    console.error('No se pudo enviar la confirmación administrativa de ruta:', error)
    const status = error.code === 'EMAIL_NOT_CONFIGURED' ? 503 : 500
    return res.status(status).json({
      error: status === 503
        ? 'El envío de correo no está configurado en el servidor'
        : 'No se pudo enviar el correo de confirmación',
    })
  }
})

export default router
