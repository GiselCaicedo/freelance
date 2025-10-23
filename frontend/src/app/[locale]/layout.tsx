import type { Metadata } from 'next';
import { EnterpriseProvider } from '@core/libs/acl/EnterpriseProvider';
import PermissionProvider from '@core/libs/acl/PermissionProvider';
import { verifyToken } from '@core/libs/Auth';
import { routing } from '@core/libs/I18nRouting';
import { AlertsProvider } from '@shared/components/common/AlertsProvider';
import { normalizeRoleCategory } from '@shared/utils/roles';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import '@styles/global.css';

export const metadata: Metadata = {
  icons: [
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    { rel: 'icon', url: '/favicon.ico' },
  ],
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || '';

  const messages = await getMessages({ locale });

  const payload = token
    ? await verifyToken<{
        permissions?: unknown;
        roleCategory?: unknown;
        role_category?: unknown;
        panel?: unknown;
        empresaid?: string;
        empresa?: string;
      }>(token)
    : null;

  const permissionsRaw = Array.isArray(payload?.permissions) ? payload?.permissions : [];
  const permissionsList = permissionsRaw.filter((permission): permission is string => typeof permission === 'string');

  const roleCategoryRaw
    = typeof payload?.roleCategory === 'string'
      ? payload.roleCategory
      : typeof payload?.role_category === 'string'
        ? payload.role_category
        : typeof payload?.panel === 'string'
          ? payload.panel
          : null;

  const normalizedRoleCategory = normalizeRoleCategory(roleCategoryRaw);

  const augmentedPermissions = new Set(permissionsList.map(permission => permission.trim().toLowerCase()));

  if (normalizedRoleCategory === 'admin') {
    augmentedPermissions.add('admin');
  }

  if (normalizedRoleCategory === 'client') {
    augmentedPermissions.add('client');
    augmentedPermissions.add('cliente');
  }

  const permissions = Array.from(augmentedPermissions);
  const empresaId = payload?.empresaid ?? null;
  const empresaName = payload?.empresa ?? null;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <AlertsProvider>
            <EnterpriseProvider empresaId={empresaId} empresaName={empresaName}>
              <PermissionProvider permissions={permissions}>
                {props.children}
              </PermissionProvider>
            </EnterpriseProvider>
          </AlertsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
