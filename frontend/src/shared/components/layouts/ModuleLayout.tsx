'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, CreditCard, FileText, Home, Menu, Settings, Users, Zap } from 'lucide-react';
import LogoutButton from '@/shared/components/auth/LogoutButton';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { usePermission } from '@/libs/acl/PermissionProvider';
import { BaseTemplate } from '@/shared/templates/BaseTemplate';

type NavItem = {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | null;
};

type ModuleLayoutProps = {
  variant: 'admin' | 'client';
  children: React.ReactNode;
};

export default function ModuleLayout({ variant, children }: ModuleLayoutProps) {
  const { can } = usePermission();
  const { empresaName } = useEnterprise();
  const { locale: rawLocale } = useParams() as { locale: string };
  const locale = rawLocale ?? 'es';
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Layout');

  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const navStateRef = useRef(isNavOpen);
  const manualStateRef = useRef(isNavOpen);

  const canAccessAdminPanel = useMemo(() => can('admin'), [can]);
  const canAccessClientPanel = useMemo(() => can('cliente') || can('client'), [can]);

  useEffect(() => {
    const isAdmin = variant === 'admin';
    if (isAdmin && !canAccessAdminPanel) {
      const fallback = canAccessClientPanel ? `/${locale}/client/inicio` : `/${locale}/sign-in`;
      router.replace(fallback);
    }
    if (!isAdmin && !canAccessClientPanel) {
      const fallback = canAccessAdminPanel ? `/${locale}/dashboard` : `/${locale}/sign-in`;
      router.replace(fallback);
    }
  }, [variant, canAccessAdminPanel, canAccessClientPanel, locale, router]);

  useEffect(() => {
    navStateRef.current = isNavOpen;
  }, [isNavOpen]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ open: boolean }>).detail;
      if (!detail) return;

      if (detail.open) {
        manualStateRef.current = navStateRef.current;
        setIsNavOpen(false);
      } else {
        setIsNavOpen(manualStateRef.current);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('app:sidepanel', handler as EventListener);
      return () => window.removeEventListener('app:sidepanel', handler as EventListener);
    }

    return () => {};
  }, []);

  const navItems = useMemo<NavItem[]>(
    () => [
      { slug: 'dashboard', label: t('nav.dashboard'), icon: Home, permission: null },
      // Mostrar Clientes en el panel admin sin requerir permiso específico distinto a 'admin'
      { slug: 'clients', label: t('nav.clients'), icon: Users, permission: 'admin' },
      { slug: 'services', label: t('nav.services'), icon: Zap, permission: 'service' },
      { slug: 'payments', label: t('nav.payments'), icon: CreditCard, permission: 'pay' },
      { slug: 'quotes', label: t('nav.quotes'), icon: FileText, permission: 'invoice' },
    ],
    [t],
  );

  const settingsItems = useMemo<NavItem[]>(
    () => [
      { slug: 'settings', label: t('nav.settings'), icon: Settings, permission: 'config' },
    ],
    [t],
  );

  const buildHref = (slug: string) => {
    if (variant === 'admin') {
      if (slug === 'dashboard') {
        return `/${locale}/admin/dashboard`;
      }
      return `/${locale}/admin/${slug}`;
    }
    // client panel
    if (slug === 'dashboard') {
      return `/${locale}/client/dashboard`;
    }
    return `/${locale}/client/${slug}`;
  };

  const isActive = (slug: string) => {
    if (variant === 'admin') {
      if (slug === 'dashboard') {
        const base = `/${locale}/admin/dashboard`;
        return pathname === base || pathname.startsWith(`${base}`);
      }
      const target = `/${locale}/admin/${slug}`;
      return pathname === target || pathname.startsWith(`${target}/`);
    }
    // client panel
    if (slug === 'dashboard') {
      const base = `/${locale}/client/dashboard`;
      return pathname === base || pathname.startsWith(`${base}`);
    }
    const target = `/${locale}/client/${slug}`;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.slug);
    const href = buildHref(item.slug);
    return (
      <Link
        href={href}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
          active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
        }`}
        title={!isNavOpen ? item.label : ''}
      >
        <item.icon
          className={`w-5 h-5 transition-all duration-200 flex-shrink-0 ${
            active ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'
          }`}
        />
        {isNavOpen && (
          <>
            <span className="text-sm flex-1 truncate">{item.label}</span>
            {active && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l" />
            )}
          </>
        )}
      </Link>
    );
  };

  const missingAdmin = variant === 'admin' && !canAccessAdminPanel;
  const missingClient = variant !== 'admin' && !canAccessClientPanel;
  if (missingAdmin || missingClient) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        {t('nav.redirecting') ?? 'Redirigiendo…'}
      </div>
    );
  }

  return (
    <BaseTemplate
      leftNav={
        <div className={`flex h-full flex-col bg-white transition-all duration-300 ${isNavOpen ? 'w-52' : 'w-16'}`}>
          <div className={`flex ${isNavOpen ? 'justify-end px-2 pt-2' : 'justify-center pt-2'}`}>
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-1.5 rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title={isNavOpen ? t('nav.collapse') : t('nav.expand')}
            >
              {isNavOpen ? <ChevronDown className="h-4 w-4 rotate-90" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex justify-center border-b border-gray-200 px-3 py-5">
            {isNavOpen && (
              <div className="flex min-w-0 gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
                  <span className="text-sm font-bold text-white">C</span>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-bold leading-tight text-gray-900">CIFRA</span>
                  <span className="text-xs font-bold leading-tight text-gray-900">PAY</span>
                </div>
              </div>
            )}
          </div>

          {/* {isNavOpen && (
            <div className="px-3 py-3">
              <button
                onClick={() => setIsEnterpriseOpen(!isEnterpriseOpen)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition-all duration-200 ${
                  isEnterpriseOpen ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                }`}
                title={t('enterprise.switcherLabel')}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-emerald-500">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  <span className="truncate text-xs font-medium text-gray-700">{empresaName || t('enterprise.placeholder')}</span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-transform duration-300 ${
                    isEnterpriseOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )} */}

          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            {navItems.map((item) => (!item.permission || can(item.permission) ? <NavLink key={item.slug} item={item} /> : null))}
          </nav>

          <div className="space-y-1 border-t border-gray-200 px-2 py-3">
            {settingsItems.map((item) => (!item.permission || can(item.permission) ? <NavLink key={item.slug} item={item} /> : null))}
            <LogoutButton isNavOpen={isNavOpen} className="transition-all duration-200" />
          </div>
        </div>
      }
    >
      {children}
    </BaseTemplate>
  );
}

