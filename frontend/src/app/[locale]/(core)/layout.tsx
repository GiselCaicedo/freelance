'use client';
<<<<<<< HEAD

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, CreditCard, FileText, Home, Menu, Settings, Zap } from 'lucide-react';
import LogoutButton from '@/components/auth/LogoutButton';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { usePermission } from '@/libs/acl/PermissionProvider';
import { BaseTemplate } from '@/templates/BaseTemplate';

type NavItem = {
  slug: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string | null;
};

export default function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { can } = usePermission();
  const { empresaName } = useEnterprise();
  const { locale: rawLocale } = useParams() as { locale: string };
  const locale = rawLocale ?? 'es';
  const pathname = usePathname();
  const t = useTranslations('Layout');
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const navStateRef = useRef(isNavOpen);
  const manualStateRef = useRef(isNavOpen);

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

    return () => { };
  }, []);

  const navItems = useMemo<NavItem[]>(
    () => [
      { slug: 'dashboard', label: t('nav.dashboard'), icon: Home, permission: null },
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
    if (slug === 'dashboard') {
      return `/${locale}/dashboard`;
    }

    return `/${locale}/${slug}`;
  };

  const isActive = (slug: string) => {
    if (slug === 'dashboard') {
      const base = `/${locale}`;
      return (
        pathname === base ||
        pathname === `${base}/` ||
        pathname.startsWith(`${base}/dashboard`)
      );
    }

    const target = `/${locale}/${slug}`;
    return pathname === target || pathname.startsWith(`${target}/`);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.slug);
    const href = buildHref(item.slug);
    return (
      <Link
        href={href}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
          }`}
        title={!isNavOpen ? item.label : ''}
      >
        <item.icon
          className={`w-5 h-5 transition-all duration-200 flex-shrink-0 ${active ? 'text-emerald-500' : 'text-gray-400 group-hover:text-emerald-500'
=======
import React, { useState } from 'react';
import { usePermission } from '@/libs/acl/PermissionProvider';
import Link from 'next/link';
import LogoutButton from '@/components/auth/LogoutButton';
import { BaseTemplate } from '@/templates/BaseTemplate';
import { useTranslations } from 'next-intl';
import { ChevronDown, Settings, LogOut, Home, CreditCard, FileText, Zap, Menu, X } from 'lucide-react';
import { useEnterprise } from '@/libs/acl/EnterpriseProvider';
import { usePathname } from 'next/navigation';

export default function CoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { can, token } = usePermission();
  const { empresaName } = useEnterprise();
  const t = useTranslations('RootLayout');
  const pathname = usePathname();
  const [isEnterpriseOpen, setIsEnterpriseOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(true);

  const isActive = (href: string) => pathname.includes(href);

  const menuItems = [
    { href: 'dashboard', label: 'Inicio', icon: Home, permission: null },
    { href: 'services', label: 'Servicios', icon: Zap, permission: 'service' },
    { href: 'payments', label: 'Pagos', icon: CreditCard, permission: 'pay' },
    { href: 'quotes', label: 'Cotizaciones', icon: FileText, permission: 'quote' },
  ];

  const bottomMenuItems = [
    { href: 'settings', label: 'Configuración', icon: Settings, permission: 'config' },
  ];

  const NavLink = ({ href, label, icon: Icon }: any) => {
    const active = isActive(href);
    return (
      <Link
        href={`/${locale}/${href}`}
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${active
          ? 'bg-emerald-50 text-emerald-700 font-medium'
          : 'text-gray-600 hover:bg-gray-50'
          }`}
        title={!isNavOpen ? label : ''}
      >
        <Icon
          className={`w-5 h-5 transition-all duration-200 flex-shrink-0 ${active
            ? 'text-emerald-500'
            : 'text-gray-400 group-hover:text-emerald-500'
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
            }`}
        />
        {isNavOpen && (
          <>
<<<<<<< HEAD
            <span className="text-sm flex-1 truncate">{item.label}</span>
            {active && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l" />
=======
            <span className="text-sm flex-1 truncate">{label}</span>
            {active && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l"></div>
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <BaseTemplate
      leftNav={
<<<<<<< HEAD
        <div className={`flex h-full flex-col bg-white transition-all duration-300 ${isNavOpen ? 'w-52' : 'w-16'}`}>
          <div
            className={`flex ${isNavOpen ? 'justify-end px-2 pt-2' : 'justify-center pt-2'}`}
          >
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-1.5 rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              title={isNavOpen ? t('nav.collapse') : t('nav.expand')}
            >
              {isNavOpen ? (
                <ChevronDown className="h-4 w-4 rotate-90" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
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

          {isNavOpen && (
            <div className="px-3 py-3">
              <button
                onClick={() => setIsEnterpriseOpen(!isEnterpriseOpen)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-sm transition-all duration-200 ${isEnterpriseOpen
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
                  }`}
                title={t('enterprise.switcherLabel')}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded bg-emerald-500">
                    <span className="text-xs font-bold text-white">C</span>
                  </div>
                  <span className="truncate text-xs font-medium text-gray-700">
                    {empresaName || t('enterprise.placeholder')}
                  </span>
                </div>
                <ChevronDown
                  className={`h-3.5 w-3.5 flex-shrink-0 text-gray-500 transition-transform duration-300 ${isEnterpriseOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>
            </div>
          )}

          <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
            {navItems.map((item) =>
              !item.permission || can(item.permission) ? <NavLink key={item.slug} item={item} /> : null,
            )}
          </nav>

          <div className="space-y-1 border-t border-gray-200 px-2 py-3">
            {settingsItems.map((item) =>
              !item.permission || can(item.permission) ? <NavLink key={item.slug} item={item} /> : null,
            )}
            <LogoutButton isNavOpen={isNavOpen} className="transition-all duration-200" />
=======
        <div className={`flex flex-col h-full transition-all duration-300 ${isNavOpen ? 'w-50' : 'w-16'} bg-white `}>
          {/* Header con toggle */}
          <div className="flex justify-center">
            <button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-600 hover:text-gray-900 flex-shrink-0"
              title={isNavOpen ? 'Contraer menú' : 'Expandir menú'}
            >
              {isNavOpen ? (
                <ChevronDown className="w-4 h-4 rotate-90" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="flex justify-center px-3 py-5 border-b border-gray-200">
            {isNavOpen && (
              <div className="flex  gap-2 min-w-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">C</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-gray-900 leading-tight">CIFRA</span>
                  <span className="text-xs font-bold text-gray-900 leading-tight">PAY</span>
                </div>
              </div>
            )}

          </div>

          {/* Enterprise Selector */}
          {isNavOpen && (
            <div className="px-3 py-3 ">
              <button
                onClick={() => setIsEnterpriseOpen(!isEnterpriseOpen)}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-sm transition-all duration-200 ${isEnterpriseOpen
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-white'
                  }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">C</span>
                  </div>
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {empresaName || 'EMPRESA'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${isEnterpriseOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown menu
              {isEnterpriseOpen && (
                <div className="absolute left-3 right-3 mt-2 bg-white border border-gray-200 rounded-lg z-50 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-1 max-h-48 overflow-y-auto">
                    <button className="w-full text-left px-2.5 py-2 text-xs text-gray-700 hover:bg-emerald-50 rounded transition-colors">
                      {empresaName || 'EMPRESA'}
                    </button>
                  </div>
                </div>
              )} */}
            </div>
          )}

          {/* Main Menu */}
          <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) =>
              !item.permission || can(item.permission) ? (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ) : null
            )}
          </nav>

          {/* Footer Menu y Logout */}
          <div className="border-t border-gray-200 px-2 py-3 space-y-1">
            {bottomMenuItems.map((item) =>
              !item.permission || can(item.permission) ? (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ) : null
            )}

            <LogoutButton
              isNavOpen={isNavOpen}
              className="transition-all duration-200"
            />

>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
          </div>
        </div>
      }
    >
      {children}
    </BaseTemplate>
  );
<<<<<<< HEAD
}

=======
}
>>>>>>> db7e40d232016157f662ce52dc4b65c786d02ea8
