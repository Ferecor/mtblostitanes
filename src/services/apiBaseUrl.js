const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || ''
const currentApiBaseUrl = 'https://mtblostitanes.onrender.com'
const legacyApiBaseUrl = 'https://mtb-tinanes-api.onrender.com'

const API_BASE_URL = configuredApiBaseUrl === legacyApiBaseUrl
  ? currentApiBaseUrl
  : configuredApiBaseUrl || (import.meta.env.PROD ? currentApiBaseUrl : '')

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}
