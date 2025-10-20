import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { detectBot } from '@arcjet/next';
import arcjet from '@/libs/Arcjet';
import createMiddleware from 'next-intl/middleware';
import { routing } from './libs/I18nRouting';
import { jwtVerify } from 'jose';

const devMode = process.env.NEXT_DEV_MODE;

// Configuración i18n
const handleI18nRouting = createMiddleware(routing);

// Seguridad con Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
  }),
);

const PROTECTED_ROUTES = [
  /^\/$/,
  /^\/client(?:\/.*)?$/,
  /^\/(dashboard|settings|quotes|payments|services)(?:\/.*)?$/,
  /^\/[a-z]{2}\/$/, // protege /es o /en
  /^\/[a-z]{2}\/client(?:\/.*)?$/,
  /^\/[a-z]{2}\/(dashboard|settings|quotes|payments|services)(?:\/.*)?$/,
];

const ADMIN_ROUTES = [
  /^\/(dashboard|settings|quotes|payments|services)(?:\/.*)?$/,
  /^\/[a-z]{2}\/(dashboard|settings|quotes|payments|services)(?:\/.*)?$/,
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

// Verificar JWT
async function verifyJWT(token: string): Promise<{ permissions?: string[] } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as { permissions?: string[] };
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  console.log('🛡️ Middleware ejecutado en:', pathname);

  // --- Protección Arcjet ---
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);
    console.log('Arcjet decision:', decision);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const isProtected = PROTECTED_ROUTES.some((r) => r.test(pathname));
  console.log('Ruta protegida:', isProtected);
  const isAuthPage = AUTH_PAGES.some((r) => r.test(pathname));

  const token = request.cookies.get('auth_token')?.value ?? null;
  let payload: { permissions?: string[] } | null = null;

  if (token) {
    payload = await verifyJWT(token);
  }

  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const detectedLocale = localeMatch ? localeMatch[1] : 'es';

  // --- Verificación JWT ---
  if (isProtected && devMode !== 'true') {
    if (!token || !payload) {
      const signInUrl = new URL(`/${detectedLocale}/sign-in`, request.url);
      console.log(`🔁 Redirigiendo a ${signInUrl.href}`);
      return NextResponse.redirect(signInUrl);
    }
  }

  const permissions = payload?.permissions ?? [];
  const normalized = permissions
    .map((permission) => (typeof permission === 'string' ? permission.trim().toLowerCase() : ''))
    .filter((permission) => permission.length > 0);

  const hasAdminPanel = normalized.includes('admin');
  const hasClientPanel = normalized.includes('cliente') || normalized.includes('client');

  const matchesAdminRoute = ADMIN_ROUTES.some((route) => route.test(pathname));
  const matchesClientRoute = CLIENT_ROUTES.some((route) => route.test(pathname));

  if (matchesAdminRoute && !hasAdminPanel) {
    const fallback = hasClientPanel ? `/${detectedLocale}` : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  if (matchesClientRoute && !hasClientPanel) {
    const fallback = hasAdminPanel ? `/${detectedLocale}/dashboard` : `/${detectedLocale}/sign-in`;
    return NextResponse.redirect(new URL(fallback, request.url));
  }

  // --- Evitar bucle: no aplicar handleI18nRouting en páginas de auth ---
  if (isAuthPage) {
    // Si no tiene locale, agregarlo solo una vez
    if (!pathname.match(/^\/[a-z]{2}\//)) {
      const defaultLocale = 'es';
      const localeUrl = new URL(`/${defaultLocale}${pathname}`, request.url);
      return NextResponse.redirect(localeUrl);
    }

    // Si ya tiene locale, dejar pasar SIN reenrutar
    return NextResponse.next();
  }

  // --- Continuar flujo normal con i18n ---
  return handleI18nRouting(request);
}

// Configuración matcher
export const config = {
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
