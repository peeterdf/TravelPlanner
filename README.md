# TravelPlanner

Organizador de viajes grupales offline-first. Gestiona transportes, alojamientos, itinerario, actividades, gastos multi-moneda y checklist de equipaje — todo desde el celular, con sync opcional a la nube.

**[Ver app →](https://peeterdf.github.io/TravelPlanner/)**

---

## Features

- **Viajes offline-first** — toda la data vive en el dispositivo (IndexedDB), funciona sin internet
- **Sync en la nube** — sincronización automática a Firebase con un código de viaje compartible
- **Multi-viajero** — invitá a otros con el código del viaje para colaborar en tiempo real
- **Transportes** — vuelos, trenes, buses con horarios, aeropuertos y reservas
- **Alojamiento** — hoteles y reservas con fechas, dirección y notas
- **Itinerario** — día a día por ciudad con actividades y horarios
- **Actividades** — lugares y planes con estado (pendiente/hecho/descartado)
- **Gastos** — multi-moneda, categorías, split entre viajeros y saldo por persona
- **Checklist de equipaje** — listas jerárquicas por categoría, con progreso
- **Notas** — texto libre por viaje (direcciones, tips, recordatorios)
- **Pases de embarque** — boarding passes `.pkpass` y QR personales
- **Auditoría** — historial completo de cambios con usuario y timestamp
- **Temas** — claro, oscuro, cálido, o sincronizado con el sistema
- **Modo privacidad** — oculta montos y nombres sensibles
- **PWA + Android** — instalable como app; build nativo con Capacitor

---

## Stack

| Capa | Tecnología |
|------|-----------|
| UI | React 19 + TypeScript + Tailwind CSS |
| Estado | Zustand |
| Routing | React Router v7 |
| Storage local | localforage (IndexedDB) |
| Backend | Firebase (Auth + Firestore) |
| Build | Vite 8 + PWA (Workbox) |
| Mobile | Capacitor 8 (Android) |
| Íconos | Lucide React |

---

## Setup local

```bash
# Instalar dependencias (legacy-peer-deps requerido)
npm ci --legacy-peer-deps

# Copiar variables de entorno y completar con credenciales Firebase
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

Variables de entorno necesarias en `.env.local`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
VITE_RECAPTCHA_SITE_KEY=   # opcional, habilita App Check
```

### Comandos

```bash
npm run dev       # Dev server con HMR
npm run build     # TypeScript check + build de producción
npm run lint      # ESLint
npm run preview   # Preview del build de producción
```

---

## Deployment

### GitHub Pages

El build de producción se despliega automáticamente a GitHub Pages. La base URL es `/TravelPlanner/`.

### Android (Capacitor)

```bash
BUILD_TARGET=android npm run build
npx cap sync android
npx cap open android
```

---

## Changelog

Ver [CHANGELOG.md](./CHANGELOG.md) para el historial de versiones y cambios por release.
