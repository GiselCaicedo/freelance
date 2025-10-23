import type { NextFetchEvent, NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import arcjet from '@core/libs/Arcjet';
import { routing } from '@core/libs/I18nRouting';
import { normalizeRoleCategory } from '@shared/utils/roles';
import { jwtVerify } from 'jose';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';

const devMode = process.env.NEXT_DEV_MODE === 'true';

// i18n
const handleI18nRouting = createMiddleware(routing);

// Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
  }),
);

// --- Rutas protegidas ---
const PROTECTED_ROUTES = [
  /^\/$/,
  /^\/admin(?:\/.*)?$/,
  /^\/client(?:\/.*)?$/,
  /^\/[a-z]{2}\/$/,
  /^\/[a-z]{2}\/admin(?:\/.*)?$/,
  /^\/[a-z]{2}\/client(?:\/.*)?$/,
];

const ADMIN_ROUTES = [
  /^\/admin(?:\/.*)?$/,
  /^\/[a-z]{2}\/admin(?:\/.*)?$/,
];

const CLIENT_ROUTES = [
  /^\/client(?:\/.*)?$/,
  /^\/[a-z]{2}\/client(?:\/.*)?$/,
];

const AUTH_PAGES = [
  /^\/sign-in(.*)/,
  /^\/[a-z]{2}\/sign-in(.*)/,
  /^\/sign-up(.*)/,
  /^\/[a-z]{2}\/sign-up(.*)/,
];

type Canonical = 'dashboard' | 'quotes' | 'payments' | 'services' | 'settings';
const PUBLIC_SLUG_MAP: Record<string, Canonical> = {
  cotizaciones: 'quotes',
  pagos: 'payments',
  servicios: 'services',
  ajustes: 'settings',
  dashboard: 'dashboard',
  quotes: 'quotes',
  payments: 'payments',
  services: 'services',
  settings: 'settings',
};

// JWT
type JwtPayload = {
  permissions?: unknown;
  roleCategory?: unknown;
  role_category?: unknown;
  panel?: unknown;
};

async function verifyJWT(token: string): Promise<JwtPayload | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as JwtPayload;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest, _event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  console.log('🛡️ Middleware:', pathname);

  // Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const isAuthPage = AUTH_PAGES.some(r => r.test(pathname));

  const token = request.cookies.get('auth_token')?.value ?? null;
  const payload = token ? await verifyJWT(token) : null;

  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const detectedLocale = localeMatch ? localeMatch[1] : 'es';

  // Normalizar permisos
  const permissionList = Array.isArray(payload?.permissions) ? payload.permissions : [];
  const permissions = permissionList
    .map(p => (typeof p === 'string' ? p.trim().toLowerCase() : ''))
    .filter(Boolean);

  const roleCategoryRaw
    = typeof payload?.roleCategory === 'string'
      ? payload.roleCategory
      : typeof payload?.role_category === 'string'
        ? payload.role_category
        : typeof payload?.panel === 'string'
          ? payload.panel
          : null;

  const normalizedRoleCategory
    = normalizeRoleCategory(roleCategoryRaw)?.toLowerCase?.() || '';

  const hasAdminPanel
    = normalizedRoleCategory === 'admin' || permissions.includes('admin');
  const hasClientPanel
    = normalizedRoleCategory === 'client'
      || permissions.includes('client')
      || permissions.includes('cliente');

  // --- Logs de diagnóstico ---
  console.log('[MW]', {
    path: pathname,
    hasCookie: Boolean(token),
    hasPayload: Boolean(payload),
    roleCat: roleCategoryRaw,
    normRoleCat: normalizedRoleCategory,
  });

  // --- Redirecciones de raíz y alias públicos ---
  const segments = pathname.replace(/^\//, '').split('/');
  const hasLocalePrefix = /^[a-z]{2}$/.test(segments[0] || '');
  const head = hasLocalePrefix ? segments[1] || '' : segments[0] || '';
  const tail = hasLocalePrefix ? segments.slice(2) : segments.slice(1);
  const publicCanonical = PUBLIC_SLUG_MAP[(head || '').toLowerCase()] || null;

  let effectivePathname = pathname;
  let rewriteTarget: string | null = null;

  const isAdminRoot = /^\/(?:[a-z]{2}\/)?admin\/?$/.test(pathname);
  if (isAdminRoot) {
    const target = `/${detectedLocale}/admin/dashboard`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isClientRoot = /^\/(?:[a-z]{2}\/)?client\/?$/.test(pathname);
  if (isClientRoot) {
    const target = `/${detectedLocale}/client/dashboard`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  const isRoot = pathname === '/' || /^\/[a-z]{2}\/?$/.test(pathname);
  if (isRoot) {
    const target = hasAdminPanel
      ? `/${detectedLocale}/admin/dashboard`
      : hasClientPanel
        ? `/${detectedLocale}/client/dashboard`
        : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(target, request.url));
  }

  if (publicCanonical) {
    const suffix = tail.length ? `/${tail.join('/')}` : '';
    if (publicCanonical === 'dashboard') {
      rewriteTarget = hasAdminPanel
        ? `/${detectedLocale}/admin/dashboard${suffix}`
        : hasClientPanel
          ? `/${detectedLocale}/client/dashboard${suffix}`
          : `/${detectedLocale}/sign-in`;
    } else {
      rewriteTarget = hasAdminPanel
        ? `/${detectedLocale}/admin/${publicCanonical}${suffix}`
        : hasClientPanel
          ? `/${detectedLocale}/client/dashboard`
          : `/${detectedLocale}/sign-in`;
    }
    if (rewriteTarget) {
      const url = new URL(rewriteTarget, request.url);
      effectivePathname = url.pathname;
    }
  }

  // ¿Ruta protegida?
  const isProtected = PROTECTED_ROUTES.some(r => r.test(effectivePathname));

  // Verificación JWT
  if (isProtected && !devMode) {
    if (!token || !payload) {
      const signInUrl = new URL(`/${detectedLocale}/sign-in`, request.url);
      console.log(`🔁 Redirect a ${signInUrl.href}`);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Validar panel según permisos
  const matchesAdminRoute = ADMIN_ROUTES.some(r => r.test(effectivePathname));
  const matchesClientRoute = CLIENT_ROUTES.some(r => r.test(effectivePathname));

  if (matchesAdminRoute && !hasAdminPanel) {
    const fallback = hasClientPanel
      ? `/${detectedLocale}/client/dashboard`
      : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  if (matchesClientRoute && !hasClientPanel) {
    const fallback = hasAdminPanel
      ? `/${detectedLocale}/admin/dashboard`
      : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  // Reescritura
  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.url));
  }

  // Evitar bucle i18n
  if (isAuthPage) {
    if (!/^\/[a-z]{2}\//.test(pathname)) {
      const localeUrl = new URL(`/es${pathname}`, request.url);
      return NextResponse.redirect(localeUrl);
    }
    return NextResponse.next();
  }

  // Normal
  return handleI18nRouting(request);
}

export const config = {
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
