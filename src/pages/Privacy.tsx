import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function Privacy() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-gray-600 dark:text-gray-300">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Política de privacidad</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 text-sm text-gray-700 dark:text-gray-300">
        <p className="text-xs text-gray-400">Última actualización: abril 2026</p>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">¿Qué datos recopilamos?</h2>
          <p>TravelPlanner almacena únicamente los datos que vos ingresás: nombre del viaje, fechas, viajeros, transportes, alojamientos, gastos, actividades y notas.</p>
          <p>Si iniciás sesión con Google, también almacenamos tu nombre y dirección de correo electrónico para identificar tu cuenta.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">¿Dónde se guardan?</h2>
          <p>Los datos se guardan localmente en tu dispositivo (IndexedDB). Si activás la sincronización en la nube, se almacenan también en Google Firestore (Firebase), bajo un código único de acceso que solo vos conocés.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">¿Con quién se comparten?</h2>
          <p>No compartimos tus datos con terceros. Solo quienes tengan el código de viaje pueden acceder a él. Google Firebase actúa como proveedor de infraestructura bajo sus propios términos de privacidad.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">¿Cómo eliminamos tus datos?</h2>
          <p>Podés eliminar cualquier viaje desde la pantalla principal. Si eliminás un viaje sincronizado, también se elimina de la nube. Para eliminar tu cuenta de Google asociada, cerrá sesión y contactanos.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Cookies y analítica</h2>
          <p>No usamos cookies de rastreo ni servicios de analítica de terceros. Firebase puede registrar datos técnicos mínimos (IP, timestamps) según su política de privacidad.</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-gray-900 dark:text-white text-base">Contacto</h2>
          <p>Para consultas sobre privacidad, abrí un issue en el repositorio del proyecto en GitHub.</p>
        </section>
      </div>
    </div>
  )
}
