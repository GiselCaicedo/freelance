'use client';

import { buildSettingsHref, SETTINGS_NAV } from '@shared/settings/navigation';
import { TRANSITION_COLORS } from '@shared/styles/transitions';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

type SettingsTabsProps = {
  className?: string;
};

export function SettingsTabs({ className }: SettingsTabsProps) {
  const pathname = usePathname();
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (!pathname) {
      return false;
    }
    const href = buildSettingsHref(pathname, path);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (groupId: string) => {
    const group = SETTINGS_NAV.find(g => g.id === groupId);
    return group?.items.some(item => isActive(item.path)) ?? false;
  };

  const handleGroupClick = (groupId: string) => {
    // Si el grupo ya está expandido, cerrarlo
    if (activeGroup === groupId) {
      setActiveGroup(null);
    } else {
      // Si no, abrir este y cerrar cualquier otro
      setActiveGroup(groupId);
    }
  };

  return (
    <nav
      className={clsx('border-b border-slate-200', className)}
      aria-label="Navegación de ajustes"
    >
      {/* Tabs de grupos principales */}
      <div className="flex items-center gap-1 overflow-x-auto">
        {SETTINGS_NAV.map((group) => {
          const hasActiveItem = isGroupActive(group.id);
          const isExpanded = activeGroup === group.id;

          return (
            <button
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              className={clsx(
                'flex items-center gap-2 rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap',
                TRANSITION_COLORS,
                hasActiveItem || isExpanded
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                  : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              {group.title}
              <svg
                className={clsx(
                  'h-4 w-4 transition-transform',
                  isExpanded ? 'rotate-180' : '',
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Tabs de items hijos (sub-navegación) */}
      {SETTINGS_NAV.map((group) => {
        const isExpanded = activeGroup === group.id;

        if (!isExpanded) {
          return null;
        }

        return (
          <div
            key={`${group.id}-items`}
            className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 bg-slate-50 px-2"
          >
            {group.items.map((item) => {
              const href = buildSettingsHref(pathname, item.path);
              const active = isActive(item.path);

              return (
                <Link
                  key={item.id}
                  href={href}
                  className={clsx(
                    'px-3 py-2 text-xs font-medium whitespace-nowrap',
                    TRANSITION_COLORS,
                    active
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-emerald-600',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
