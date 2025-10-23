# Features

Esta carpeta agrupa funcionalidades end-to-end. Cada subcarpeta debe exponer sus APIs públicas a través de `index.ts` (opcional) y organizar sus archivos internos en `pages/`, `components/`, `services/`, `types/` u otras subcarpetas específicas del dominio.

Las importaciones desde otros features o desde `app/` deben hacerse mediante el alias `@/features/<feature>` definido en `tsconfig.json`.
