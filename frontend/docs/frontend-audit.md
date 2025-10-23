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

## 2. Componentes y paneles
### `src/components`
- `acl/Can.tsx`
- `analytics/PostHogPageView.tsx`
- `analytics/PostHogProvider.tsx`
- `auth/LogoutButton.tsx`
- `clients/AssignServiceModal.tsx`
- `clients/AssignServicePanel.tsx`
- `clients/ClientDetailView.tsx`
- `clients/ClientFormModal.tsx`
- `clients/ClientListView.tsx`
- `clients/DeleteClientModal.tsx`
- `clients/mockData.ts`
- `clients/types.ts`
- `common/ActionsCell.tsx`
- `common/AlertsProvider.tsx`
- `common/ConfirmDialog.tsx`
- `common/PageHeader.tsx`
- `common/SidePanel.tsx`
- `datagrid/AgTable.tsx`
- `invoices/InvoiceDetailView.tsx`
- `invoices/InvoiceForm.tsx`
- `invoices/InvoiceListView.tsx`
- `layouts/Footer.tsx`
- `layouts/Nav.tsx`
- `LocaleSwitcher.tsx`
- `payments/DeletePaymentModal.tsx`
- `payments/PaymentFormDrawer.tsx`
- `payments/PaymentListView.tsx`
- `payments/types.ts`
- `quotes/QuoteDetailInspector.tsx`
- `quotes/QuoteDetailPageView.tsx`
- `quotes/QuoteListView.tsx`
- `quotes/types.ts`
- `services/ServiceFormPanel.tsx`
- `services/ServiceListView.tsx`
- `services/types.ts`
- `ui/Breadcrumbs.tsx`
- `users/CreateUserForm.tsx`
- `users/EditUserForm.tsx`

### `src/panels`
- `client/data/dashboard.ts`
- `admin/data/dashboard.ts`
- `admin/data/invoices.ts`
- `admin/components/dashboard/DashboardFilters.tsx`
- `admin/components/dashboard/ClientStatusCard.tsx`
- `admin/components/dashboard/MetricCard.tsx`
- `admin/components/dashboard/MonthlyComparisonCard.tsx`
- `admin/components/dashboard/SectionCard.tsx`
- `admin/components/dashboard/TopServicesCard.tsx`
- `admin/components/dashboard/UpcomingExpirationsCard.tsx`
- `admin/components/datagrid/AgTable.tsx`
- `admin/components/roles/RoleFormModal.tsx`
- `admin/components/roles/RolePermissionsModal.tsx`
- `admin/components/users/CreateUserForm.tsx`
- `admin/components/users/EditUserForm.tsx`

## 3. Hooks
- No se identificaron hooks personalizados (`use*`) dentro de los directorios revisados.

## 4. Servicios
- `src/services/conexion.ts`
- `src/shared/services/conexion.ts`
- `src/shared/services/settings.ts`

## 5. Tipos y validaciones
- Tipos compartidos: `src/types/I18n.ts`, `src/shared/types/I18n.ts`
- Tipos por dominio:
  - `src/components/clients/types.ts`
  - `src/components/payments/types.ts`
  - `src/components/quotes/types.ts`
  - `src/components/services/types.ts`
- Validaciones: `src/validations/CounterValidation.ts`, `src/shared/validations/CounterValidation.ts`

## 6. Estilos
- `src/styles/global.css`

## 7. Duplicidades detectadas
- Componentes replicados en `src/components` y `src/shared/components`: `LocaleSwitcher.tsx`, `acl/Can.tsx`, `analytics/PostHogPageView.tsx`, `analytics/PostHogProvider.tsx`, `auth/LogoutButton.tsx`, `common/ActionsCell.tsx`, `common/AlertsProvider.tsx`, `common/ConfirmDialog.tsx`, `common/PageHeader.tsx`, `common/SidePanel.tsx`, `datagrid/AgTable.tsx`, `layouts/Footer.tsx`, `layouts/Nav.tsx`, `ui/Breadcrumbs.tsx`.
- Plantillas duplicadas entre `src/templates` y `src/shared/templates`: `BaseTemplate.tsx`, `BaseTemplate.stories.tsx`, `BaseTemplate.test.tsx`.
- Utilidades duplicadas entre `src/utils` y `src/shared/utils`: `AppConfig.ts`, `Helpers.ts`, `Helpers.test.ts`.
- Tipado I18n replicado en `src/types/I18n.ts` y `src/shared/types/I18n.ts`.
- Validación de contador replicada en `src/validations/CounterValidation.ts` y `src/shared/validations/CounterValidation.ts`.
- Servicio `conexion` con dos variantes (`src/services/conexion.ts` más acotado y `src/shared/services/conexion.ts` extendido con tipados para clientes, pagos, servicios, cotizaciones e invoices).

## 8. Dependencias críticas en rutas de `[locale]`
- Redirección base (`[locale]/page.tsx`): depende de `@/libs/Auth` para validar tokens.
- Flujo de autenticación (`sign-in`): usa `@/shared/services/conexion`, `@/shared/utils/roles` y `@/shared/components/common/AlertsProvider`.
- Panel cliente (`client/dashboard`): depende de `@/panels/client/data/dashboard` y `@/shared/utils/formatters`.
- Panel administrador (`admin/dashboard`): consume componentes de `@/panels/admin/components/dashboard` y utilidades de `@/shared/utils/formatters`.
- Gestión de pagos, cotizaciones, clientes, servicios e invoices (`admin/*`): cada página combina vistas en `@/components/*` con servicios remotos de `@/shared/services/conexion`.
- Configuración administrativa (`admin/settings/*`): reutiliza componentes de `@/shared/components`, tabs de `@/shared/components/settings`, navegación desde `@/shared/settings/navigation`, servicios específicos en `@/shared/services/settings` y `@/libs/acl/EnterpriseProvider`.

## 9. Reutilización de tipados/servicios
- Los módulos de configuración y seguridad comparten el cliente HTTP centralizado (`@/shared/services/conexion` + `@/shared/services/settings`).
- Los tipos de clientes, pagos, servicios y cotizaciones se definen localmente en cada paquete de componentes y se reimportan desde las páginas (`@/components/*/types`).
- Persisten duplicados no unificados entre `src/components` y `src/shared/components`, así como entre `src/utils` y `src/shared/utils`, lo que indica coexistencia de versiones locales y compartidas.
- El tipado `I18n` y la validación `CounterValidation` se mantienen en paralelo en ubicaciones globales y compartidas sin diferenciación aparente.
- El servicio `src/services/conexion.ts` parece una versión previa del cliente HTTP que no incluye los enriquecimientos de tipos y endpoints presentes en `src/shared/services/conexion.ts`.
