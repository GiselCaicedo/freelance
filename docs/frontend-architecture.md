# Arquitectura de frontend basada en features

Este documento propone una estructura de carpetas centrada en features para el código de `frontend/src`, junto con reglas de importación y consideraciones para i18n y middlewares. Antes de iniciar una migración a gran escala se debe consensuar el plan con el equipo.

## Estructura propuesta

```
frontend/src
├── app/
│   └── [locale]/               # Rutas y layouts internacionalizados
├── features/
│   └── <feature-name>/
│       ├── pages/              # Segmentos de la App Router o páginas específicas del feature
│       ├── components/         # Componentes UI exclusivos del feature
│       ├── services/           # Acceso a APIs, queries, mutaciones, etc.
│       ├── types/              # Tipos y esquemas del feature
│       └── index.ts            # (Opcional) punto de entrada público del feature
├── shared/
│   ├── components/             # Componentes reutilizables en múltiples features
│   ├── hooks/
│   ├── libs/
│   ├── services/
│   ├── styles/
│   └── types/
└── middleware.ts               # Middleware global de Next.js
```

La carpeta `shared` centraliza utilidades y piezas transversales, mientras que cada subcarpeta dentro de `features` encapsula la lógica específica de negocio. El árbol actual se puede migrar de forma incremental: nuevos desarrollos deberían ubicarse en la estructura propuesta y las carpetas existentes (`components`, `services`, `panels`, etc.) pueden moverse paulatinamente cuando exista capacidad.

> **Importante:** cualquier movimiento masivo de archivos debe comunicarse y aprobarse previamente con el equipo para evitar interrupciones en los flujos de trabajo.

## Reglas de importación

Para reforzar la separación por dominios se definen los siguientes aliases en `tsconfig.json`:

- `@/features/*` → `frontend/src/features/*`
- `@/shared/*` → `frontend/src/shared/*`

Las reglas de ESLint impiden importar otras features o módulos compartidos mediante rutas relativas (`../features/...` o `../shared/...`). Al estructurar un feature:

- Usa rutas relativas (`./`, `../`) únicamente dentro del mismo feature.
- Usa `@/features/<feature>/...` cuando otro feature requiera consumir artefactos expuestos.
- Usa `@/shared/...` para dependencias transversales.

Esta convención se aplicará tanto en código de aplicación como en tests y stories, garantizando consistencia entre builds de Next.js, Vitest y Storybook (todos respetan los aliases definidos en `tsconfig.json`).

## Compatibilidad con i18n y middlewares

La carpeta `app/[locale]` continúa siendo el punto de entrada para la internacionalización con `next-intl`. Los segmentos de ruta pueden importar componentes o lógica de un feature usando los aliases anteriores, manteniendo la compatibilidad con la resolución de rutas de Next.js.

El archivo `frontend/src/middleware.ts` permanece en la raíz de `src` para que Next.js lo detecte automáticamente. El middleware puede consumir utilidades compartidas (`@/shared/...`) o servicios de features específicos según sea necesario.

## Próximos pasos

1. Validar esta propuesta con el equipo de frontend y UX.
2. Planificar migraciones graduales de las carpetas existentes hacia `features/` y `shared/`, priorizando los módulos con mayor actividad.
3. Registrar las decisiones acordadas (nombres de features, convenciones adicionales) antes de automatizar movimientos o generar scripts.

Una vez obtenida la aprobación, se podrán ejecutar migraciones masivas o automatizadas siguiendo el plan acordado.
