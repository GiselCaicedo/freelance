# Frontend Audit (temporal)

## 1. Páginas en `src/app`
- `[locale]/page.tsx`
- `[locale]/(auth)/(center)/sign-in/[[...sign-in]]/page.tsx`
- `[locale]/client/page.tsx`
- `[locale]/client/layout.tsx`
- `[locale]/client/inicio/page.tsx`
- `[locale]/client/dashboard/page.tsx`
- `[locale]/admin/layout.tsx`
- `[locale]/admin/dashboard/page.tsx`
- `[locale]/admin/payments/page.tsx`
- `[locale]/admin/quotes/page.tsx`
- `[locale]/admin/quotes/[id]/page.tsx`
- `[locale]/admin/clients/page.tsx`
- `[locale]/admin/clients/[id]/page.tsx`
- `[locale]/admin/invoices/page.tsx`
- `[locale]/admin/invoices/[id]/page.tsx`
- `[locale]/admin/services/page.tsx`
- `[locale]/admin/settings/page.tsx`
- `[locale]/admin/settings/profile/page.tsx`
- `[locale]/admin/settings/company/page.tsx`
- `[locale]/admin/settings/general/page.tsx`
- `[locale]/admin/settings/smtp/page.tsx`
- `[locale]/admin/settings/alerts/page.tsx`
- `[locale]/admin/settings/security/policy/page.tsx`
- `[locale]/admin/settings/security/password-policy/page.tsx`
- `[locale]/admin/settings/security/session-policy/page.tsx`
- `[locale]/admin/settings/security/twofa/page.tsx`
- `[locale]/admin/settings/security/users/page.tsx`
- `[locale]/admin/settings/security/roles/page.tsx`
- `[locale]/admin/settings/security/roles/[id]/permissions/page.tsx`

## 2. Componentes y módulos
### `src/modules/admin`
- `clients/components/*`
- `dashboard/components/*`
- `data/dashboard.ts`, `data/invoices.ts`
- `invoices/components/*`
- `payments/components/*`
- `quotes/components/*`
- `roles/components/*`
- `services/components/*`
- `users/components/*`

### `src/modules/public`
- `data/dashboard.ts`

### `src/shared/components`
- `analytics/*`
- `auth/LogoutButton.tsx`
- `common/*`
- `datagrid/AgTable.tsx`
- `layouts/*`
- `settings/SettingsTabs.tsx`
- `ui/Breadcrumbs.tsx`

## 3. Hooks
- No se identificaron hooks personalizados (`use*`) dentro de los directorios revisados.

## 4. Servicios
- `src/shared/services/conexion.ts`
- `src/shared/services/settings.ts`

## 5. Tipos y validaciones
- Tipos compartidos: `src/shared/types/I18n.ts`
- Tipos por dominio:
  - `src/modules/admin/clients/types.ts`
  - `src/modules/admin/payments/types.ts`
  - `src/modules/admin/quotes/types.ts`
  - `src/modules/admin/services/types.ts`
- Validaciones: `src/validations/CounterValidation.ts`, `src/shared/validations/CounterValidation.ts`

## 6. Estilos
- `src/styles/global.css`

## 7. Duplicidades detectadas
- Componentes compartidos centralizados en `src/shared/components`. Se eliminaron las copias previas que residían en `src/components`.
- Plantillas consolidadas en `src/shared/templates`, reemplazando las versiones huérfanas de `src/templates`.
- Utilidades comunes agrupadas en `src/shared/utils`, retirando duplicados de `src/utils`.
- Tipado I18n unificado en `src/shared/types/I18n.ts`.
- Validación de contador disponible en `src/shared/validations/CounterValidation.ts` junto con la variante específica de `src/validations`.
- Servicio HTTP `conexion` expuesto únicamente desde `src/shared/services/conexion.ts`.

## 8. Dependencias críticas en rutas de `[locale]`
- Redirección base (`[locale]/page.tsx`): depende de `@app/core/libs/Auth` para validar tokens.
- Flujo de autenticación (`sign-in`): usa `@shared/services/conexion`, `@shared/utils/roles` y `@shared/components/common/AlertsProvider`.
- Panel público (`client/dashboard`): consume datos desde `@public/data/dashboard` y utilidades de `@shared/utils/formatters`.
- Panel administrativo (`admin/dashboard`): utiliza componentes en `@admin/dashboard/components` y utilidades de `@shared/utils/formatters`.
- Gestión de pagos, cotizaciones, clientes, servicios e invoices (`admin/*`): cada página combina vistas en `@admin/*` con servicios remotos de `@shared/services/conexion`.
- Configuración administrativa (`admin/settings/*`): reutiliza componentes de `@shared/components`, tabs de `@shared/components/settings`, navegación desde `@shared/settings/navigation`, servicios específicos en `@shared/services/settings` y proveedores ACL en `@core/libs/acl`.

## 9. Reutilización de tipados/servicios
- Los módulos de configuración y seguridad comparten el cliente HTTP centralizado (`@shared/services/conexion` + `@shared/services/settings`).
- Los tipos de clientes, pagos, servicios y cotizaciones se definen dentro de `@admin/*/types` y se consumen desde las páginas y componentes del módulo correspondiente.
- Las utilidades compartidas residen en `@shared/utils`, evitando dependencias circulares con `@admin` o `@public`.
- La validación `CounterValidation` dispone de versión UI en `src/validations` y versión compartida en `@shared/validations`.
