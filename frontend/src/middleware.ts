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
  /^\/(dashboard|settings|quotes|payments|services)(.*)/,
  /^\/[a-z]{2}\/$/, // protege /es o /en
  /^\/[a-z]{2}\/(dashboard|settings|quotes|payments|services)(.*)/,
];


const AUTH_PAGES = [
  /^\/sign-in(.*)/,
  /^\/[a-z]{2}\/sign-in(.*)/,
  /^\/sign-up(.*)/,
  /^\/[a-z]{2}\/sign-up(.*)/,
];

// Verificar JWT
async function verifyJWT(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
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

  // --- Verificación JWT ---
  if (isProtected && devMode !== 'true') {
    const token = request.cookies.get('auth_token')?.value;
    const valid = token ? await verifyJWT(token) : false;

    if (!valid) {
      const defaultLocale = 'es';
      const signInUrl = new URL(`/${defaultLocale}/sign-in`, request.url);
      console.log(`🔁 Redirigiendo a ${signInUrl.href}`);
      return NextResponse.redirect(signInUrl);
    }
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
