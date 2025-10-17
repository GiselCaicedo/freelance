import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { PostHogProvider } from '@/shared/components/analytics/PostHogProvider';
import { AlertsProvider } from '@/shared/components/common/AlertsProvider';
import { EnterpriseProvider } from '@/libs/acl/EnterpriseProvider';
import PermissionProvider from '@/libs/acl/PermissionProvider';
import { routing } from '@/libs/I18nRouting';
import { verifyToken } from '@/libs/Auth';
import '@/styles/global.css';

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

  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const token = cookies().get('auth_token')?.value || '';

  const messages = await getMessages({ locale });

  const payload = token ? await verifyToken<{
    permissions?: string[];
    empresaid?: string;
    empresa?: string;
  }>(token) : null;

  const permissions = payload?.permissions ?? [];
  const empresaId = payload?.empresaid ?? null;
  const empresaName = payload?.empresa ?? null;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
          <PostHogProvider>
            <AlertsProvider>
              <EnterpriseProvider empresaId={empresaId} empresaName={empresaName}>
                <PermissionProvider permissions={permissions}>
                  {props.children}
                </PermissionProvider>
              </EnterpriseProvider>
            </AlertsProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
