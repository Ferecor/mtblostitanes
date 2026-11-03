# Despliegue en Netlify y Render

El frontend React/Vite se publica en Netlify y la API Express se ejecuta en
Render. La API necesita Firebase Admin para Firestore y Firebase Authentication.

## 1. Publicar la API en Render

1. El proyecto debe estar en un repositorio Git conectado a Render. En el
   Dashboard de Render, crea un Blueprint y selecciona el repositorio. Render
   leerá `render.yaml` y propondrá crear `mtb-tinanes-api`. Revisa el plan y sus
   límites/costos en Render antes de crear el servicio.
2. En la configuración del servicio, crea un archivo secreto llamado
   `firebase-admin.json` con la clave JSON de una cuenta de servicio dedicada.
   Render monta los archivos secretos bajo `/etc/secrets`; configura
   `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-admin.json`.
   En producción, el servidor no arranca si falta este archivo; `/api/health`
   también comprueba que Firebase Admin pueda consultar Firestore.
3. Usa una cuenta de servicio con los permisos mínimos necesarios para
   Firestore y para consultar usuarios en Firebase Authentication. No reutilices
   ni publiques claves en el repositorio. Revoca y rota cualquier clave que se
   haya compartido accidentalmente.
4. El Blueprint fija `CORS_ORIGINS` a `https://mtblostitanes.netlify.app`.
   Actualiza ese valor en Render si usas otro dominio frontend. La URL pública
   de la API aparecerá en el panel de Render; comprueba
   `https://URL-DE-RENDER/api/health` y confirma que responde con estado `ok`.
5. El SMTP se aplazó: sin configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y
   `SMTP_PASS`, los endpoints de confirmación por correo responderán `503`.
   Añade credenciales SMTP solo como variables/secretos de Render, nunca en
   variables `VITE_*`.

## 2. Conectar y publicar el frontend en Netlify

El sitio `mtblostitanes.netlify.app` se publicó con Netlify Drop y aún no tiene
un flujo de build conectado a Git. Para que Netlify aplique las variables de
compilación automáticamente, conecta el proyecto a un repositorio Git desde
**Project configuration → Build & deploy**.

1. Configura el comando `npm run build`, el directorio de publicación `dist` y
   Node 22 (`.nvmrc`). `netlify.toml` ya contiene la configuración de build y
   el fallback para React Router.
2. En las variables de entorno del proyecto Netlify, define las seis variables
   `VITE_FIREBASE_*` de `.env.example` con la configuración de la aplicación web
   Firebase. Define también `VITE_API_BASE_URL` como
   `https://mtblostitanes.onrender.com`, sin barra final. Si App Check está activo, configura
   `VITE_FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY`.
3. Inicia un nuevo deploy de producción en Netlify. Las variables `VITE_*` se
   incorporan al JavaScript que se entrega al navegador; deben ser solo
   configuración pública de Firebase y URL pública de la API, nunca secretos.
4. En Firebase Authentication, añade `mtblostitanes.netlify.app` (y el dominio
   propio, si aplica) a los dominios autorizados. Si App Check está activo,
   permite esos dominios en la configuración de reCAPTCHA.
5. Si modificas reglas de Firestore, publícalas desde la raíz con Firebase CLI:

   ```sh
   firebase deploy --project mtb-lostitanes --only firestore:rules
   ```

## Desarrollo local

Deja `VITE_API_BASE_URL` sin definir para usar el proxy local de Vite hacia
`http://localhost:3001`. Configura `GOOGLE_APPLICATION_CREDENTIALS` con una
clave local de Firebase Admin solo en tu entorno de desarrollo y usa SMTP de
prueba si necesitas verificar correos.

No subas `.env.local`, archivos de cuenta de servicio ni credenciales SMTP al
repositorio. El `.gitignore` ya excluye los archivos locales de entorno y las
claves JSON de Firebase.
