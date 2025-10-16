# Cifra Pay

Pasarela de pagos organizada como monorepo con un backend ligero en Node.js y un frontend en Next.js. Este documento describe la estructura del proyecto para facilitar la navegación y el trabajo en equipo.

## Estructura general del repositorio

```
cifra-pay/
├── back-cifra-pay/        # Servicio backend (Node.js)
├── front-cifra-pay/       # Aplicación frontend (Next.js)
├── docker-compose.yml     # Orquestación de servicios en desarrollo
├── lefthook.yml           # Hooks compartidos para tareas de calidad
└── mockup/                # Recursos visuales de referencia
```

## Backend (back-cifra-pay/)

```
back-cifra-pay/
├── .dockerignore
├── .env
├── .env.test
├── .github
│   └── workflows
│       ├── cd.yml
│       ├── ci.yml
│       └── test.yml
├── .gitignore
├── .husky
│   ├── _
│   ├── commit-msg
│   └── pre-commit
├── .vscode
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── Dockerfile
├── README.md
├── config
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── commitlint.config.cjs
│   └── lint-staged.config.js
├── index.js
├── jest.config.js
├── nodemon.json
├── package.json
├── src
│   ├── __mocks__
│   │   ├── authMockData.js
│   │   ├── businessMockData.js
│   │   ├── paymentMockData.js
│   │   ├── prismaMock.js
│   │   └── userMockData.js
│   ├── app.js
│   ├── config
│   │   ├── db.js
│   │   └── env.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── businessController.js
│   │   ├── paymentController.js
│   │   ├── serviceController.js
│   │   └── userController.js
│   ├── middlewares
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── loggerMiddleware.js
│   │   └── validateRequest.js
│   ├── models
│   │   ├── businessModel.js
│   │   ├── paymentModel.js
│   │   ├── serviceModel.js
│   │   └── userModel.js
│   ├── prisma
│   │   ├── migrations
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── businessRoutes.js
│   │   ├── index.js
│   │   ├── paymentRoutes.js
│   │   ├── serviceRoutes.js
│   │   └── userRoutes.js
│   ├── server.js
│   ├── services
│   │   ├── authService.js
│   │   ├── businessService.js
│   │   ├── paymentService.js
│   │   ├── serviceService.js
│   │   └── userService.js
│   ├── tests
│   │   ├── e2e
│   │   │   ├── authFlow.test.js
│   │   │   ├── businessFlow.test.js
│   │   │   └── paymentFlow.test.js
│   │   ├── integration
│   │   │   ├── authRoutes.test.js
│   │   │   ├── businessRoutes.test.js
│   │   │   ├── paymentRoutes.test.js
│   │   │   ├── serviceRoutes.test.js
│   │   │   └── userRoutes.test.js
│   │   ├── setup
│   │   │   ├── globalSetup.js
│   │   │   ├── globalTeardown.js
│   │   │   └── prismaMock.js
│   │   └── unit
│   │       ├── authService.test.js
│   │       ├── businessService.test.js
│   │       ├── paymentService.test.js
│   │       ├── serviceService.test.js
│   │       └── userService.test.js
│   └── utils
│       ├── dateUtils.js
│       ├── errorMessages.js
│       ├── hashPassword.js
│       ├── jwt.js
│       ├── logger.js
│       └── responseHandler.js
└── tsconfig.json
```

### Descripción del Backend

El backend está construido con Node.js y sigue una arquitectura MVC (Modelo-Vista-Controlador) bien organizada. Características principales:

- **Configuración**: Gestión de variables de entorno, conexión a base de datos y configuración de herramientas de desarrollo.
- **Controllers**: Lógica de manejo de peticiones HTTP para autenticación, negocios, pagos, servicios y usuarios.
- **Services**: Capa de lógica de negocio que interactúa con los modelos.
- **Models**: Definiciones de datos y operaciones de base de datos.
- **Routes**: Definición de endpoints de la API.
- **Middlewares**: Autenticación, validación, logging y manejo de errores.
- **Prisma ORM**: Migraciones, esquema de base de datos y seeders.
- **Testing**: Suite completa de pruebas unitarias, de integración y end-to-end con Jest.
- **CI/CD**: Workflows de GitHub Actions para integración continua, despliegue y pruebas automatizadas.
- **Herramientas de calidad**: ESLint, Prettier, Commitlint, Husky y lint-staged para mantener estándares de código.

## Frontend (front-cifra-pay/)

```
front-cifra-pay/
├── .coderabbit.yaml
├── .env
├── .env.production
├── .github
│   ├── actions
│   │   └── setup-project
│   │       └── action.yml
│   ├── dependabot.yml
│   └── workflows
│       ├── CI.yml
│       ├── checkly.yml
│       ├── crowdin.yml
│       └── release.yml
├── .gitignore
├── .storybook
│   ├── main.ts
│   ├── preview.ts
│   ├── vitest.config.mts
│   └── vitest.setup.ts
├── .vscode
│   ├── extensions.json
│   ├── launch.json
│   ├── settings.json
│   └── tasks.json
├── Dockerfile
├── LICENSE
├── README.md
├── checkly.config.ts
├── codecov.yml
├── commitlint.config.ts
├── crowdin.yml
├── drizzle.config.ts
├── eslint.config.mjs
├── knip.config.ts
├── lefthook.yml
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── playwright.config.ts
├── postcss.config.mjs
├── public
│   ├── apple-touch-icon.png
│   ├── assets
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon.ico
├── src
│   ├── app
│   │   ├── [locale]
│   │   │   ├── (auth)
│   │   │   │   ├── (center)
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── sign-in
│   │   │   │   │   │   └── [[...sign-in]]
│   │   │   │   │   │       └── page.tsx
│   │   │   │   │   └── sign-up
│   │   │   │   │       └── [[...sign-up]]
│   │   │   │   │           └── page.tsx
│   │   │   │   ├── (cifra-pay)
│   │   │   │   │   ├── (dashboard)
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── configuracion
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── cotizaciones
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── pagos
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── servicios
│   │   │   │   │       └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── global-error.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components
│   │   ├── LocaleSwitcher.tsx
│   │   ├── analytics
│   │   │   ├── PostHogPageView.tsx
│   │   │   └── PostHogProvider.tsx
│   │   └── layouts
│   │       ├── Footer.tsx
│   │       └── Nav.tsx
│   ├── instrumentation-client.ts
│   ├── instrumentation.ts
│   ├── libs
│   │   ├── Arcjet.ts
│   │   ├── Env.ts
│   │   ├── I18n.ts
│   │   ├── I18nNavigation.ts
│   │   ├── I18nRouting.ts
│   │   └── Logger.ts
│   ├── locales
│   │   ├── en.json
│   │   └── es.json
│   ├── middleware.ts
│   ├── styles
│   │   └── global.css
│   ├── templates
│   │   ├── BaseTemplate.stories.tsx
│   │   ├── BaseTemplate.test.tsx
│   │   └── BaseTemplate.tsx
│   ├── types
│   │   └── I18n.ts
│   ├── utils
│   │   ├── AppConfig.ts
│   │   ├── Helpers.test.ts
│   │   └── Helpers.ts
│   └── validations
│       └── CounterValidation.ts
├── tests
│   ├── e2e
│   │   ├── Counter.e2e.ts
│   │   ├── I18n.e2e.ts
│   │   ├── Sanity.check.e2e.ts
│   │   └── Visual.e2e.ts
│   └── integration
│       └── Counter.spec.ts
├── tsconfig.json
└── vitest.config.mts
```

### Descripción del Frontend

La aplicación frontend adopta Next.js 15 con el App Router y soporte para internacionalización. Características principales:

#### Arquitectura y Estructura

- **App Router de Next.js 15**: Sistema de enrutamiento moderno basado en carpetas con soporte para layouts anidados y rutas dinámicas.
- **Estructura modular por dominio**: Organización clara entre rutas de autenticación, dashboard y configuración.
- **TypeScript**: Tipado estático completo para mayor robustez y autocompletado.

#### Rutas y Páginas

- **Autenticación**: 
  - Sign-in y Sign-up con rutas catch-all (`[[...sign-in]]`, `[[...sign-up]]`)
  - Layout centrado para páginas de autenticación
- **Cifra Pay (Área Principal)**:
  - Dashboard principal
  - Gestión de configuración
  - Módulo de cotizaciones
  - Módulo de pagos
  - Módulo de servicios
- **Internacionalización**: Rutas dinámicas con soporte para múltiples idiomas (`[locale]`)

#### Componentes y UI

- **Componentes reutilizables**: Estructura organizada en `components/`
  - Layouts (Footer, Nav)
  - LocaleSwitcher para cambio de idioma
  - Componentes de analytics (PostHog)
- **Templates**: Plantillas base con sus respectivos tests y stories de Storybook

#### Internacionalización (i18n)

- **next-intl**: Biblioteca para manejo de traducciones
- **Archivos de traducción**: JSON para inglés y español
- **Navegación i18n**: Utilidades personalizadas para routing internacionalizado
- **Middleware**: Gestión automática de detección y redirección de idiomas

#### Testing y Calidad

- **Playwright**: Pruebas end-to-end para flujos críticos
  - Tests de contador
  - Tests de internacionalización
  - Tests de sanidad
  - Tests visuales
- **Vitest**: Pruebas unitarias e de integración
- **Storybook**: Documentación interactiva de componentes con configuración personalizada
- **Checkly**: Monitoreo sintético y pruebas de producción

#### Herramientas de Desarrollo

- **ESLint**: Linting con configuración moderna (`.mjs`)
- **Commitlint**: Validación de mensajes de commit
- **Lefthook**: Git hooks para mantener calidad del código
- **Knip**: Detección de dependencias y exports no utilizados
- **Codecov**: Cobertura de código

#### Integración y Seguridad

- **Arcjet**: Protección contra amenazas y rate limiting
- **Sentry**: Monitoreo de errores en tiempo real
- **PostHog**: Analytics y seguimiento de eventos
- **Drizzle ORM**: Gestión de base de datos con migraciones type-safe

#### CI/CD

- **GitHub Actions**:
  - CI.yml: Integración continua
  - checkly.yml: Monitoreo automatizado
  - crowdin.yml: Sincronización de traducciones
  - release.yml: Automatización de releases
- **Dependabot**: Actualización automática de dependencias

#### Configuración y Optimización

- **Next.config.ts**: Configuración avanzada de Next.js
- **PostCSS**: Procesamiento de CSS con plugins modernos
- **Turbopack**: Compilación ultrarrápida en desarrollo
- **SEO**: Generación automática de robots.txt y sitemap.xml

#### Activos Públicos

- Favicons en múltiples tamaños
- Apple touch icon
- Directorio de assets para imágenes y recursos estáticos

## Recursos adicionales

- **docker-compose.yml**: Define servicios para ejecutar backend y frontend en conjunto durante el desarrollo local.
- **lefthook.yml**: Centraliza hooks pre-commit/pre-push para asegurar estándares en ambos proyectos.
- **mockup/Dashboard.png**: Referencia visual del dashboard principal de la pasarela.

## Cómo empezar

### Instalación

1. Instala dependencias en cada paquete:
   ```bash
   cd back-cifra-pay && npm install
   cd ../front-cifra-pay && npm install
   ```

### Configuración

2. Configura las variables de entorno:
   ```bash
   # Backend
   cp back-cifra-pay/.env.example back-cifra-pay/.env
   
   # Frontend
   cp front-cifra-pay/.env.example front-cifra-pay/.env
   ```

### Ejecución

3. Inicia los servicios:
   - **Modo independiente**: 
     - Backend: `cd back-cifra-pay && npm start`
     - Frontend: `cd front-cifra-pay && npm run dev`
   - **Con Docker**: 
     ```bash
     docker-compose up
     ```
     Levanta ambos servicios simultáneamente desde la raíz del proyecto.

### Testing

- **Backend**: 
  ```bash
  cd back-cifra-pay && npm test
  ```
- **Frontend**: 
  ```bash
  cd front-cifra-pay && npm test              # Tests unitarios con Vitest
  cd front-cifra-pay && npm run test:e2e      # Tests E2E con Playwright
  ```

### Desarrollo con Storybook

```bash
cd front-cifra-pay && npm run storybook
```

### Construcción para Producción

```bash
# Backend
cd back-cifra-pay && npm run build

# Frontend
cd front-cifra-pay && npm run build
```
