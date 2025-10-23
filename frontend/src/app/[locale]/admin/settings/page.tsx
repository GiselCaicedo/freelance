'use client';

import { usePathname, useRouter } from 'next/navigation';
import type { ElementType } from 'react';
import {
  Settings,
  Shield,
  Users,
  Bell,
  Mail,
  KeyRound,
  Clock,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { buildSettingsHref, getSettingsBasePath, SETTINGS_NAV } from '@/shared/settings/navigation';

const ICONS: Record<string, ElementType> = {
  'general': Settings,
  'alerts': Bell,
  'smtp': Mail,
  'security/policy': Shield,
  'security/twofa': ShieldCheck,
  'security/password-policy': KeyRound,
  'security/session-policy': Clock,
  'security/users': Users,
  'security/roles': UserCheck,
};

export default function Configuracion() {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = getSettingsBasePath(pathname ?? undefined);

  return (
    <div className="space-y-8 py-10 px-4 sm:px-6 lg:px-12">
      <div className="grid gap-8 lg:grid-cols-3">
        {SETTINGS_NAV.map((group) => (
          <section key={group.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900">{group.title}</h2>
            <div className="mt-4 space-y-3">
              {group.items.map((item) => {
                const Icon = ICONS[item.path] ?? Settings;
                const href = buildSettingsHref(basePath, item.path);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(href)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-sm font-medium text-slate-800">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
