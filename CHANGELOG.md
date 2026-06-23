# Changelog

Todos los cambios notables se documentan en este archivo.  
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).

---

## [Unreleased]

## [1.1.15] - 2026-06-23

### Added
- Sección "Acerca de" en la pantalla Más: muestra versión de la app, descripción y stack técnico
- `CHANGELOG.md` con historial de versiones
- `README.md` con documentación real del proyecto (reemplaza el template genérico de Vite)

---

## [1.1.0] - inicial

### Added
- Gestión de viajes offline-first con almacenamiento en IndexedDB (localforage)
- Sincronización opcional a Firebase Firestore con código de viaje compartible (20 chars)
- Autenticación Firebase: anónima por defecto, upgrade a Google OAuth o email/contraseña
- Módulo de **Transportes**: vuelos, trenes y buses con horarios, aeropuertos/terminales y código de reserva
- Módulo de **Alojamiento**: hoteles con fechas de check-in/out, dirección y notas
- Módulo de **Itinerario**: planificación día a día por ciudad con actividades
- Módulo de **Actividades**: lugares y planes con estado (pendiente / hecho / descartado)
- Módulo de **Gastos**: multi-moneda, categorías, split entre viajeros y cálculo de saldo por persona
- Módulo de **Checklist de equipaje**: listas jerárquicas por categoría con barra de progreso
- Módulo de **Notas**: texto libre por viaje
- **Pases de embarque**: soporte para `.pkpass` y QR personales, solo visibles al dueño
- **Auditoría**: historial completo de cambios con usuario, acción y timestamp
- Temas: claro, oscuro, cálido y sincronizado con el sistema operativo
- Modo privacidad: oculta montos y nombres sensibles en pantalla
- Notificaciones locales (PWA + Capacitor Android)
- PWA instalable con Workbox caching
- Soporte Android nativo con Capacitor 8
- Reglas de seguridad Firestore: lectura/creación autenticada, colaboración abierta, eliminación solo para el dueño
