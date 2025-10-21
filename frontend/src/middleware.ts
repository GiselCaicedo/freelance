import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { detectBot } from '@arcjet/next';
import arcjet from '@/libs/Arcjet';
import createMiddleware from 'next-intl/middleware';
import { routing } from './libs/I18nRouting';
import { jwtVerify } from 'jose';

const devMode = process.env.NEXT_DEV_MODE;

// i18n
const handleI18nRouting = createMiddleware(routing);

// Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
  }),
);

// --- Rutas protegidas (ahora bajo /admin y /client) ---
const PROTECTED_ROUTES = [
  /^\/$/,                            // raíz
  /^\/admin(?:\/.*)?$/,              // /admin...
  /^\/client(?:\/.*)?$/,             // /client...
  /^\/[a-z]{2}\/$/,                  // /es o /en
  /^\/[a-z]{2}\/admin(?:\/.*)?$/,    // /es/admin...
  /^\/[a-z]{2}\/client(?:\/.*)?$/,   // /es/client...
];

// Subconjuntos para validar panel por permisos
const ADMIN_ROUTES = [
  /^\/admin(?:\/.*)?$/,
  /^\/[a-z]{2}\/admin(?:\/.*)?$/,
];

const CLIENT_ROUTES = [
  /^\/client(?:\/.*)?$/,
  /^\/[a-z]{2}\/client(?:\/.*)?$/,
];

// Páginas de autenticación (grupos de rutas no afectan la URL)
const AUTH_PAGES = [
  /^\/sign-in(.*)/,
  /^\/[a-z]{2}\/sign-in(.*)/,
  /^\/sign-up(.*)/,
  /^\/[a-z]{2}\/sign-up(.*)/,
];

// Mapa de slugs "públicos" -> canonical interno (para /cotizaciones, /pagos, etc.)
type Canonical = 'dashboard' | 'quotes' | 'payments' | 'services' | 'settings';
const PUBLIC_SLUG_MAP: Record<string, Canonical> = {
  // ES
  cotizaciones: 'quotes',
  pagos: 'payments',
  servicios: 'services',
  ajustes: 'settings',
  dashboard: 'dashboard',
  // EN / canonicals
  quotes: 'quotes',
  payments: 'payments',
  services: 'services',
  settings: 'settings',
};

// JWT
async function verifyJWT(token: string): Promise<{ permissions?: string[] } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { permissions?: string[] };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest, _event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  console.log('🛡️ Middleware:', pathname);

  // --- Arcjet ---
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);
    console.log('Arcjet:', decision);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const isAuthPage = AUTH_PAGES.some((r) => r.test(pathname));

  const token = request.cookies.get('auth_token')?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const detectedLocale = localeMatch ? localeMatch[1] : 'es';

  // Normalizar permisos
  const permissions = (payload?.permissions ?? [])
    .map((p) => (typeof p === 'string' ? p.trim().toLowerCase() : ''))
    .filter(Boolean);

  const hasAdminPanel = permissions.includes('admin');
  const hasClientPanel = permissions.includes('client') || permissions.includes('cliente');

  // --- Normalizar slugs públicos al nuevo esquema /admin ---
  // Soporta: /cotizaciones -> /es/admin/quotes (si admin) o /es/client/dashboard (si client)
  const segments = pathname.replace(/^\//, '').split('/');
  const hasLocalePrefix = /^[a-z]{2}$/.test(segments[0] || '');
  const head = hasLocalePrefix ? (segments[1] || '') : (segments[0] || '');
  const tail = hasLocalePrefix ? segments.slice(2) : segments.slice(1);
  const publicCanonical = PUBLIC_SLUG_MAP[(head || '').toLowerCase()] || null;

  let effectivePathname = pathname;
  let rewriteTarget: string | null = null;

  // Redirección amigable: /admin -> /admin/dashboard (respetando locale)
  const isAdminRoot = /^\/(?:[a-z]{2}\/)?admin\/?$/.test(pathname);
  if (isAdminRoot) {
    const locale = detectedLocale;
    const target = `/${locale}/admin/dashboard`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Redirección amigable: /client -> /client/dashboard (opcional; ajusta si tu dashboard cliente vive ahí)
  const isClientRoot = /^\/(?:[a-z]{2}\/)?client\/?$/.test(pathname);
  if (isClientRoot) {
    const locale = detectedLocale;
    const target = `/${locale}/client/dashboard`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Redirección desde raíz a panel según permisos
  const isRoot = pathname === '/' || /^\/[a-z]{2}\/?$/.test(pathname);
  if (isRoot) {
    const locale = detectedLocale;
    const target = hasAdminPanel
      ? `/${locale}/admin/dashboard`
      : hasClientPanel
      ? `/${locale}/client/dashboard`
      : `/${locale}/sign-in`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  // Reescritura de slugs públicos (mantiene URL pública)
  if (publicCanonical) {
    const locale = detectedLocale;
    const suffix = tail.length ? `/${tail.join('/')}` : '';

    if (publicCanonical === 'dashboard') {
      if (hasAdminPanel) {
        rewriteTarget = `/${locale}/admin/dashboard${suffix}`;
      } else if (hasClientPanel) {
        rewriteTarget = `/${locale}/client/dashboard${suffix}`;
      } else {
        rewriteTarget = `/${locale}/sign-in`;
      }
    } else {
      // quotes | payments | services | settings
      if (hasAdminPanel) {
        rewriteTarget = `/${locale}/admin/${publicCanonical}${suffix}`;
      } else if (hasClientPanel) {
        // No hay sección equivalente en cliente -> enviar a dashboard cliente
        rewriteTarget = `/${locale}/client/dashboard`;
      } else {
        rewriteTarget = `/${locale}/sign-in`;
      }
    }

    if (rewriteTarget) {
      const url = new URL(rewriteTarget, request.url);
      effectivePathname = url.pathname; // usar para las validaciones de abajo
    }
  }

  // ¿Está protegida la ruta efectiva?
  const isProtected = PROTECTED_ROUTES.some((r) => r.test(effectivePathname));
  console.log('Ruta protegida:', isProtected, '->', effectivePathname);

  // --- Verificación JWT (salta en devMode) ---
  if (isProtected && devMode !== 'true') {
    if (!token || !payload) {
      const signInUrl = new URL(`/${detectedLocale}/sign-in`, request.url);
      console.log(`🔁 Redirect a ${signInUrl.href}`);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Validación de panel según permisos
  const matchesAdminRoute = ADMIN_ROUTES.some((r) => r.test(effectivePathname));
  const matchesClientRoute = CLIENT_ROUTES.some((r) => r.test(effectivePathname));

  if (matchesAdminRoute && !hasAdminPanel) {
    const fallback = hasClientPanel ? `/${detectedLocale}/client/dashboard` : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  if (matchesClientRoute && !hasClientPanel) {
    const fallback = hasAdminPanel ? `/${detectedLocale}/admin/dashboard` : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  // Aplicar reescritura (si hubo slug público)
  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.url));
  }

  // --- Evitar bucle: no aplicar i18n en auth pages ---
  if (isAuthPage) {
    if (!/^\/[a-z]{2}\//.test(pathname)) {
      const defaultLocale = 'es';
      const localeUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
      return NextResponse.redirect(localeUrl);
    }
    return NextResponse.next();
  }

  // Flujo normal con i18n
  return handleI18nRouting(request);
}

export const config = {
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
