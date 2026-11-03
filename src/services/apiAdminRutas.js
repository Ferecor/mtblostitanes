import { auth } from '@/firebase/firebase'
import { apiUrl } from './apiBaseUrl'

async function requestAdminRutas(path, options = {}, forceRefresh = false) {
  const user = auth.currentUser
  if (!user) {
    throw new Error('Debes iniciar sesión para gestionar las rutas')
  }

  const token = await user.getIdToken(forceRefresh)
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401 && !forceRefresh) {
    return requestAdminRutas(path, options, true)
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}))
    throw new Error(result.error || 'No se pudo completar la operación')
  }

  return response.json()
}

export async function getInscritosRuta(rutaId) {
  const result = await requestAdminRutas(`/api/admin/rutas/${encodeURIComponent(rutaId)}/inscritos`)
  return result.inscritos
}

export async function enviarConfirmacionRutaAdmin(rutaId, userId, destinatario) {
  return requestAdminRutas(
    `/api/admin/rutas/${encodeURIComponent(rutaId)}/inscritos/${encodeURIComponent(userId)}/confirmacion`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatario }),
    }
  )
}
