'use client';

import { createContext, use, useMemo } from 'react';

type Ctx = {
  permissions: Set<string>;
  can: (p: string) => boolean; // lectura
  canAny: (list: string[]) => boolean; // al menos uno
  canAll: (list: string[]) => boolean; // todos
};

const PermissionCtx = createContext<Ctx | null>(null);

const normalizePermission = (value: string) => value.trim().toLowerCase();

export default function PermissionProvider({
  permissions,
  children,
}: {
  permissions: string[];
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    const normalized = permissions.map(permission => normalizePermission(permission));
    const set = new Set(normalized);

    const can = (p: string) => {
      const key = normalizePermission(p);
      const hasPermission = set.has(key);
      console.log(`[PermissionProvider]: "${p}" - Resultado: ${hasPermission}`);
      return hasPermission;
    };

    const canAny = (list: string[]) => {
      const result = list.some(can);
      console.log(`[PermissionProvider - Any]: ${JSON.stringify(list)} - Resultado: ${result}`);
      return result;
    };

    const canAll = (list: string[]) => {
      const result = list.every(can);
      console.log(`[PermissionProvider - All]: ${JSON.stringify(list)} - Resultado: ${result}`);
      return result;
    };

    console.log(`Permisos adquiritos: ${JSON.stringify(permissions)}`);
    return { permissions: set, can, canAny, canAll };
  }, [permissions]);

  return <PermissionCtx value={value}>{children}</PermissionCtx>;
}

export function usePermission() {
  const ctx = use(PermissionCtx);
  if (!ctx) {
    throw new Error('PermissionProvider must be used inside provider');
  }
  return ctx;
}
