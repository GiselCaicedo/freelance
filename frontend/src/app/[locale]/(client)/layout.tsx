'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePermission } from '@/libs/acl/PermissionProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { can } = usePermission();
  const { locale } = useParams() as { locale: string };
  const router = useRouter();
  const t = useTranslations('Client.Layout');

  const canAccessClient = useMemo(() => can('cliente') || can('client'), [can]);
  const canAccessAdmin = useMemo(() => can('admin'), [can]);

  useEffect(() => {
    if (!canAccessClient) {
      const fallback = canAccessAdmin ? `/${locale}/dashboard` : `/${locale}/sign-in`;
      router.replace(fallback);
    }
  }, [canAccessAdmin, canAccessClient, locale, router]);

  if (!canAccessClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
        {t('redirecting')}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">{t('badge')}</p>
            <h1 className="text-lg font-semibold text-white/90">{t('title')}</h1>
          </div>

          {canAccessAdmin && (
            <Link
              href={`/${locale}/dashboard`}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 transition hover:border-emerald-300/60 hover:text-white"
            >
              {t('adminCta')}
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
