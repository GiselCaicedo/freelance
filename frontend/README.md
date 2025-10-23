# Cifra Pay Frontend

Aplicación Next.js para la pasarela de pagos. Esta guía resume la nueva jerarquía del código y los comandos necesarios para validar los cambios antes de subirlos al repositorio o al pipeline de CI.

## Estructura de carpetas

```
src/
├── app/                 # Rutas y layouts de Next.js
├── components/          # Componentes transversales por dominio
├── panels/
│   ├── admin/           # Experiencia de administración
│   └── client/          # Experiencia de clientes finales
├── shared/              # Utilidades y componentes reutilizables entre paneles
├── services/            # Integraciones con APIs internas/externas
├── libs/                # Librerías y adaptadores de bajo nivel
├── utils/               # Helpers puros
├── validations/         # Esquemas de validación
└── types/               # Tipos y contratos compartidos
```

> 🔐 **Importaciones entre paneles**: El panel de administración no puede importar directamente módulos del panel de clientes (y viceversa). Todo lo compartido debe vivir dentro de `src/shared`. ESLint fallará si se rompe esta regla.

## Calidad de código

La configuración de ESLint y Knip se actualizó para respetar la jerarquía anterior y detectar importaciones cruzadas indebidas. Ejecuta los siguientes comandos localmente o deja que `lefthook` los valide durante el `pre-commit`:

```bash
npm run check:types   # tsc sin emitir archivos
npm run lint          # Reglas generales (incluye jerarquía)
npm run lint:exports  # Orden estable de exports en cada módulo
npm run check:deps    # Auditoría de dependencias sin usar (Knip)
```

## Pruebas

### Unitarias y snapshots

- `npm run test` ejecuta la suite de Vitest. Se añadieron snapshots para componentes compartidos (`src/shared/components`).
- Para crear nuevas pruebas visuales, añade archivos `*.test.tsx` dentro de `src/shared/components/__tests__` u otro subdirectorio compartido.

### End-to-end

Los E2E se agrupan por experiencia en `tests/e2e/<experiencia>`. Playwright genera proyectos por panel y navegador (Chromium siempre, Firefox solo en CI).

```bash
npm run test:e2e      # Lanza Playwright con la jerarquía de paneles
```

## Automatizaciones

- `lefthook` ejecuta las comprobaciones anteriores antes de cada commit.
- El pipeline de CI replica los mismos comandos (tipado, lint, exports ordenados, pruebas unitarias y E2E). Revisa los jobs de GitHub Actions si alguno falla.

## Recursos adicionales

- [Next.js](https://nextjs.org/)
- [Playwright](https://playwright.dev/)
- [Vitest](https://vitest.dev/)
- [Knip](https://knip.dev/)
- [Lefthook](https://lefthook.dev/)
