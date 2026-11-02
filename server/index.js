/**
 * server/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Servidor Backend Express para MTB Los Titanes.
 * Gestiona el área de administración de citas y el envío de confirmaciones
 * mediante Firebase Admin SDK y Nodemailer.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import express from 'express'
import cors from 'cors'
import citasRouter from './routes/citas.js'
import rutasRouter from './routes/rutas.js'
import adminRutasRouter from './routes/adminRutas.js'
import { adminAuth, adminDb } from './firebaseAdmin.js'

const app = express()
const PORT = process.env.PORT || 3001
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)
app.use(express.json())

// ── Rutas ─────────────────────────────────────────────────────────────────────
const adminEmails = new Set([
  'admin@mtbtinanes.com',
  'taller@mtbtinanes.com',
  'ferecorweb@gmail.com',
  'mtblostitanes@gmail.com',
])

app.use('/api/admin/citas', async (req, res, next) => {
  const authorization = req.get('authorization')
  const token = authorization?.match(/^Bearer (.+)$/i)?.[1]

  if (!token) {
    return res.status(401).json({ error: 'Se requiere iniciar sesión' })
  }
  if (!adminAuth) {
    return res.status(503).json({ error: 'Autenticación no disponible en el servidor' })
  }

  try {
    const user = await adminAuth.verifyIdToken(token, true)
    const email = user.email?.toLowerCase()

    if (user.email_verified !== true || !email || !adminEmails.has(email)) {
      return res.status(403).json({ error: 'No tienes permisos de administración' })
    }

    return next()
  } catch (error) {
    console.warn('No se pudo verificar el token de acceso al panel:', error.message)
    return res.status(401).json({ error: 'La sesión no es válida o ha caducado' })
  }
})

app.use('/api/admin/citas', citasRouter)
app.use('/api/admin/rutas', adminRutasRouter)
app.use('/api/rutas', rutasRouter)

// Healthcheck y diagnóstico
app.get('/api/health', async (req, res) => {
  try {
    await adminDb.collection('citas').limit(1).get()
  } catch (error) {
    console.error('❌ Firebase Admin no puede consultar Firestore:', error.message)
    return res.status(503).json({
      status: 'error',
      mensaje: 'Firebase Admin no puede acceder a Firestore',
      firebaseAdminConectado: false,
      timestamp: new Date().toISOString(),
    })
  }

  return res.json({
    status: 'ok',
    mensaje: 'Servidor Backend de MTB Los Titanes en ejecución',
    firebaseAdminConectado: true,
    timestamp: new Date().toISOString(),
  })
})

// ── Iniciar servidor ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend de administración escuchando en el puerto ${PORT}`)
})

export default app
