'use client';
import React, { useEffect, useRef, useState } from 'react';
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

    return () => {};
  }, []);

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
            }`}
        />
        {isNavOpen && (
          <>
            <span className="text-sm flex-1 truncate">{label}</span>
            {active && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-l"></div>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <BaseTemplate
      leftNav={
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

          </div>
        </div>
      }
    >
      {children}
    </BaseTemplate>
  );
}